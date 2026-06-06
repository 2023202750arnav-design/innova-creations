import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";
import { Product, inr } from "../data";
import { useShop } from "../store";
import { Stars } from "./Stars";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addCart = useShop((s) => s.addCart);
  const toggle = useShop((s) => s.toggleWishlist);
  const wishlist = useShop((s) => s.wishlist);
  const badges = product.badges ?? [];

  return (
    <motion.article
      whileInView={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 18 }}
      className="card-hover group overflow-hidden rounded-lg border border-gold/20 bg-white"
    >
      <Link
        to={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden shimmer"
      >
        <img
          src={product.images[0]}
          loading="lazy"
          className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
          alt={product.name}
        />
        {product.images[1] && (
          <img
            src={product.images[1]}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain opacity-0 transition duration-500 group-hover:opacity-100"
            alt={`${product.name} alternative`}
          />
        )}
        {badges.map((b) => (
          <span
            key={b}
            className="absolute left-3 top-3 rounded bg-burgundy px-2 py-1 text-xs text-white"
          >
            {b}
          </span>
        ))}
      </Link>
      <div className="p-4">
        <div className="flex justify-between gap-3">
          <h3 className="font-display text-xl">
            <Link to={`/products/${product.slug}`}>{product.name}</Link>
          </h3>
          <button
            aria-label="Toggle wishlist"
            onClick={() => toggle(product.id)}
            className={wishlist.includes(product.id) ? "text-burgundy" : ""}
          >
            <Heart
              size={20}
              fill={wishlist.includes(product.id) ? "currentColor" : "none"}
            />
          </button>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-mid">
          {product.shortDescription}
        </p>
        <p className="mt-2 text-sm text-gold-dark">
          <Stars value={product.rating} /> {product.rating} ({product.reviews})
        </p>
        <div className="mt-2 flex items-end gap-2">
          <b className="text-lg">{inr.format(product.price)}</b>
          <s className="text-sm text-mid">{inr.format(product.compareAtPrice)}</s>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              addCart(product);
              toast.success("Added to cart");
            }}
            className="gold-btn flex-1 rounded px-4 py-2 font-semibold"
          >
            Add to Cart
          </button>
          <Link
            to={`/products/${product.slug}`}
            className="rounded border border-gold px-3 py-2 text-sm"
          >
            Quick View
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
