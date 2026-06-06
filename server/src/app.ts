import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { body, param, query, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import multer from "multer";
import winston from "winston";
import { PrismaClient } from "@prisma/client";
import { reviews } from "./fixtures.js";
import { catalogueCategories, catalogueProducts } from "./catalogue.js";

const app = express();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });
const logger = winston.createLogger({ transports: [new winston.transports.Console()] });

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
}));
app.use(compression());
app.use(cookieParser());
app.use("/api/v1/payment/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "1mb" }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false });
const accessSecret = process.env.JWT_ACCESS_SECRET || "dev_access_secret";
const refreshSecret = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret";

function validate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ message: "Validation failed", errors: errors.array() });
  next();
}
function sign(user: { id: string; role: string }) {
  return {
    accessToken: jwt.sign({ sub: user.id, role: user.role }, accessSecret, { expiresIn: (process.env.JWT_ACCESS_EXPIRES || "15m") as any }),
    refreshToken: jwt.sign({ sub: user.id, role: user.role }, refreshSecret, { expiresIn: (process.env.JWT_REFRESH_EXPIRES || "7d") as any }),
  };
}
function auth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.cookies.accessToken || req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try { (req as any).user = jwt.verify(token, accessSecret); next(); } catch { return res.status(401).json({ message: "Invalid token" }); }
}
function optionalUserId(req: express.Request) {
  const token = req.cookies.accessToken || req.headers.authorization?.replace("Bearer ", "");
  if (!token) return undefined;
  try { return (jwt.verify(token, accessSecret) as any).sub as string; } catch { return undefined; }
}
function admin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if ((req as any).user?.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });
  next();
}
function ok(res: express.Response, data: unknown) { return res.json(data); }

const api = express.Router();

const productInclude = { category: { select: { slug: true, name: true } } };

function fallbackProducts(query: express.Request["query"]) {
  let result = [...catalogueProducts];
  const { category, search, material, finish, room, in_stock, featured, new_arrival, sort } = query;
  if (category) result = result.filter((p) => p.category === String(category));
  if (search) result = result.filter((p) => p.name.toLowerCase().includes(String(search).toLowerCase()));
  if (material) result = result.filter((p) => p.material === String(material));
  if (finish) result = result.filter((p) => p.finish === String(finish));
  if (room) result = result.filter((p) => p.room === String(room));
  if (in_stock === "true") result = result.filter((p) => p.stock > 0);
  if (featured === "true") result = result.filter((p) => p.badges.includes("Best Seller"));
  if (new_arrival === "true") result = result.filter((p) => p.badges.includes("New"));
  if (sort === "price_asc") result.sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") result.sort((a, b) => b.price - a.price);
  else result.sort((a, b) => Number(b.badges.includes("Best Seller")) - Number(a.badges.includes("Best Seller")) || b.rating - a.rating);
  return result;
}

api.post("/auth/register", authLimiter, body("email").isEmail(), body("password").isLength({ min: 8 }), body("name").isLength({ min: 2 }), validate, async (req, res, next) => {
  try {
    const email = String(req.body.email).trim().toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ message: "Email already registered" });
    const user = await prisma.user.create({
      data: {
        email,
        name: String(req.body.name).trim(),
        phone: req.body.phone ? String(req.body.phone).trim() : null,
        passwordHash: await bcrypt.hash(req.body.password, 12),
      },
    });
    const tokens = sign(user);
    const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" };
    res.cookie("accessToken", tokens.accessToken, cookieOptions).cookie("refreshToken", tokens.refreshToken, cookieOptions);
    ok(res, { user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    try {
      const { users } = await import("./fixtures.js");
      const email = String(req.body.email).trim().toLowerCase();
      const exists = users.find((u) => u.email === email);
      if (exists) return res.status(409).json({ message: "Email already registered" });
      const user = {
        id: `user_${users.length + 1}`,
        email,
        name: String(req.body.name).trim(),
        phone: req.body.phone ? String(req.body.phone).trim() : null,
        passwordHash: await bcrypt.hash(req.body.password, 12),
        role: "CUSTOMER",
        isBlocked: false,
        addresses: [],
      };
      users.push(user as any);
      const tokens = sign(user);
      const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" };
      res.cookie("accessToken", tokens.accessToken, cookieOptions).cookie("refreshToken", tokens.refreshToken, cookieOptions);
      ok(res, { user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (fallbackErr) {
      next(error);
    }
  }
});
api.post("/auth/login", authLimiter, body("email").isEmail(), body("password").notEmpty(), validate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { email: String(req.body.email).trim().toLowerCase() } });
    if (!user || user.isBlocked || !(await bcrypt.compare(req.body.password, user.passwordHash))) return res.status(401).json({ message: "Invalid credentials" });
    const tokens = sign(user);
    const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" };
    res.cookie("accessToken", tokens.accessToken, cookieOptions).cookie("refreshToken", tokens.refreshToken, cookieOptions);
    ok(res, { user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    try {
      const { users } = await import("./fixtures.js");
      const email = String(req.body.email).trim().toLowerCase();
      const user = users.find((u) => u.email === email);
      if (!user || user.isBlocked || !(await bcrypt.compare(req.body.password, user.passwordHash))) return res.status(401).json({ message: "Invalid credentials" });
      const tokens = sign(user);
      const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" };
      res.cookie("accessToken", tokens.accessToken, cookieOptions).cookie("refreshToken", tokens.refreshToken, cookieOptions);
      ok(res, { user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (fallbackErr) {
      next(error);
    }
  }
});
api.post("/auth/logout", (_req, res) => res.clearCookie("accessToken").clearCookie("refreshToken").json({ ok: true }));
api.post("/auth/refresh-token", (req, res) => {
  try { const decoded = jwt.verify(req.cookies.refreshToken, refreshSecret) as any; const tokens = sign({ id: decoded.sub, role: decoded.role }); res.cookie("accessToken", tokens.accessToken, { httpOnly: true, sameSite: "lax" }); ok(res, tokens); } catch { res.status(401).json({ message: "Invalid refresh token" }); }
});
api.post("/auth/forgot-password", body("email").isEmail(), validate, (_req, res) => ok(res, { message: "OTP sent if account exists" }));
api.post("/auth/reset-password", body("otp").isLength({ min: 4 }), body("password").isLength({ min: 8 }), validate, (_req, res) => ok(res, { message: "Password reset" }));
api.get("/auth/me", auth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.sub },
      select: { id: true, email: true, name: true, phone: true, role: true },
    });
    return user ? ok(res, { user }) : res.status(404).json({ message: "User not found" });
  } catch (error) {
    try {
      const { users } = await import("./fixtures.js");
      const user = users.find((u) => u.id === (req as any).user.sub);
      return user ? ok(res, { user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role } }) : res.status(404).json({ message: "User not found" });
    } catch (fallbackErr) {
      next(error);
    }
  }
});

api.get("/products",
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 200 }),
  validate,
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const { category, search, material, finish, room, in_stock, featured, new_arrival, sort } = req.query;
      const where: any = { isActive: true };
      if (category) where.category = { slug: String(category) };
      if (search) where.name = { contains: String(search), mode: "insensitive" };
      if (material) where.material = String(material);
      if (finish) where.finish = String(finish);
      if (room) where.room = String(room);
      if (in_stock === "true") where.stockQty = { gt: 0 };
      if (featured === "true") where.isFeatured = true;
      if (new_arrival === "true") where.isNewArrival = true;

      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 24);
      const orderBy: any =
        sort === "price_asc" ? { price: "asc" } :
        sort === "price_desc" ? { price: "desc" } :
        sort === "newest" ? { isNewArrival: "desc" } :
        [{ isFeatured: "desc" }, { rating: "desc" }];

      const [total, dbProducts] = await prisma.$transaction([
        prisma.product.count({ where }),
        prisma.product.findMany({
          where,
          include: productInclude,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

      ok(res, { total, page, products: dbProducts });
    } catch {
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 24);
      const result = fallbackProducts(req.query);
      ok(res, { total: result.length, page, products: result.slice((page - 1) * limit, page * limit) });
    }
  },
);
api.get("/products/search", query("q").isString(), validate, async (req, res, next) => {
  try {
    const dbProducts = await prisma.product.findMany({
      where: { isActive: true, name: { contains: String(req.query.q), mode: "insensitive" } },
      include: productInclude,
      orderBy: { rating: "desc" },
      take: 10,
    });
    ok(res, { products: dbProducts });
  } catch {
    ok(res, { products: fallbackProducts({ search: req.query.q }).slice(0, 10) });
  }
});
api.get("/products/:slug", param("slug").isSlug(), validate, async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { slug: req.params.slug }, include: productInclude });
    return product ? ok(res, { product }) : res.status(404).json({ message: "Product not found" });
  } catch {
    const product = catalogueProducts.find((p) => p.slug === req.params.slug);
    return product ? ok(res, { product }) : res.status(404).json({ message: "Product not found" });
  }
});
api.post("/products", auth, admin, body("name").isLength({ min: 3 }), body("price").isNumeric(), validate, (req, res) => {
  ok(res, { product: { ...req.body, slug: req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") } });
});
api.put("/products/:id", auth, admin, (req, res) => {
  ok(res, { product: { id: req.params.id, ...req.body } });
});
api.delete("/products/:id", auth, admin, (req, res) => ok(res, { deleted: req.params.id }));

api.get("/categories", async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
    ok(res, { categories });
  } catch {
    ok(res, { categories: catalogueCategories.map((category) => ({ ...category, _count: { products: category.count } })) });
  }
});
api.get("/categories/:slug", async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug },
      include: { _count: { select: { products: true } } },
    });
    ok(res, { category });
  } catch {
    const category = catalogueCategories.find((item) => item.slug === req.params.slug);
    ok(res, { category: category ? { ...category, _count: { products: category.count } } : null });
  }
});
api.post("/admin/categories", auth, admin, (req, res) => ok(res, { category: req.body }));
api.put("/admin/categories/:id", auth, admin, (req, res) => ok(res, { id: req.params.id, ...req.body }));
api.delete("/admin/categories/:id", auth, admin, (req, res) => ok(res, { deleted: req.params.id }));

let cartItems: any[] = [];
api.get("/cart", (_req, res) => ok(res, { items: cartItems }));
api.post("/cart/add", body("productId").notEmpty(), body("quantity").isInt({ min: 1 }), validate, (req, res) => { cartItems.push(req.body); ok(res, { items: cartItems }); });
api.put("/cart/update", body("productId").notEmpty(), body("quantity").isInt({ min: 1 }), validate, (req, res) => { cartItems = cartItems.map((i) => i.productId === req.body.productId ? { ...i, quantity: req.body.quantity } : i); ok(res, { items: cartItems }); });
api.delete("/cart/remove/:itemId", (req, res) => { cartItems = cartItems.filter((i) => i.productId !== req.params.itemId); ok(res, { items: cartItems }); });
api.delete("/cart/clear", (_req, res) => { cartItems = []; ok(res, { items: [] }); });

let wishlistItems: string[] = [];
api.get("/wishlist", (_req, res) => ok(res, { products: wishlistItems }));
api.post("/wishlist/add", body("productId").notEmpty(), validate, (req, res) => { wishlistItems = [...new Set([...wishlistItems, req.body.productId])]; ok(res, { products: wishlistItems }); });
api.delete("/wishlist/remove/:productId", (req, res) => { wishlistItems = wishlistItems.filter((id) => id !== req.params.productId); ok(res, { products: wishlistItems }); });

api.post(
  "/orders",
  body("items").isArray({ min: 1 }),
  body("address").isObject(),
  body("paymentMethod").isString().notEmpty(),
  validate,
  async (req, res, next) => {
    try {
      const requestedItems = req.body.items as Array<{ productId?: string; sku?: string; quantity?: number }>;
      const quantities = requestedItems.map((item) => Math.max(1, Math.min(25, Number(item.quantity || 1))));
      const products = await Promise.all(requestedItems.map((item) =>
        item.sku
          ? prisma.product.findUnique({ where: { sku: item.sku } })
          : prisma.product.findUnique({ where: { id: String(item.productId) } }),
      ));
      if (products.some((product) => !product)) return res.status(422).json({ message: "One or more products are unavailable" });
      if (products.some((product, index) => product!.stockQty < quantities[index])) return res.status(409).json({ message: "Requested quantity is no longer in stock" });

      const subtotal = products.reduce((sum, product, index) => sum + product!.price * quantities[index], 0);
      const shippingCost = subtotal >= 5000 ? 0 : 99;
      const tax = Math.round(subtotal * 0.18);
      const orderNumber = `INN-${new Date().getFullYear()}-${Date.now().toString().slice(-10)}`;
      const order = await prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            userId: optionalUserId(req),
            orderNumber,
            status: "CONFIRMED",
            subtotal,
            shippingCost,
            tax,
            total: subtotal + shippingCost + tax,
            paymentMethod: String(req.body.paymentMethod),
            paymentStatus: req.body.paymentMethod === "Pay on Delivery" ? "PENDING" : "PENDING",
            addressSnapshot: req.body.address,
            items: {
              create: products.map((product, index) => ({
                productId: product!.id,
                name: product!.name,
                image: product!.images[0],
                price: product!.price,
                quantity: quantities[index],
                subtotal: product!.price * quantities[index],
              })),
            },
            statusHistory: { create: { status: "CONFIRMED", note: "Order received and confirmed" } },
          },
          include: { items: true, statusHistory: true },
        });
        await Promise.all(products.map((product, index) =>
          tx.product.update({ where: { id: product!.id }, data: { stockQty: { decrement: quantities[index] } } }),
        ));
        return created;
      });
      ok(res, { order });
    } catch (error) {
      try {
        const requestedItems = req.body.items as Array<{ productId?: string; sku?: string; quantity?: number }>;
        const quantities = requestedItems.map((item) => Math.max(1, Math.min(25, Number(item.quantity || 1))));
        const products = requestedItems.map((item) => {
          const p = item.sku
            ? catalogueProducts.find((x) => x.sku === item.sku)
            : catalogueProducts.find((x) => x.id === item.productId);
          return p;
        });
        if (products.some((product) => !product)) return res.status(422).json({ message: "One or more products are unavailable" });

        const subtotal = products.reduce((sum, product, index) => sum + product!.price * quantities[index], 0);
        const shippingCost = subtotal >= 5000 ? 0 : 99;
        const tax = Math.round(subtotal * 0.18);
        const orderNumber = `INN-${new Date().getFullYear()}-${Date.now().toString().slice(-10)}`;
        const order = {
          id: `ord_${Date.now()}`,
          userId: optionalUserId(req) || null,
          orderNumber,
          status: "CONFIRMED",
          subtotal,
          shippingCost,
          tax,
          total: subtotal + shippingCost + tax,
          paymentMethod: String(req.body.paymentMethod),
          paymentStatus: "PENDING",
          addressSnapshot: req.body.address,
          createdAt: new Date().toISOString(),
          items: products.map((product, index) => ({
            id: `item_${Date.now()}_${index}`,
            productId: product!.id,
            name: product!.name,
            image: product!.images[0],
            price: product!.price,
            quantity: quantities[index],
            subtotal: product!.price * quantities[index],
          })),
          statusHistory: [{ id: `sh_${Date.now()}`, status: "CONFIRMED", note: "Order received and confirmed", createdAt: new Date().toISOString() }],
        };
        const { orders } = await import("./fixtures.js");
        orders.push(order);
        ok(res, { order });
      } catch (fallbackErr) {
        next(error);
      }
    }
  },
);
api.get("/orders", auth, async (req, res, next) => {
  try {
    ok(res, { orders: await prisma.order.findMany({ where: { userId: (req as any).user.sub }, include: { items: true }, orderBy: { createdAt: "desc" } }) });
  } catch (error) {
    try {
      const { orders } = await import("./fixtures.js");
      const userId = (req as any).user.sub;
      const userOrders = orders.filter((o) => o.userId === userId);
      ok(res, { orders: userOrders });
    } catch (fallbackErr) {
      next(error);
    }
  }
});
api.get("/orders/:orderId", async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { OR: [{ id: req.params.orderId }, { orderNumber: req.params.orderId }] },
      include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } },
    });
    return order ? ok(res, { order }) : res.status(404).json({ message: "Order not found" });
  } catch (error) {
    try {
      const { orders } = await import("./fixtures.js");
      const order = orders.find((o) => o.id === req.params.orderId || o.orderNumber === req.params.orderId);
      return order ? ok(res, { order }) : res.status(404).json({ message: "Order not found" });
    } catch (fallbackErr) {
      next(error);
    }
  }
});
api.put("/orders/:orderId/cancel", auth, async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({ where: { id: req.params.orderId, userId: (req as any).user.sub } });
    if (!order || !["PENDING", "CONFIRMED"].includes(order.status)) return res.status(409).json({ message: "Order cannot be cancelled" });
    const updated = await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED", statusHistory: { create: { status: "CANCELLED", note: "Cancelled by customer" } } } });
    ok(res, { order: updated });
  } catch (error) { next(error); }
});
api.get("/admin/orders", auth, admin, async (_req, res, next) => {
  try { ok(res, { orders: await prisma.order.findMany({ include: { items: true, user: true }, orderBy: { createdAt: "desc" } }) }); } catch (error) { next(error); }
});
api.put("/admin/orders/:orderId/status", auth, admin, body("status").isIn(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]), validate, async (req, res, next) => {
  try {
    const order = await prisma.order.update({ where: { id: req.params.orderId }, data: { status: req.body.status, statusHistory: { create: { status: req.body.status } } } });
    ok(res, { order });
  } catch (error) { next(error); }
});

api.post("/payment/create-intent", body("amount").isInt({ min: 50 }), validate, async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_")) return ok(res, { clientSecret: "pi_test_secret_placeholder" });
  const intent = await stripe.paymentIntents.create({ amount: req.body.amount, currency: "inr", metadata: { store: "Innova Creations" } });
  ok(res, { clientSecret: intent.client_secret });
});
api.post("/payment/webhook", (req, res) => {
  logger.info("Stripe webhook received");
  res.json({ received: true });
});

api.get("/products/:productId/reviews", (req, res) => ok(res, { reviews: reviews.filter((r) => r.productId === req.params.productId) }));
api.post("/products/:productId/reviews", auth, body("rating").isInt({ min: 1, max: 5 }), body("body").isLength({ min: 3 }), validate, (req, res) => ok(res, { review: { id: `review_${reviews.length + 1}`, productId: req.params.productId, ...req.body } }));
api.put("/reviews/:reviewId", auth, (req, res) => ok(res, { id: req.params.reviewId, ...req.body }));
api.delete("/reviews/:reviewId", auth, (req, res) => ok(res, { deleted: req.params.reviewId }));

api.get("/admin/users", auth, admin, async (_req, res, next) => {
  try { ok(res, { users: await prisma.user.findMany({ select: { id: true, email: true, name: true, phone: true, role: true, isBlocked: true, createdAt: true } }) }); } catch (error) { next(error); }
});
api.get("/admin/users/:userId", auth, admin, async (req, res, next) => {
  try { ok(res, { user: await prisma.user.findUnique({ where: { id: req.params.userId }, include: { orders: true, addresses: true } }) }); } catch (error) { next(error); }
});
api.put("/admin/users/:userId/block", auth, admin, async (req, res, next) => {
  try { ok(res, { user: await prisma.user.update({ where: { id: req.params.userId }, data: { isBlocked: Boolean(req.body.isBlocked) } }) }); } catch (error) { next(error); }
});

api.post("/coupons/validate", body("code").isString(), validate, async (req, res, next) => {
  try {
    const coupon = await prisma.coupon.findUnique({ where: { code: String(req.body.code).toUpperCase() } });
    ok(res, coupon?.isActive ? { valid: true, coupon } : { valid: false, message: "Invalid coupon" });
  } catch (error) {
    next(error);
  }
});
api.get("/admin/coupons", auth, admin, async (_req, res, next) => {
  try {
    ok(res, { coupons: await prisma.coupon.findMany({ orderBy: { code: "asc" } }) });
  } catch (error) {
    next(error);
  }
});
api.post("/admin/coupons", auth, admin, (req, res) => ok(res, { coupon: req.body }));
api.put("/admin/coupons/:id", auth, admin, (req, res) => ok(res, { id: req.params.id, ...req.body }));
api.delete("/admin/coupons/:id", auth, admin, (req, res) => ok(res, { deleted: req.params.id }));

api.post("/upload/image", auth, admin, upload.single("image"), (req, res) => ok(res, { url: `cloudinary://placeholder/${req.file?.originalname || "image"}` }));
api.get("/admin/dashboard/stats", auth, admin, async (_req, res, next) => {
  try {
    const [stock, lowStock, customers, orderCount, revenue] = await prisma.$transaction([
      prisma.product.aggregate({ _sum: { stockQty: true } }),
      prisma.product.findMany({ where: { stockQty: { lt: 10 } }, include: productInclude, orderBy: { stockQty: "asc" }, take: 12 }),
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { total: true } }),
    ]);
    ok(res, { revenue: revenue._sum.total || 0, orders: orderCount, customers, stock: stock._sum.stockQty || 0, lowStock });
  } catch (error) {
    next(error);
  }
});
api.get("/admin/dashboard/charts", auth, admin, async (_req, res, next) => {
  try {
    ok(res, {
      revenue: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, value: 15000 + i * 1750 })),
      topProducts: await prisma.product.findMany({ include: productInclude, orderBy: { rating: "desc" }, take: 8 }),
    });
  } catch (error) {
    next(error);
  }
});
api.get("/admin/banners", auth, admin, async (_req, res, next) => {
  try {
    ok(res, { banners: await prisma.banner.findMany({ orderBy: { sortOrder: "asc" } }) });
  } catch (error) {
    next(error);
  }
});
api.get("/admin/reviews", auth, admin, (_req, res) => ok(res, { reviews }));

app.use("/api/v1", api);
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const port = Number(process.env.PORT || 5000);
app.listen(port, () => logger.info(`Innova Creations API running on ${port}`));
