import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Minus, Plus } from "lucide-react";
import { Product, inr } from "../data";
import { fetchProduct, fetchProducts } from "../api";
import { useShop } from "../store";
import { Seo } from "../components/Seo";
import { Stars } from "../components/Stars";
import { ProductCard } from "../components/ProductCard";

export function ProductDetail() {
  const { slug = "" } = useParams();
  const { data } = useQuery<Product | undefined>({
    queryKey: ["product", slug],
    queryFn: () => fetchProduct(slug),
  });
  const product = data as Product | undefined;
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);
  const addCart = useShop((s) => s.addCart);
  const toggleWishlist = useShop((s) => s.toggleWishlist);
  const wishlist = useShop((s) => s.wishlist);

  const [selectedFinish, setSelectedFinish] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  useEffect(() => {
    if (product) {
      setSelectedFinish(product.finish || "Gold");
      setSelectedSize(product.variants?.[0]?.value || "Standard");
    }
  }, [product]);

  const handleFinishChange = (finish: string) => {
    setSelectedFinish(finish);
    if (product && product.images && product.images.length > 1) {
      if (finish !== product.finish) {
        setImg(1);
      } else {
        setImg(0);
      }
    }
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    if (product && product.images && product.images.length > 1) {
      const sizes = product.variants.map((v) => v.value);
      const sizeIndex = sizes.indexOf(size);
      if (sizeIndex > 0) {
        setImg(1);
      } else {
        setImg(0);
      }
    }
  };

  const { data: related = [] } = useQuery<Product[]>({
    queryKey: ["related", product?.category],
    queryFn: () => fetchProducts({ category: product?.category, limit: 4 }),
    enabled: Boolean(product?.category),
  });

  if (!product) return <div className="p-10 text-center font-semibold">Product not found.</div>;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: product.stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviews,
    },
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <Seo title={product.name} description={product.shortDescription} />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-lg bg-cream p-4">
            <img
              src={product.images[img]}
              className="h-full w-full object-contain transition hover:scale-110"
              alt={product.name}
            />
          </div>
          <div className="mt-3 flex gap-3">
            {product.images.map((src, i) => (
              <button
                key={src}
                onClick={() => {
                  setImg(i);
                  if (i === 0) {
                    setSelectedFinish(product.finish || "Gold");
                    setSelectedSize(product.variants?.[0]?.value || "Standard");
                  } else if (i === 1) {
                    const finishes = [product.finish, "Gold", "Chrome", "Black"].filter(Boolean).slice(0, 4);
                    if (finishes.length > 1) {
                      setSelectedFinish(finishes[1]);
                    }
                    if (product.variants && product.variants.length > 1) {
                      setSelectedSize(product.variants[1].value);
                    }
                  }
                }}
                className={`h-20 w-20 overflow-hidden rounded border bg-cream p-1 ${
                  img === i ? "border-gold border-2" : "border-gold/40"
                }`}
                aria-label={`View product image ${i + 1}`}
              >
                <img src={src} className="h-full w-full object-contain" alt="" />
              </button>
            ))}
          </div>
        </div>
        <section>
          <span className="rounded-full bg-gold px-3 py-1 text-sm font-semibold">
            Innova Creations
          </span>
          <h1 className="mt-4 font-display text-6xl">{product.name}</h1>
          <p className="mt-2 text-gold-dark">
            <Stars value={product.rating} /> {product.rating} ({product.reviews} reviews)
          </p>
          <div className="mt-4 flex items-end gap-3">
            <b className="text-3xl">{inr.format(product.price)}</b>
            <s className="text-mid">{inr.format(product.compareAtPrice)}</s>
            <span className="text-burgundy">
              {Math.round((1 - product.price / product.compareAtPrice) * 100)}% off
            </span>
          </div>
          <div
            className="prose prose-sm mt-4 max-w-none text-mid"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
          <div className="mt-5 grid gap-3">
            <b>Finish/Color</b>
            <div className="flex flex-wrap gap-2">
              {[product.finish, "Gold", "Chrome", "Black"]
                .filter(Boolean)
                .slice(0, 4)
                .map((x) => {
                  const isSelected = selectedFinish === x;
                  return (
                    <button
                      onClick={() => handleFinishChange(x)}
                      className={`rounded border px-4 py-2 transition ${
                        isSelected
                          ? "border-gold bg-gold text-white font-semibold shadow-sm"
                          : "border-gold/50 text-charcoal hover:bg-cream"
                      }`}
                      key={x}
                    >
                      {x}
                    </button>
                  );
                })}
            </div>
            <b>Size/Wattage</b>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => {
                const isSelected = selectedSize === v.value;
                return (
                  <button
                    onClick={() => handleSizeChange(v.value)}
                    className={`rounded border px-4 py-2 transition ${
                      isSelected
                        ? "border-gold bg-gold text-white font-semibold shadow-sm"
                        : "border-gold/50 text-charcoal hover:bg-cream"
                    }`}
                    key={v.value}
                  >
                    {v.value}
                  </button>
                );
              })}
            </div>
          </div>
          <p
            className={`mt-4 font-semibold ${
              product.stock <= 5 ? "text-burgundy" : "text-green-700"
            }`}
          >
            {product.stock <= 5 ? `Only ${product.stock} left in stock!` : "In Stock"}
          </p>
          <div className="mt-5 flex w-36 items-center justify-between rounded border border-gold">
            <button
              aria-label="Decrease"
              className="p-3 hover:bg-cream transition"
              onClick={() => setQty(Math.max(1, qty - 1))}
            >
              <Minus />
            </button>
            {qty}
            <button
              aria-label="Increase"
              className="p-3 hover:bg-cream transition"
              onClick={() => setQty(qty + 1)}
            >
              <Plus />
            </button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <button
              data-testid="product-add-cart"
              onClick={() => {
                const variantLabel = [selectedFinish, selectedSize].filter(Boolean).join(" / ");
                addCart(product, qty, variantLabel);
                toast.success(`Added ${variantLabel} to cart`);
              }}
              className="gold-btn rounded px-6 py-3 font-semibold"
            >
              Add to Cart
            </button>
            <button
              data-testid="product-wishlist"
              onClick={() => {
                toggleWishlist(product.id);
                toast.success(
                  wishlist.includes(product.id)
                    ? "Removed from wishlist"
                    : "Added to wishlist"
                );
              }}
              className="rounded border border-gold px-6 py-3 hover:bg-cream transition"
            >
              {wishlist.includes(product.id) ? "Wishlisted" : "Add to Wishlist"}
            </button>
            <Link
              data-testid="product-buy-now"
              to="/checkout"
              onClick={() => {
                const variantLabel = [selectedFinish, selectedSize].filter(Boolean).join(" / ");
                addCart(product, qty, variantLabel);
              }}
              className="rounded bg-navy px-6 py-3 text-center text-white hover:bg-navy/90 transition"
            >
              Buy Now
            </Link>
          </div>
          <p className="mt-4 text-sm text-mid">EMI available from ₹299/month</p>
          <input
            className="mt-3 rounded border border-gold/40 px-4 py-2 w-full max-w-xs focus:outline-gold"
            placeholder="Enter pincode for delivery estimate"
          />
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {["Free Shipping", "Easy Returns", "Secure Payment", "Genuine Product"].map((x) => (
              <span className="rounded bg-cream p-2 text-center" key={x}>
                {x}
              </span>
            ))}
          </div>
        </section>
      </div>
      <Accordions product={product} />
      <Reviews product={product} />
      <Section title="You Might Also Like">
        <div className="grid gap-5 md:grid-cols-4">
          {related
            .filter((p) => p.id !== product.id)
            .slice(0, 4)
            .map((p) => (
              <ProductCard product={p} key={p.id} />
            ))}
        </div>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="ornament mb-8 text-center font-display text-4xl">{title}</h2>
      {children}
    </section>
  );
}

function Accordions({ product }: { product: Product }) {
  return (
    <div className="mt-10 grid gap-3">
      {["Description", "Specifications", "Installation Guide", "Shipping & Returns"].map((x) => (
        <details className="rounded border border-gold/30 bg-white p-4" key={x}>
          <summary className="cursor-pointer font-semibold focus:outline-none">{x}</summary>
          {x === "Specifications" ? (
            <p className="mt-3 text-mid">
              Material: {product.material}; Finish: {product.finish}; Room: {product.room}; GST:
              18%; Indoor lighting product.
            </p>
          ) : (
            <div
              className="prose prose-sm mt-3 max-w-none text-mid"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}
        </details>
      ))}
    </div>
  );
}

function Reviews({ product }: { product: Product }) {
  return (
    <Section title="Ratings & Reviews">
      <div className="grid gap-5 md:grid-cols-[260px_1fr]">
        <div className="rounded-full border-[18px] border-gold p-10 text-center flex flex-col justify-center items-center">
          <b className="font-display text-5xl">{product.rating}</b>
          <p className="text-sm text-mid">{product.reviews} reviews</p>
        </div>
        <div className="grid gap-3">
          {[
            "Verified finish and quick delivery.",
            "The chandelier completely changed our dining room.",
            "Helpful team for custom sizing.",
          ].map((r, i) => (
            <div className="rounded bg-white p-4 shadow-sm border border-gold/10" key={r}>
              <Stars value={5 - i * 0.5} />
              <b className="ml-2 align-middle text-sm">Verified Purchase</b>
              <p className="mt-2 text-charcoal">{r}</p>
              <button className="text-sm text-gold-dark mt-2 hover:underline">
                Helpful ({12 - i})
              </button>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
