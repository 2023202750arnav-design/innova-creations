import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ShieldCheck, Lock, Truck, RefreshCw } from "lucide-react";
import { Category, categories, heroSlides, Product } from "../data";
import { fetchCategories, fetchProducts } from "../api";
import { Seo } from "../components/Seo";
import { ProductCard } from "../components/ProductCard";
import { Stars } from "../components/Stars";

export function Home() {
  const { data: featured = [] } = useQuery<Product[]>({
    queryKey: ["home-featured"],
    queryFn: () => fetchProducts({ featured: true, limit: 8 }),
  });
  const { data: arrivals = [] } = useQuery<Product[]>({
    queryKey: ["home-new"],
    queryFn: () => fetchProducts({ new_arrival: true, limit: 4 }),
  });
  const { data: realCategories = categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  return (
    <>
      <Seo
        title="Luxury Lights and Chandeliers"
        description="Premium wall lights, pendant lights, LED ceiling lights, and crystal chandeliers."
      />
      <section className="relative min-h-[86vh] overflow-hidden text-white">
        <Swiper loop autoplay>
          {heroSlides.map((s) => (
            <SwiperSlide key={s.title}>
              <div
                className="min-h-[86vh] bg-cover bg-center"
                style={{ backgroundImage: `url(${s.image})` }}
              >
                <div className="grain flex min-h-[86vh] items-center px-6">
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto max-w-7xl"
                  >
                    <p className="font-script text-4xl text-gold-light">
                      Royal craft for luminous homes
                    </p>
                    <h1 className="max-w-3xl font-display text-6xl md:text-8xl">
                      {s.title}
                    </h1>
                    <p className="mt-4 max-w-xl text-xl">{s.subtitle}</p>
                    <div className="mt-8 flex flex-wrap gap-4">
                      <Link
                        className="gold-btn rounded px-6 py-3 font-semibold"
                        to="/products"
                      >
                        Shop Lights
                      </Link>
                      <Link
                        className="rounded border border-gold bg-navy/50 px-6 py-3 font-semibold text-gold-light"
                        to="/products/category/crystal-chandeliers"
                      >
                        Explore Chandeliers
                      </Link>
                    </div>
                  </motion.div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>
      <Marquee />
      <CategoryGrid items={realCategories} />
      <Section title="Bestsellers">
        <Swiper
          slidesPerView={1.1}
          spaceBetween={18}
          breakpoints={{
            768: { slidesPerView: 3 },
            1100: { slidesPerView: 4 },
          }}
        >
          {featured.map((p) => (
            <SwiperSlide key={p.id}>
              <ProductCard product={p} />
            </SwiperSlide>
          ))}
        </Swiper>
      </Section>
      <Why />
      <Section title="New Arrivals">
        <div className="grid gap-5 md:grid-cols-4">
          {arrivals.map((p) => (
            <ProductCard product={p} key={p.id} />
          ))}
        </div>
      </Section>
      <Editorial />
      <Testimonials />
      <Newsletter />
    </>
  );
}

function Marquee() {
  return (
    <div className="overflow-hidden bg-gold py-2 text-charcoal">
      <div className="animate-pulse whitespace-nowrap text-center font-semibold">
        Free Shipping on orders above ₹5000 | Premium Quality | 30-Day Returns | Custom Orders Available
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="ornament mb-8 text-center font-display text-4xl">{title}</h2>
      {children}
    </section>
  );
}

function CategoryGrid({ items = categories }: { items?: Category[] }) {
  return (
    <Section title="Shop by Category">
      <div className="grid gap-5 md:grid-cols-3">
        {items.map((category) => (
          <Link
            key={category.slug}
            to={`/products/category/${category.slug}`}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg"
          >
            <img
              src={category.image}
              className="h-full w-full object-cover transition group-hover:scale-110"
              loading="lazy"
              alt={category.name}
            />
            <span className="absolute inset-0 grid place-items-center bg-navy/35 px-4 text-center font-display text-4xl text-gold-light">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}

function Why() {
  return (
    <Section title="Why Choose Us">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          [ShieldCheck, "Handcrafted Quality"],
          [Lock, "100% Genuine Products"],
          [Truck, "Pan-India Shipping"],
          [RefreshCw, "Custom Design Available"],
        ].map(([Icon, text]) => (
          <div
            className="rounded-lg border border-gold/30 bg-cream p-6 text-center"
            key={String(text)}
          >
            {typeof Icon !== "string" && (
              <Icon className="mx-auto mb-3 text-gold-dark" />
            )}
            <b>{text as string}</b>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Editorial() {
  return (
    <section className="bg-navy py-14 text-white">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 md:grid-cols-2">
        <img
          src="/catalog-products/products/innova-ncp43-1.jpg"
          className="rounded-lg"
          loading="lazy"
          alt="Room inspiration background"
        />
        <div>
          <p className="font-script text-4xl text-gold-light">Room Inspiration</p>
          <h2 className="font-display text-5xl">Transform Your Space</h2>
          <p className="mt-4 text-lg text-gold-light">
            Layer brass, crystal, and LED warmth into rooms that feel collected and
            deeply personal.
          </p>
          <Link
            className="gold-btn mt-6 inline-block rounded px-6 py-3"
            to="/products/category/crystal-chandeliers"
          >
            Shop This Look
          </Link>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <Section title="Loved by Homes Across India">
      <div className="grid gap-4 md:grid-cols-5">
        {["Aditi", "Rahul", "Meera", "Kabir", "Noor"].map((n, i) => (
          <div className="rounded-lg bg-white p-5 shadow" key={n}>
            <img
              src={`https://i.pravatar.cc/80?img=${i + 12}`}
              className="mb-3 h-12 w-12 rounded-full"
              alt={`${n} avatar`}
            />
            <Stars value={5 - (i % 2) * 0.5} />
            <p className="mt-2 text-sm">
              Beautiful finish, secure packaging, and the room feels instantly
              elevated.
            </p>
            <b className="mt-3 block">{n}</b>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Newsletter() {
  return (
    <section className="mx-auto max-w-4xl rounded-lg border border-gold bg-cream p-8 text-center">
      <h2 className="font-display text-4xl">Get 10% off your first order</h2>
      <form
        className="mt-5 flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Welcome to Innova Creations");
        }}
      >
        <input
          required
          type="email"
          placeholder="Email address"
          className="flex-1 rounded border border-gold/40 px-4 py-3"
        />
        <button className="gold-btn rounded px-6 py-3">Subscribe</button>
      </form>
    </section>
  );
}
