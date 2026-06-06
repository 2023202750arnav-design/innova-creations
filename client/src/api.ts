import axios from "axios";
import { Category, Product } from "./data";
import { catalogueCategories, catalogueProducts } from "./catalogue";

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5002/api/v1", withCredentials: true });
const DEFAULT_PRODUCT_LIMIT = 24;
export const MAX_PRODUCT_LIMIT = 100;

type ApiProduct = Partial<Omit<Product, "category">> & {
  sku?: string;
  categoryId?: string;
  categorySlug?: string;
  category?: string | { slug?: string; name?: string };
  stockQty?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  tags?: string[];
};

export function normalizeProduct(product: ApiProduct): Product {
  const rawCategory = product.category;
  const category =
    rawCategory && typeof rawCategory === "object"
      ? rawCategory.slug || product.categorySlug || ""
      : rawCategory || product.categorySlug || "";
  const badges = [
    product.isFeatured ? "Best Seller" : "",
    product.isNewArrival ? "New" : "",
    product.compareAtPrice && product.price && product.compareAtPrice > product.price ? "Sale" : "",
  ].filter(Boolean) as string[];
  const suppliedImages = (product.images?.length ? product.images : ["/catalog-products/products/innova-wln1-1.jpg"])
    .map((src) => src.startsWith("/catalog-products/") ? `${src}?v=20260605-2` : src);
  const images = suppliedImages;

  return {
    id: String(product.id || product.sku || product.slug),
    sku: product.sku,
    name: product.name || "Innova Product",
    slug: product.slug || "",
    category,
    categoryName: rawCategory && typeof rawCategory === "object" ? rawCategory.name : undefined,
    shortDescription: product.shortDescription || "",
    description: product.description || "",
    price: Number(product.price || 0),
    compareAtPrice: Number(product.compareAtPrice || product.price || 0),
    rating: Number(product.rating || 0),
    reviews: Number(product.reviews ?? product.reviewCount ?? 0),
    stock: Number(product.stock ?? product.stockQty ?? 0),
    badges,
    material: product.material || product.tags?.[0] || "Lighting",
    finish: product.finish || "Premium",
    room: product.room || "Indoor",
    images,
    variants: product.variants?.length ? product.variants : [
      { name: "Finish", value: product.finish || "Standard", stock: Number(product.stockQty || product.stock || 0), priceModifier: 0 },
      { name: "Installation", value: "Standard", stock: Number(product.stockQty || product.stock || 0), priceModifier: 0 },
    ],
  };
}

export function normalizeCategory(category: any): Category {
  return {
    id: String(category.id || category.slug),
    name: category.name,
    slug: category.slug,
    description: category.description || "",
    image: category.image || "/catalog-products/products/innova-pcl-67-1.jpg",
    count: category._count?.products || 0,
    sortOrder: category.sortOrder || 0,
  };
}

const normalizedCatalogueProducts = catalogueProducts.map(normalizeProduct);
const normalizedCatalogueBySlug = new Map(normalizedCatalogueProducts.map((product) => [product.slug, product]));

function getCappedLimit(limitValue: unknown) {
  const parsed = Number(limitValue);
  if (!Number.isInteger(parsed) || parsed <= 0) return DEFAULT_PRODUCT_LIMIT;
  return Math.min(MAX_PRODUCT_LIMIT, Math.floor(parsed));
}

export async function fetchProducts(params: Record<string, string | number | boolean | undefined> = {}) {
  try {
    const cappedLimit = getCappedLimit(params.limit);
    const { data } = await api.get("/products", { params: { ...params, limit: cappedLimit } });
    return (data.products ?? data).map(normalizeProduct);
  } catch {
    const cappedLimit = getCappedLimit(params.limit);
    let result = [...normalizedCatalogueProducts];
    if (params.category) result = result.filter((p) => p.category === params.category);
    if (params.search) {
      const search = String(params.search).toLowerCase();
      result = result.filter((p) => `${p.name} ${p.shortDescription} ${p.sku || ""}`.toLowerCase().includes(search));
    }
    if (params.featured === true || params.featured === "true") result = result.filter((p) => p.badges.includes("Best Seller"));
    if (params.new_arrival === true || params.new_arrival === "true") result = result.filter((p) => p.badges.includes("New"));
    if (params.in_stock === true || params.in_stock === "true") result = result.filter((p) => p.stock > 0);
    if (params.sort === "price_asc") result.sort((a, b) => a.price - b.price);
    else if (params.sort === "price_desc") result.sort((a, b) => b.price - a.price);
    else result.sort((a, b) => Number(b.badges.includes("Best Seller")) - Number(a.badges.includes("Best Seller")) || b.rating - a.rating);
    return result.slice(0, cappedLimit);
  }
}

export async function fetchProduct(slug: string) {
  try {
    const { data } = await api.get(`/products/${slug}`);
    return normalizeProduct(data.product ?? data);
  } catch {
    return normalizedCatalogueBySlug.get(slug);
  }
}

export async function fetchCategories() {
  try {
    const { data } = await api.get("/categories");
    return (data.categories ?? data).map(normalizeCategory);
  } catch {
    return catalogueCategories;
  }
}

export async function registerCustomer(payload: { name: string; email: string; password: string; phone?: string }) {
  const { data } = await api.post("/auth/register", payload);
  return data.user;
}

export async function loginCustomer(payload: { email: string; password: string }) {
  const { data } = await api.post("/auth/login", payload);
  return data.user;
}

export async function createOrder(payload: {
  items: Array<{ productId: string; sku?: string; quantity: number }>;
  address: Record<string, string>;
  paymentMethod: string;
}) {
  const { data } = await api.post("/orders", payload);
  return data.order;
}

export async function fetchOrder(orderNumber: string) {
  const { data } = await api.get(`/orders/${encodeURIComponent(orderNumber)}`);
  return data.order;
}

export async function fetchMyOrders() {
  const { data } = await api.get("/orders");
  return data.orders ?? [];
}
