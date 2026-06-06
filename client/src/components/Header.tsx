import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Heart, User, ShoppingBag, Search } from "lucide-react";
import { useShop } from "../store";

export function Header() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const cart = useShop((s) => s.cart);
  const wishlist = useShop((s) => s.wishlist);

  const goSearch = () => q.trim() && nav(`/search?q=${encodeURIComponent(q.trim())}`);
  const links = [
    ["Lights", "/products"],
    ["Wall Lights", "/products/category/wall-lights"],
    ["LED Collection", "/products/category/led-pendant-ceiling"],
    ["New Arrivals", "/products?new=true"],
    ["Sale", "/products?sale=true"],
    ["About", "/about"],
  ];

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-navy px-4 py-2 text-center text-sm text-gold-light">
        Free Shipping on orders above ₹5000 | Custom Orders: +91-98765-43210 | innova@example.com
      </div>
      <div className="glass px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <button
            aria-label="Open menu"
            className="lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <Link to="/" className="mr-auto flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-gold text-gold">
              ♛
            </span>
            <span>
              <strong className="block font-display text-2xl tracking-wide">
                INNOVA CREATIONS
              </strong>
              <em className="font-script text-lg text-gold-dark">
                Lights & Chandeliers
              </em>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {links.map(([label, href]) => (
              <NavLink
                className={({ isActive }) =>
                  `text-sm font-semibold ${
                    isActive ? "text-gold-dark" : "text-charcoal"
                  }`
                }
                to={href}
                key={label}
              >
                {label}
                {label === "Sale" && (
                  <span className="ml-1 rounded bg-burgundy px-1.5 py-.5 text-xs text-white">
                    SALE
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="relative hidden w-64 md:block">
            <input
              aria-label="Search products"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goSearch()}
              placeholder="Search wall lights, pendants..."
              className="w-full rounded-full border border-gold/40 bg-white px-4 py-2 pr-10"
            />
            <button
              aria-label="Search"
              className="absolute right-3 top-2.5"
              onClick={goSearch}
            >
              <Search size={18} />
            </button>
          </div>
          <Link aria-label="Wishlist" to="/account/wishlist" className="relative">
            <Heart />
            <Badge count={wishlist.length} />
          </Link>
          <Link aria-label="Account" to="/account">
            <User />
          </Link>
          <Link aria-label="Cart" to="/cart" className="relative">
            <ShoppingBag />
            <Badge count={cart.reduce((a, b) => a + b.qty, 0)} />
          </Link>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-navy/70 lg:hidden">
          <div className="ml-auto h-full w-80 bg-ivory p-6">
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="float-right"
            >
              <X />
            </button>
            <div className="mt-10 grid gap-4">
              {links.map(([label, href]) => (
                <Link
                  onClick={() => setOpen(false)}
                  to={href}
                  className="border-b border-gold/20 py-3 font-display text-2xl"
                  key={label}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function Badge({ count }: { count: number }) {
  return count ? (
    <span className="absolute -right-3 -top-3 grid h-5 min-w-5 place-items-center rounded-full bg-burgundy px-1 text-xs text-white">
      {count}
    </span>
  ) : null;
}
