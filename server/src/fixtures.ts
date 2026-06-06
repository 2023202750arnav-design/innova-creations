import bcrypt from "bcryptjs";

const names = [
  ["Venetian Crystal Chandelier - 6 Arms", "chandeliers", "Crystal", "Gold", "Dining"],
  ["Mughal Palace Antique Brass Chandelier", "chandeliers", "Brass", "Antique", "Living Room"],
  ["Bohemian Rattan Pendant Cluster", "pendant-lights", "Fabric", "Gold", "Bedroom"],
  ["Minimal Opal Glass Pendant", "pendant-lights", "Iron", "Chrome", "Office"],
  ["Jaipur Cutwork Wall Sconce", "wall-sconces", "Brass", "Antique", "Living Room"],
  ["Outdoor Imperial Lantern Sconce", "wall-sconces", "Iron", "Black", "Outdoor"],
  ["Arc Royale Floor Lamp", "floor-lamps", "Iron", "Gold", "Living Room"],
  ["Tripod Linen Floor Lamp", "floor-lamps", "Fabric", "Chrome", "Bedroom"],
  ["Bedside Pearl Table Lamp", "table-lamps", "Crystal", "Gold", "Bedroom"],
  ["Desk Halo Task Lamp", "table-lamps", "LED", "Black", "Office"],
  ["Lotus Flush Mount Ceiling Light", "ceiling-lights", "Brass", "Gold", "Dining"],
  ["RGB Cove LED Strip Kit", "led-strips", "LED", "Chrome", "Bedroom"],
  ["Warm Gold Under Cabinet LED Strip", "led-strips", "LED", "Gold", "Kitchen"],
  ["Garden Path Brass Bollard", "outdoor-lights", "Brass", "Antique", "Outdoor"],
  ["Bathroom Vanity Crystal Bar", "vanity-lights", "Crystal", "Chrome", "Bathroom"],
  ["Royal Gold Chandelier Tassel Set Pack of 4", "chandeliers", "Silk", "Gold", "Living Room"],
  ["Classic Silk Curtain Chandelier", "chandeliers", "Silk", "Gold", "Bedroom"],
  ["Beaded Maharaja Chandelier Pair", "chandeliers", "Crystal", "Gold", "Dining"],
  ["Gold Thread Upholstery Fringe", "trimmings", "Fabric", "Gold", "Living Room"],
  ["Decorative Door Toran Chandelier", "toran", "Silk", "Antique", "Entry"]
];

export const categories = ["chandeliers", "pendant-lights", "wall-sconces", "floor-lamps", "table-lamps", "ceiling-lights", "led-strips", "outdoor-lights", "vanity-lights", "chandeliers", "trimmings", "toran"].map((slug, i) => ({
  id: `cat_${i + 1}`,
  name: slug.split("-").map((x) => x[0].toUpperCase() + x.slice(1)).join(" "),
  slug,
  description: `Luxury ${slug.replace("-", " ")} collection.`,
  image: `https://source.unsplash.com/900x700/?${slug},interior`,
  parentId: null,
  isActive: true,
  sortOrder: i,
}));

export const products = Array.from({ length: 56 }, (_, i) => {
  const base = names[i % names.length];
  const suffix = i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : "";
  const name = `${base[0]}${suffix}`;
  const price = 1499 + (i % 14) * 1850 + Math.floor(i / 7) * 400;
  return {
    id: `prod_${i + 1}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    description: "Designed for statement interiors with durable materials, warm diffusion, careful finishing, and a luxury installation-ready package.",
    shortDescription: `Premium ${base[2].toLowerCase()} piece finished in ${base[3].toLowerCase()} for refined ${base[4].toLowerCase()} interiors.`,
    sku: `INN-${String(i + 1).padStart(4, "0")}`,
    price,
    compareAtPrice: Math.round(price * 1.28),
    costPrice: Math.round(price * 0.52),
    gstRate: 18,
    stockQty: (i * 3) % 31,
    stock: (i * 3) % 31,
    isActive: true,
    isFeatured: i < 12,
    isNewArrival: i % 6 === 0,
    categoryId: categories.find((c) => c.slug === base[1])?.id,
    category: base[1],
    categorySlug: base[1],
    images: [`https://source.unsplash.com/900x900/?luxury,light,interior&sig=${i + 1}`, `https://source.unsplash.com/900x900/?decor,lamp,chandelier&sig=${i + 101}`],
    tags: [base[1], base[2], base[3], base[4]],
    seoTitle: name,
    seoDescription: `Buy ${name} from Innova Creations.`,
    material: base[2],
    finish: base[3],
    room: base[4],
    rating: Number((3.8 + (i % 13) * 0.09).toFixed(1)),
    reviews: 18 + (i * 7) % 154,
    badges: [i % 5 === 0 ? "Sale" : "", i % 4 === 0 ? "Best Seller" : "", i % 6 === 0 ? "New" : ""].filter(Boolean),
    variants: [
      { id: `var_${i}_1`, name: "Finish", value: base[3], priceModifier: 0, stock: 8 + (i % 8), sku: `INN-${i}-F` },
      { id: `var_${i}_2`, name: "Size", value: i % 2 ? "Large" : "Standard", priceModifier: i % 2 ? 900 : 0, stock: 5 + (i % 5), sku: `INN-${i}-S` },
    ],
  };
});

export const users = [
  { id: "admin_1", email: "admin@innovacreations.com", name: "Innova Admin", phone: "+919876543210", passwordHash: bcrypt.hashSync("Admin@1234", 10), role: "ADMIN", isBlocked: false, addresses: [] },
  { id: "user_1", email: "customer@example.com", name: "Aditi Sharma", phone: "+919900001111", passwordHash: bcrypt.hashSync("Customer@1234", 10), role: "CUSTOMER", isBlocked: false, addresses: [] },
];
export const orders: any[] = [];
export const coupons = [{ id: "coupon_1", code: "INNOVA10", type: "PERCENT", value: 10, minOrderValue: 5000, maxDiscount: 1500, usageLimit: 200, usedCount: 12, expiresAt: "2026-12-31", isActive: true }];
export const reviews = products.slice(0, 12).map((p, i) => ({ id: `review_${i + 1}`, userId: "user_1", productId: p.id, rating: 4 + (i % 2), title: "Beautiful finish", body: "Arrived safely, looks premium, and installation was straightforward.", isApproved: true, helpfulVotes: 8 + i, createdAt: new Date().toISOString() }));
export const banners = [
  { id: "banner_1", title: "Royal Lighting Week", subtitle: "Up to 28% off bestsellers", ctaText: "Shop Sale", ctaLink: "/products?sale=true", imageUrl: "https://source.unsplash.com/1800x1000/?chandelier,luxury", sortOrder: 1, isActive: true },
];
