import { useMemo, useState } from "react";
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Heart, Search, ShoppingBag, User, Menu, X, Star, ShieldCheck, Truck, RefreshCw, Lock, Plus, Minus, Trash2, Settings, BarChart3, Package, Users, Tags, MessageCircle } from "lucide-react";
import { Category, categories, heroSlides, inr, Product, products } from "./data";
import { createOrder, fetchCategories, fetchMyOrders, fetchOrder, fetchProduct, fetchProducts, loginCustomer, registerCustomer } from "./api";
import { useShop } from "./store";

function Seo({ title, description }: { title: string; description: string }) {
  return <Helmet><title>{title} | Innova Creations</title><meta name="description" content={description} /><link rel="canonical" href={location.href} /></Helmet>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const cart = useShop((s) => s.cart);
  const wishlist = useShop((s) => s.wishlist);
  const goSearch = () => q.trim() && nav(`/search?q=${encodeURIComponent(q.trim())}`);
  const links = [["Lights", "/products"], ["Wall Lights", "/products/category/wall-lights"], ["LED Collection", "/products/category/led-pendant-ceiling"], ["New Arrivals", "/products?new=true"], ["Sale", "/products?sale=true"], ["About", "/about"]];
  return <header className="sticky top-0 z-40">
    <div className="bg-navy px-4 py-2 text-center text-sm text-gold-light">Free Shipping on orders above ₹5000 | Custom Orders: +91-98765-43210 | innova@example.com</div>
    <div className="glass px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center gap-4">
        <button aria-label="Open menu" className="lg:hidden" onClick={() => setOpen(true)}><Menu /></button>
        <Link to="/" className="mr-auto flex items-center gap-2"><span className="grid h-10 w-10 place-items-center rounded-full border border-gold text-gold">♛</span><span><strong className="block font-display text-2xl tracking-wide">INNOVA CREATIONS</strong><em className="font-script text-lg text-gold-dark">Lights & Chandeliers</em></span></Link>
        <nav className="hidden items-center gap-6 lg:flex">{links.map(([label, href]) => <NavLink className={({ isActive }) => `text-sm font-semibold ${isActive ? "text-gold-dark" : "text-charcoal"}`} to={href} key={label}>{label}{label === "Sale" && <span className="ml-1 rounded bg-burgundy px-1.5 py-.5 text-xs text-white">SALE</span>}</NavLink>)}</nav>
        <div className="relative hidden w-64 md:block">
          <input aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && goSearch()} placeholder="Search wall lights, pendants..." className="w-full rounded-full border border-gold/40 bg-white px-4 py-2 pr-10" />
          <button aria-label="Search" className="absolute right-3 top-2.5" onClick={goSearch}><Search size={18} /></button>
        </div>
        <Link aria-label="Wishlist" to="/account/wishlist" className="relative"><Heart /><Badge count={wishlist.length} /></Link>
        <Link aria-label="Account" to="/account"><User /></Link>
        <Link aria-label="Cart" to="/cart" className="relative"><ShoppingBag /><Badge count={cart.reduce((a, b) => a + b.qty, 0)} /></Link>
      </div>
    </div>
    {open && <div className="fixed inset-0 z-50 bg-navy/70 lg:hidden"><div className="ml-auto h-full w-80 bg-ivory p-6"><button aria-label="Close menu" onClick={() => setOpen(false)} className="float-right"><X /></button><div className="mt-10 grid gap-4">{links.map(([label, href]) => <Link onClick={() => setOpen(false)} to={href} className="border-b border-gold/20 py-3 font-display text-2xl" key={label}>{label}</Link>)}</div></div></div>}
  </header>;
}

function Badge({ count }: { count: number }) {
  return count ? <span className="absolute -right-3 -top-3 grid h-5 min-w-5 place-items-center rounded-full bg-burgundy px-1 text-xs text-white">{count}</span> : null;
}

function Footer() {
  const footerLinks = {
    "About Us": "/about",
    Contact: "/contact",
    "Custom Orders": "/custom-order",
    "Track Order": "/track-order",
    Blog: "/blog",
    FAQs: "/faqs",
    "Shipping Policy": "/shipping-policy",
    "Returns Policy": "/returns-policy",
    "Privacy Policy": "/privacy-policy",
    Terms: "/terms",
  } as const;
  return <footer className="mt-16 bg-navy px-4 py-12 text-gold-light">
    <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4"><div><h3 className="font-display text-3xl text-gold">INNOVA CREATIONS</h3><p>Illuminating Spaces with Elegance</p><p className="mt-4 rounded-full border border-gold px-3 py-1 text-sm">Made in India with love</p></div>{["Quick Links", "Customer Service"].map((h, i) => <div key={h}><h4 className="mb-3 font-semibold text-gold">{h}</h4>{(i ? ["FAQs", "Shipping Policy", "Returns Policy", "Privacy Policy", "Terms"] : ["About Us", "Contact", "Custom Orders", "Track Order", "Blog"]).map((x) => <Link key={x} className="block py-1" to={footerLinks[x as keyof typeof footerLinks]}>{x}</Link>)}</div>)}<div><h4 className="mb-3 font-semibold text-gold">Contact & Store</h4><p>MG Road, Mumbai, Maharashtra</p><p>+91-98765-43210</p><p>innova@example.com</p><div className="mt-3 h-20 rounded border border-gold/40 bg-white/10" /></div></div>
    <div className="mx-auto mt-8 max-w-7xl border-t border-gold/30 pt-5 text-sm">© 2026 Innova Creations. All Rights Reserved. Visa | Mastercard | UPI | Stripe</div>
  </footer>;
}

function ProductCard({ product }: { product: Product }) {
  const addCart = useShop((s) => s.addCart);
  const toggle = useShop((s) => s.toggleWishlist);
  const wishlist = useShop((s) => s.wishlist);
  const badges = product.badges ?? [];
  return <motion.article whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 18 }} className="card-hover group overflow-hidden rounded-lg border border-gold/20 bg-white">
    <Link to={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden shimmer"><img src={product.images[0]} loading="lazy" className="h-full w-full object-contain transition duration-500 group-hover:scale-105" />{product.images[1] && <img src={product.images[1]} loading="lazy" className="absolute inset-0 h-full w-full object-contain opacity-0 transition duration-500 group-hover:opacity-100" />}{badges.map((b) => <span key={b} className="absolute left-3 top-3 rounded bg-burgundy px-2 py-1 text-xs text-white">{b}</span>)}</Link>
    <div className="p-4"><div className="flex justify-between gap-3"><h3 className="font-display text-xl"><Link to={`/products/${product.slug}`}>{product.name}</Link></h3><button aria-label="Toggle wishlist" onClick={() => toggle(product.id)} className={wishlist.includes(product.id) ? "text-burgundy" : ""}><Heart size={20} fill={wishlist.includes(product.id) ? "currentColor" : "none"} /></button></div><p className="mt-1 line-clamp-2 text-sm text-mid">{product.shortDescription}</p><p className="mt-2 text-sm text-gold-dark"><Stars value={product.rating} /> {product.rating} ({product.reviews})</p><div className="mt-2 flex items-end gap-2"><b className="text-lg">{inr.format(product.price)}</b><s className="text-sm text-mid">{inr.format(product.compareAtPrice)}</s></div><div className="mt-4 flex gap-2"><button onClick={() => { addCart(product); toast.success("Added to cart"); }} className="gold-btn flex-1 rounded px-4 py-2 font-semibold">Add to Cart</button><Link to={`/products/${product.slug}`} className="rounded border border-gold px-3 py-2 text-sm">Quick View</Link></div></div>
  </motion.article>;
}

function Stars({ value }: { value: number }) {
  return <span className="inline-flex align-middle">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={14} fill={i < Math.round(value) ? "#C9A84C" : "none"} color="#C9A84C" />)}</span>;
}

function Home() {
  const { data: featured = [] } = useQuery<Product[]>({ queryKey: ["home-featured"], queryFn: () => fetchProducts({ featured: true, limit: 8 }) });
  const { data: arrivals = [] } = useQuery<Product[]>({ queryKey: ["home-new"], queryFn: () => fetchProducts({ new_arrival: true, limit: 4 }) });
  const { data: realCategories = categories } = useQuery<Category[]>({ queryKey: ["categories"], queryFn: fetchCategories });
  return <><Seo title="Luxury Lights and Chandeliers" description="Premium wall lights, pendant lights, LED ceiling lights, and crystal chandeliers." /><section className="relative min-h-[86vh] overflow-hidden text-white"><Swiper loop autoplay>{heroSlides.map((s) => <SwiperSlide key={s.title}><div className="min-h-[86vh] bg-cover bg-center" style={{ backgroundImage: `url(${s.image})` }}><div className="grain flex min-h-[86vh] items-center px-6"><motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl"><p className="font-script text-4xl text-gold-light">Royal craft for luminous homes</p><h1 className="max-w-3xl font-display text-6xl md:text-8xl">{s.title}</h1><p className="mt-4 max-w-xl text-xl">{s.subtitle}</p><div className="mt-8 flex flex-wrap gap-4"><Link className="gold-btn rounded px-6 py-3 font-semibold" to="/products">Shop Lights</Link><Link className="rounded border border-gold bg-navy/50 px-6 py-3 font-semibold text-gold-light" to="/products/category/crystal-chandeliers">Explore Chandeliers</Link></div></motion.div></div></div></SwiperSlide>)}</Swiper></section><Marquee /><CategoryGrid items={realCategories} /><Section title="Bestsellers"><Swiper slidesPerView={1.1} spaceBetween={18} breakpoints={{ 768: { slidesPerView: 3 }, 1100: { slidesPerView: 4 } }}>{featured.map((p) => <SwiperSlide key={p.id}><ProductCard product={p} /></SwiperSlide>)}</Swiper></Section><Why /><Section title="New Arrivals"><div className="grid gap-5 md:grid-cols-4">{arrivals.map((p) => <ProductCard product={p} key={p.id} />)}</div></Section><Editorial /><Testimonials /><Newsletter /></>;
}

function Marquee() { return <div className="overflow-hidden bg-gold py-2 text-charcoal"><div className="animate-pulse whitespace-nowrap text-center font-semibold">Free Shipping on orders above ₹5000 | Premium Quality | 30-Day Returns | Custom Orders Available</div></div>; }
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mx-auto max-w-7xl px-4 py-12"><h2 className="ornament mb-8 text-center font-display text-4xl">{title}</h2>{children}</section>; }
function CategoryGrid({ items = categories }: { items?: Category[] }) { return <Section title="Shop by Category"><div className="grid gap-5 md:grid-cols-3">{items.map((category) => <Link key={category.slug} to={`/products/category/${category.slug}`} className="group relative aspect-[4/3] overflow-hidden rounded-lg"><img src={category.image} className="h-full w-full object-cover transition group-hover:scale-110" loading="lazy" /><span className="absolute inset-0 grid place-items-center bg-navy/35 px-4 text-center font-display text-4xl text-gold-light">{category.name}</span></Link>)}</div></Section>; }
function Why() { return <Section title="Why Choose Us"><div className="grid gap-4 md:grid-cols-4">{[[ShieldCheck, "Handcrafted Quality"], [Lock, "100% Genuine Products"], [Truck, "Pan-India Shipping"], [RefreshCw, "Custom Design Available"]].map(([Icon, text]) => <div className="rounded-lg border border-gold/30 bg-cream p-6 text-center" key={String(text)}>{typeof Icon !== "string" && <Icon className="mx-auto mb-3 text-gold-dark" />}<b>{text as string}</b></div>)}</div></Section>; }
function Editorial() { return <section className="bg-navy py-14 text-white"><div className="mx-auto grid max-w-7xl items-center gap-8 px-4 md:grid-cols-2"><img src="/catalog-products/products/innova-ncp43-1.jpg" className="rounded-lg" loading="lazy" /><div><p className="font-script text-4xl text-gold-light">Room Inspiration</p><h2 className="font-display text-5xl">Transform Your Space</h2><p className="mt-4 text-lg text-gold-light">Layer brass, crystal, and LED warmth into rooms that feel collected and deeply personal.</p><Link className="gold-btn mt-6 inline-block rounded px-6 py-3" to="/products/category/crystal-chandeliers">Shop This Look</Link></div></div></section>; }
function Testimonials() { return <Section title="Loved by Homes Across India"><div className="grid gap-4 md:grid-cols-5">{["Aditi", "Rahul", "Meera", "Kabir", "Noor"].map((n, i) => <div className="rounded-lg bg-white p-5 shadow" key={n}><img src={`https://i.pravatar.cc/80?img=${i + 12}`} className="mb-3 h-12 w-12 rounded-full" /><Stars value={5 - (i % 2) * .5} /><p className="mt-2 text-sm">Beautiful finish, secure packaging, and the room feels instantly elevated.</p><b className="mt-3 block">{n}</b></div>)}</div></Section>; }
function Newsletter() { return <section className="mx-auto max-w-4xl rounded-lg border border-gold bg-cream p-8 text-center"><h2 className="font-display text-4xl">Get 10% off your first order</h2><form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={(e) => { e.preventDefault(); toast.success("Welcome to Innova Creations"); }}><input required type="email" placeholder="Email address" className="flex-1 rounded border border-gold/40 px-4 py-3" /><button className="gold-btn rounded px-6 py-3">Subscribe</button></form></section>; }

function Listing() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const [sort, setSort] = useState("Featured");
  const [list, setList] = useState(false);
  const { data = [] } = useQuery<Product[]>({ queryKey: ["products", slug], queryFn: () => fetchProducts({ category: slug, limit: 200 }) });
  const q = params.get("q")?.toLowerCase();
  const newOnly = params.get("new") === "true";
  const saleOnly = params.get("sale") === "true";
  const visible = useMemo(() => [...(data as Product[])]
    .filter((p) => !q || p.name.toLowerCase().includes(q))
    .filter((p) => !newOnly || (p.badges ?? []).includes("New"))
    .filter((p) => !saleOnly || (p.badges ?? []).includes("Sale"))
    .sort((a, b) => sort.includes("Low") ? a.price - b.price : sort.includes("High") ? b.price - a.price : b.rating - a.rating), [data, q, newOnly, saleOnly, sort]);
  return <main className="mx-auto max-w-7xl px-4 py-8"><Seo title="Products" description="Browse luxury lights and chandeliers with filters." /><p className="mb-3 text-sm text-mid">Home / Products {slug ? `/ ${slug}` : ""}</p><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-5xl">Showing {visible.length} products</h1><div className="flex gap-2"><select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded border border-gold/40 px-3 py-2">{["Featured", "Price Low-High", "Price High-Low", "Newest", "Best Rated", "Most Reviewed"].map((x) => <option key={x}>{x}</option>)}</select><button className="rounded border border-gold px-3" onClick={() => setList(!list)}>{list ? "Grid" : "List"}</button></div></div><div className="grid gap-6 lg:grid-cols-[270px_1fr]"><Filters /><div><div className="mb-4 flex flex-wrap gap-2">{categories.map((c) => <Link to={`/products/category/${c.slug}`} className="rounded-full border border-gold/40 px-3 py-1 text-sm" key={c.slug}>{c.name}</Link>)}</div><div className={list ? "grid gap-5" : "grid gap-5 md:grid-cols-2 xl:grid-cols-3"}>{visible.map((p) => <ProductCard key={p.id} product={p} />)}</div></div></div></main>;
}

function Filters() { return <aside className="sticky top-28 h-max rounded-lg border border-gold/30 bg-white p-5"><h2 className="font-display text-3xl">Filters</h2>{["Category", "Material", "Color Finish", "Room Type", "Rating", "Stock Status"].map((g) => <div className="mt-5" key={g}><b>{g}</b><div className="mt-2 grid gap-2 text-sm">{["Gold", "Crystal", "Brass", "LED", "In Stock only"].map((x) => <label className="flex gap-2" key={x}><input type="checkbox" /> {x}</label>)}</div></div>)}<label className="mt-5 block"><b>Price Range</b><input type="range" min="1000" max="80000" className="mt-2 w-full" /></label><button className="mt-4 text-sm text-burgundy">Clear All</button></aside>; }

function ProductDetail() {
  const { slug = "" } = useParams();
  const { data } = useQuery<Product | undefined>({ queryKey: ["product", slug], queryFn: () => fetchProduct(slug) });
  const product = data as Product | undefined;
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);
  const addCart = useShop((s) => s.addCart);
  const toggleWishlist = useShop((s) => s.toggleWishlist);
  const wishlist = useShop((s) => s.wishlist);
  const { data: related = [] } = useQuery<Product[]>({ queryKey: ["related", product?.category], queryFn: () => fetchProducts({ category: product?.category, limit: 4 }), enabled: Boolean(product?.category) });
  if (!product) return <div className="p-10">Product not found.</div>;
  const jsonLd = { "@context": "https://schema.org", "@type": "Product", name: product.name, offers: { "@type": "Offer", priceCurrency: "INR", price: product.price, availability: product.stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" }, aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviews } };
  return <main className="mx-auto max-w-7xl px-4 py-8"><Seo title={product.name} description={product.shortDescription} /><script type="application/ld+json">{JSON.stringify(jsonLd)}</script><div className="grid gap-8 lg:grid-cols-2"><div><div className="aspect-square overflow-hidden rounded-lg bg-cream p-4"><img src={product.images[img]} className="h-full w-full object-contain transition hover:scale-110" /></div><div className="mt-3 flex gap-3">{product.images.map((src, i) => <button key={src} onClick={() => setImg(i)} className="h-20 w-20 overflow-hidden rounded border border-gold bg-cream p-1"><img src={src} className="h-full w-full object-contain" /></button>)}</div></div><section><span className="rounded-full bg-gold px-3 py-1 text-sm font-semibold">Innova Creations</span><h1 className="mt-4 font-display text-6xl">{product.name}</h1><p className="mt-2 text-gold-dark"><Stars value={product.rating} /> {product.rating} ({product.reviews} reviews)</p><div className="mt-4 flex items-end gap-3"><b className="text-3xl">{inr.format(product.price)}</b><s className="text-mid">{inr.format(product.compareAtPrice)}</s><span className="text-burgundy">{Math.round((1 - product.price / product.compareAtPrice) * 100)}% off</span></div><div className="prose prose-sm mt-4 max-w-none text-mid" dangerouslySetInnerHTML={{ __html: product.description }} /><div className="mt-5 grid gap-3"><b>Finish/Color</b><div className="flex gap-2">{[product.finish, "Gold", "Chrome", "Black"].filter(Boolean).slice(0, 4).map((x) => <button className="rounded border border-gold px-4 py-2" key={x}>{x}</button>)}</div><b>Size/Wattage</b><div className="flex gap-2">{product.variants.map((v) => <button className="rounded border border-gold px-4 py-2" key={v.value}>{v.value}</button>)}</div></div><p className={`mt-4 font-semibold ${product.stock <= 5 ? "text-burgundy" : "text-green-700"}`}>{product.stock <= 5 ? `Only ${product.stock} left in stock!` : "In Stock"}</p><div className="mt-5 flex w-36 items-center justify-between rounded border border-gold"><button aria-label="Decrease" className="p-3" onClick={() => setQty(Math.max(1, qty - 1))}><Minus /></button>{qty}<button aria-label="Increase" className="p-3" onClick={() => setQty(qty + 1)}><Plus /></button></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><button data-testid="product-add-cart" onClick={() => { addCart(product, qty); toast.success("Added to cart"); }} className="gold-btn rounded px-6 py-3 font-semibold">Add to Cart</button><button data-testid="product-wishlist" onClick={() => { toggleWishlist(product.id); toast.success(wishlist.includes(product.id) ? "Removed from wishlist" : "Added to wishlist"); }} className="rounded border border-gold px-6 py-3">{wishlist.includes(product.id) ? "Wishlisted" : "Add to Wishlist"}</button><Link data-testid="product-buy-now" to="/checkout" className="rounded bg-navy px-6 py-3 text-center text-white">Buy Now</Link></div><p className="mt-4">EMI available from ₹299/month</p><input className="mt-3 rounded border border-gold/40 px-4 py-2" placeholder="Enter pincode for delivery estimate" /><div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">{["Free Shipping", "Easy Returns", "Secure Payment", "Genuine Product"].map((x) => <span className="rounded bg-cream p-2 text-center" key={x}>{x}</span>)}</div></section></div><Accordions product={product} /><Reviews product={product} /><Section title="You Might Also Like"><div className="grid gap-5 md:grid-cols-4">{related.filter((p) => p.id !== product.id).slice(0, 4).map((p) => <ProductCard product={p} key={p.id} />)}</div></Section></main>;
}

function Accordions({ product }: { product: Product }) { return <div className="mt-10 grid gap-3">{["Description", "Specifications", "Installation Guide", "Shipping & Returns"].map((x) => <details className="rounded border border-gold/30 bg-white p-4" key={x}><summary className="cursor-pointer font-semibold">{x}</summary>{x === "Specifications" ? <p className="mt-3 text-mid">Material: {product.material}; Finish: {product.finish}; Room: {product.room}; GST: 18%; Indoor lighting product.</p> : <div className="prose prose-sm mt-3 max-w-none text-mid" dangerouslySetInnerHTML={{ __html: product.description }} />}</details>)}</div>; }
function Reviews({ product }: { product: Product }) { return <Section title="Ratings & Reviews"><div className="grid gap-5 md:grid-cols-[260px_1fr]"><div className="rounded-full border-[18px] border-gold p-10 text-center"><b className="font-display text-5xl">{product.rating}</b><p>{product.reviews} reviews</p></div><div className="grid gap-3">{["Verified finish and quick delivery.", "The chandelier completely changed our dining room.", "Helpful team for custom sizing."].map((r, i) => <div className="rounded bg-white p-4" key={r}><Stars value={5 - i * .5} /><b className="ml-2">Verified Purchase</b><p>{r}</p><button className="text-sm text-gold-dark">Helpful ({12 - i})</button></div>)}</div></div></Section>; }

function CartPage() {
  const { cart, updateQty, removeCart } = useShop();
  const subtotal = cart.reduce((a, l) => a + l.product.price * l.qty, 0);
  const discount = cart.reduce((a, l) => a + (l.product.compareAtPrice - l.product.price) * l.qty, 0);
  const shipping = subtotal >= 5000 || subtotal === 0 ? 0 : 99;
  const tax = Math.round(subtotal * .18);
  return <main className="mx-auto max-w-6xl px-4 py-10"><Seo title="Cart" description="Review cart and order summary." /><h1 className="font-display text-5xl">Your Cart</h1><div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]"><div className="grid gap-4">{cart.length === 0 && <p className="rounded bg-white p-8">Your cart is waiting for something beautiful.</p>}{cart.map((line) => <div className="grid gap-4 rounded bg-white p-4 sm:grid-cols-[100px_1fr_auto]" key={line.product.id}><img src={line.product.images[0]} className="h-24 w-24 rounded object-cover" /><div><h3 className="font-display text-2xl">{line.product.name}</h3><p className="text-mid">{line.product.finish} / {line.product.material}</p><b>{inr.format(line.product.price)}</b></div><div className="flex items-center gap-2"><button aria-label="Decrease" onClick={() => updateQty(line.product.id, line.qty - 1)}><Minus /></button>{line.qty}<button aria-label="Increase" onClick={() => updateQty(line.product.id, line.qty + 1)}><Plus /></button><button aria-label="Remove" onClick={() => removeCart(line.product.id)}><Trash2 /></button></div></div>)}</div><Summary subtotal={subtotal} discount={discount} shipping={shipping} tax={tax} /></div></main>;
}
function Summary({ subtotal, discount, shipping, tax }: { subtotal: number; discount: number; shipping: number; tax: number }) { const total = subtotal + shipping + tax; return <aside className="h-max rounded-lg border border-gold/30 bg-white p-5"><h2 className="font-display text-3xl">Order Summary</h2><p className="mt-3 text-green-700">You save {inr.format(discount)}!</p><div className="my-4 h-3 rounded-full bg-cream"><div className="h-3 rounded-full bg-gold" style={{ width: `${Math.min(100, subtotal / 5000 * 100)}%` }} /></div><input className="w-full rounded border border-gold/40 px-3 py-2" placeholder="Coupon code" /><dl className="mt-4 grid gap-2"><Line label="Subtotal" value={subtotal} /><Line label="Shipping" value={shipping} /><Line label="GST 18%" value={tax} /><Line label="Total" value={total} big /></dl><Link to="/checkout" className="gold-btn mt-5 block rounded px-5 py-3 text-center font-semibold">Proceed to Checkout</Link><Link to="/products" className="mt-3 block text-center text-gold-dark">Continue Shopping</Link></aside>; }
function Line({ label, value, big }: { label: string; value: number; big?: boolean }) { return <div className={`flex justify-between ${big ? "border-t border-gold/30 pt-3 text-xl font-bold" : ""}`}><dt>{label}</dt><dd>{inr.format(value)}</dd></div>; }

const addressSchema = z.object({ name: z.string().min(2), email: z.string().email(), phone: z.string().min(10), address: z.string().min(8), city: z.string().min(2), pincode: z.string().min(5) });
function Checkout() {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("Pay on Delivery");
  const [placing, setPlacing] = useState(false);
  const form = useForm({ resolver: zodResolver(addressSchema) });
  const nav = useNavigate();
  const { cart, clearCart } = useShop();
  
  const autocompleteMap: Record<string, string> = {
    name: "name",
    email: "email",
    phone: "tel",
    address: "street-address",
    city: "address-level2",
    pincode: "postal-code",
  };

  const placeOrder = async () => {
    if (!cart.length) {
      toast.error("Your cart is empty");
      return;
    }
    setPlacing(true);
    try {
      const order = await createOrder({
        items: cart.map((line) => ({ productId: line.product.id, sku: line.product.sku, quantity: line.qty })),
        address: form.getValues() as Record<string, string>,
        paymentMethod
      });
      const saved = { ...order, eta: "3-5 business days" };
      localStorage.setItem("innova-last-order", JSON.stringify(saved));
      clearCart();
      toast.success("Order placed successfully");
      nav(`/order/success/${order.orderNumber}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to place order");
    } finally {
      setPlacing(false);
    }
  };

  return <main className="mx-auto max-w-5xl px-4 py-10">
    <Seo title="Checkout" description="Secure checkout with delivery and payment." />
    <h1 className="font-display text-5xl">Checkout</h1>
    <div className="mt-5 flex flex-wrap gap-2">
      {["Delivery Information", "Order Review", "Payment"].map((s, i) => (
        <span className={`rounded-full px-4 py-2 ${step === i + 1 ? "bg-gold" : "bg-white"}`} key={s}>{s}</span>
      ))}
    </div>
    {step === 1 && (
      <form className="mt-6 grid gap-4 rounded bg-white p-6 md:grid-cols-2" onSubmit={form.handleSubmit(() => setStep(2))}>
        {["name", "email", "phone", "address", "city", "pincode"].map((x) => {
          const hasError = !!form.formState.errors[x as keyof typeof addressSchema.shape];
          const errorMsg = form.formState.errors[x as keyof typeof addressSchema.shape]?.message as string;
          const autocomplete = autocompleteMap[x] || "off";
          const label = x.charAt(0).toUpperCase() + x.slice(1);
          return (
            <div key={x} className={`flex flex-col gap-1.5 ${x === "address" ? "md:col-span-2" : ""}`}>
              <label htmlFor={`checkout-${x}`} className="text-sm font-semibold text-charcoal">{label}</label>
              <input
                id={`checkout-${x}`}
                {...form.register(x as any)}
                autoComplete={autocomplete}
                placeholder={`Enter your ${x}`}
                aria-invalid={hasError ? "true" : "false"}
                aria-describedby={hasError ? `checkout-${x}-error` : undefined}
                className={`rounded border px-4 py-2.5 min-h-[48px] ${hasError ? "border-burgundy focus:outline-burgundy" : "border-gold/40 focus:outline-gold"}`}
              />
              {hasError && (
                <span id={`checkout-${x}-error`} className="text-xs font-semibold text-burgundy" aria-live="polite">
                  {errorMsg || `Invalid ${x}`}
                </span>
              )}
            </div>
          );
        })}
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="checkout-shipping" className="text-sm font-semibold text-charcoal">Shipping Method</label>
          <select id="checkout-shipping" className="rounded border border-gold/40 px-3 py-2.5 h-[48px] focus:outline-gold bg-white">
            <option>Standard</option>
            <option>Express</option>
            <option>Same Day Mumbai</option>
          </select>
        </div>
        <button type="submit" className="gold-btn rounded px-5 py-3 font-semibold md:col-span-2 min-h-[48px]">Continue</button>
      </form>
    )}
    {step === 2 && <div className="mt-6 rounded bg-white p-6"><CartPage /><button onClick={() => setStep(3)} className="gold-btn rounded px-5 py-3">Payment</button></div>}
    {step === 3 && (
      <div className="mt-6 rounded bg-white p-6">
        <h2 className="font-display text-3xl">Payment</h2>
        <p className="text-mid">Choose a payment method. Online gateway keys can be enabled for production; pay on delivery works immediately.</p>
        {["Card", "UPI", "Net Banking", "Pay on Delivery"].map((x) => (
          <label className="mt-3 flex gap-2" key={x}>
            <input name="pay" type="radio" checked={paymentMethod === x} onChange={() => setPaymentMethod(x)} /> {x}
          </label>
        ))}
        <button disabled={placing} onClick={placeOrder} className="gold-btn mt-6 inline-flex items-center gap-2 rounded px-5 py-3 disabled:opacity-60">
          <Lock size={18} /> {placing ? "Placing Order..." : "Place Order"}
        </button>
      </div>
    )}
  </main>;
}

function labelFromSlug(value?: string) { return value ? value.split("-").map((x) => x[0].toUpperCase() + x.slice(1)).join(" ") : undefined; }
function Account({ page = "Profile" }: { page?: string }) { const navs = ["Profile", "Orders", "Wishlist", "Addresses", "Reviews", "Notifications", "Logout"]; const { data: orders = [] } = useQuery<any[]>({ queryKey: ["my-orders"], queryFn: fetchMyOrders, enabled: page === "Orders", retry: false }); return <main className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-[260px_1fr]"><Seo title="Account" description="Customer dashboard." /><aside className="rounded bg-white p-4">{navs.map((n) => <Link className="block rounded px-3 py-2 hover:bg-cream" to={`/account/${n.toLowerCase() === "profile" ? "profile" : n.toLowerCase()}`} key={n}>{n}</Link>)}</aside><section className="rounded bg-white p-6"><h1 className="font-display text-5xl">{page}</h1>{page === "Orders" ? <div className="mt-5 grid gap-4">{orders.length === 0 && <p className="rounded border border-gold/30 p-4">No orders yet.</p>}{orders.map((order) => <div className="rounded border border-gold/30 p-4" key={order.id}><div className="flex flex-wrap justify-between gap-3"><div><b>{order.orderNumber}</b><p className="text-sm text-mid">{new Date(order.createdAt).toLocaleDateString()}</p></div><span className="rounded-full bg-cream px-3 py-1 text-sm">{String(order.status).replace(/_/g, " ")}</span></div><p className="mt-2 font-semibold">{inr.format(order.total || 0)}</p><p className="text-sm text-mid">{order.items?.length || 0} item(s)</p><Link to={`/track-order?order=${order.orderNumber}`} className="mt-3 inline-block text-gold-dark">Track order</Link></div>)}</div> : <><p className="mt-3 text-mid">Manage your {page.toLowerCase()} with saved addresses, order tracking, invoices, review requests, and email preferences.</p><div className="mt-5 grid gap-3">{["Pending", "Confirmed", "Processing", "Shipped", "Delivered"].map((s) => <div className="rounded border border-gold/30 p-3" key={s}>{s}</div>)}</div></>}</section></main>; }
function AccountRoute() { const { page } = useParams(); return <Account page={labelFromSlug(page) || "Profile"} />; }
function Admin({ page = "Dashboard" }: { page?: string }) { const { data: adminProducts = [] } = useQuery<Product[]>({ queryKey: ["admin-products"], queryFn: () => fetchProducts({ limit: 6 }) }); const navs = [["Dashboard", BarChart3], ["Products", Package], ["Categories", Tags], ["Orders", ShoppingBag], ["Customers", Users], ["Coupons", Tags], ["Banners", Settings], ["Reviews", Star], ["Reports", BarChart3], ["Settings", Settings]]; return <main className="grid min-h-screen bg-[#f4f1ea] md:grid-cols-[250px_1fr]"><Seo title={`Admin ${page}`} description="Protected admin panel." /><aside className="bg-navy p-5 text-gold-light"><h1 className="font-display text-3xl text-gold">Admin</h1>{navs.map(([n, Icon]) => <Link className="mt-3 flex gap-2 rounded px-3 py-2 hover:bg-white/10" to={`/admin${n === "Dashboard" ? "" : `/${String(n).toLowerCase()}`}`} key={String(n)}>{typeof Icon !== "string" && <Icon size={18} />}{String(n)}</Link>)}</aside><section className="p-6"><h2 className="font-display text-5xl">{page}</h2><div className="mt-5 grid gap-4 md:grid-cols-4">{["Catalogue Value", "Seeded Products", "Categories", "Products in Stock"].map((k, i) => <div className="rounded bg-white p-5 shadow" key={k}><p className="text-mid">{k}</p><b className="text-2xl">{i === 0 ? inr.format(842300) : i === 1 ? 106 : i === 2 ? 5 : "Live"}</b></div>)}</div><div className="mt-6 rounded bg-white p-5"><h3 className="font-display text-3xl">{page} Management</h3><p className="text-mid">Product, category, coupon, banner, and order APIs are connected to the seeded catalogue database.</p><table className="mt-4 w-full text-left"><tbody>{adminProducts.map((p) => <tr className="border-t" key={p.id}><td className="py-2">{p.name}</td><td>{p.stock} in stock</td><td>{inr.format(p.price)}</td><td><button className="rounded border border-gold px-3 py-1">Edit</button></td></tr>)}</tbody></table></div></section></main>; }
function AdminRoute() { const { page } = useParams(); return <Admin page={labelFromSlug(page) || "Dashboard"} />; }
function StaticPage({ title }: { title: string }) { return <main className="mx-auto max-w-4xl px-4 py-12"><Seo title={title} description={`${title} at Innova Creations`} /><h1 className="font-display text-6xl">{title}</h1><p className="mt-4 text-lg text-mid">Innova Creations provides premium lights, chandeliers, custom design assistance, pan-India delivery, secure payments, easy returns, and attentive support for homes, stores, hotels, and studios.</p></main>; }
function Auth({ mode }: { mode: "Login" | "Register" | "Forgot Password" }) { const nav = useNavigate(); const [submitting, setSubmitting] = useState(false); return <main className="mx-auto max-w-md px-4 py-12"><Seo title={mode} description={`${mode} to Innova Creations`} /><form className="rounded bg-white p-6 shadow-gold" onSubmit={async (e) => { e.preventDefault(); if (mode === "Forgot Password") { toast.success("Password reset link sent"); return; } const formData = new FormData(e.currentTarget); setSubmitting(true); try { const payload = { email: String(formData.get("email")), password: String(formData.get("password")), name: String(formData.get("name") || "") }; const user = mode === "Login" ? await loginCustomer(payload) : await registerCustomer(payload); localStorage.setItem("innova-user", JSON.stringify(user)); toast.success(mode === "Login" ? "Signed in successfully" : "Account created successfully"); nav("/account"); } catch (error: any) { toast.error(error?.response?.data?.message || "Unable to continue"); } finally { setSubmitting(false); } }}><h1 className="font-display text-5xl">{mode}</h1>{mode === "Register" && <input required name="name" placeholder="Name" className="mt-4 w-full rounded border px-3 py-2" />}<input required name="email" type="email" placeholder="Email" className="mt-4 w-full rounded border px-3 py-2" />{mode !== "Forgot Password" && <input required minLength={8} name="password" type="password" placeholder="Password" className="mt-4 w-full rounded border px-3 py-2" />}<button disabled={submitting} className="gold-btn mt-5 w-full rounded py-3 disabled:opacity-60">{submitting ? "Please wait..." : mode}</button>{mode === "Login" && <Link to="/register" className="mt-4 block text-center text-gold-dark">Create an account</Link>}</form></main>; }
function Success() { const { id = "" } = useParams(); return <main className="grid min-h-[60vh] place-items-center px-4 text-center"><Seo title="Order Success" description="Order confirmed." /><motion.div initial={{ scale: .8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded bg-white p-10 shadow-gold"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gold text-4xl">✓</div><h1 className="mt-4 font-display text-5xl">Order Confirmed</h1><p>Order ID {id}. Expected delivery: 3-5 business days.</p><Link className="gold-btn mt-5 inline-block rounded px-5 py-3" to="/track-order">Track Your Order</Link></motion.div></main>; }
function TrackOrder() { const [query, setQuery] = useState(""); const [order, setOrder] = useState<any>(null); const [loading, setLoading] = useState(false); const track = async () => { const saved = JSON.parse(localStorage.getItem("innova-last-order") || "null"); const orderNumber = query.trim() || saved?.orderNumber; if (!orderNumber) { toast.error("Enter an order number"); return; } setLoading(true); try { const found = await fetchOrder(orderNumber); setOrder({ ...found, eta: "3-5 business days" }); toast.success("Order found"); } catch { if (saved?.orderNumber?.toLowerCase() === orderNumber.toLowerCase()) { setOrder(saved); toast.success("Order found"); } else { setOrder(null); toast.error("Order not found"); } } finally { setLoading(false); } }; return <main className="mx-auto max-w-3xl px-4 py-12"><Seo title="Track Order" description="Track your Innova Creations order." /><h1 className="font-display text-6xl">Track Order</h1><div className="mt-6 flex flex-col gap-3 rounded bg-white p-6 shadow sm:flex-row"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter order number" className="flex-1 rounded border border-gold/40 px-4 py-3" /><button disabled={loading} onClick={track} className="gold-btn rounded px-6 py-3 disabled:opacity-60">{loading ? "Checking..." : "Track"}</button></div>{order && <div className="mt-6 rounded bg-white p-6 shadow"><h2 className="font-display text-3xl">{order.orderNumber}</h2><p className="text-green-700">Status: {String(order.status).replace(/_/g, " ")}</p><p>Estimated delivery: {order.eta}</p><p className="mt-3 text-mid">Items: {order.items?.length || 0}</p></div>}</main>; }
function WhatsApp() { return <a aria-label="WhatsApp chat" className="fixed bottom-5 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-green-600 text-white shadow-xl" href="https://wa.me/919876543210?text=Hi!%20I'm%20interested%20in%20your%20products%20at%20Innova%20Creations."><MessageCircle /></a>; }

function Shell() { return <><Header /><Routes><Route path="/" element={<Home />} /><Route path="/products" element={<Listing />} /><Route path="/products/category/:slug" element={<Listing />} /><Route path="/search" element={<Listing />} /><Route path="/products/:slug" element={<ProductDetail />} /><Route path="/cart" element={<CartPage />} /><Route path="/checkout" element={<Checkout />} /><Route path="/order/success/:id" element={<Success />} /><Route path="/track-order" element={<TrackOrder />} /><Route path="/login" element={<Auth mode="Login" />} /><Route path="/register" element={<Auth mode="Register" />} /><Route path="/forgot-password" element={<Auth mode="Forgot Password" />} /><Route path="/reset-password" element={<Auth mode="Forgot Password" />} /><Route path="/account" element={<Account />} /><Route path="/account/:page" element={<AccountRoute />} /><Route path="/admin" element={<Admin />} /><Route path="/admin/:page" element={<AdminRoute />} />{["about", "contact", "shipping-policy", "returns-policy", "privacy-policy", "terms", "custom-order", "inspiration", "faqs", "blog", "sitemap"].map((p) => <Route key={p} path={`/${p}`} element={<StaticPage title={p.split("-").map((x) => x[0].toUpperCase() + x.slice(1)).join(" ")} />} />)}<Route path="*" element={<StaticPage title="404 Not Found" />} /></Routes><Footer /><WhatsApp /></>; }
export default function App() { return <BrowserRouter><Shell /></BrowserRouter>; }
