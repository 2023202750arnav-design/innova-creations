import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { inr } from "../data";
import { useShop } from "../store";
import { Seo } from "../components/Seo";

export function CartPage() {
  const { cart, updateQty, removeCart } = useShop();
  const subtotal = cart.reduce((a, l) => a + l.product.price * l.qty, 0);
  const discount = cart.reduce((a, l) => a + (l.product.compareAtPrice - l.product.price) * l.qty, 0);
  const shipping = subtotal >= 5000 || subtotal === 0 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Seo title="Cart" description="Review cart and order summary." />
      <h1 className="font-display text-5xl">Your Cart</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4">
          {cart.length === 0 && (
            <p className="rounded bg-white p-8 border border-gold/15 text-center text-mid">
              Your cart is waiting for something beautiful.
            </p>
          )}
          {cart.map((line) => (
            <div
              className="grid gap-4 rounded bg-white p-4 border border-gold/10 sm:grid-cols-[100px_1fr_auto] items-center"
              key={line.product.id}
            >
              <img
                src={line.product.images[0]}
                className="h-24 w-24 rounded object-cover mx-auto"
                alt={line.product.name}
              />
              <div className="text-center sm:text-left">
                <h3 className="font-display text-2xl">{line.product.name}</h3>
                <p className="text-mid text-sm">
                  {line.product.finish} / {line.product.material}
                </p>
                <b className="text-charcoal mt-1 block">{inr.format(line.product.price)}</b>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  aria-label="Decrease"
                  className="p-1.5 border border-gold/30 rounded-full hover:bg-cream transition"
                  onClick={() => updateQty(line.product.id, line.qty - 1)}
                >
                  <Minus size={16} />
                </button>
                <span className="w-6 text-center font-semibold">{line.qty}</span>
                <button
                  aria-label="Increase"
                  className="p-1.5 border border-gold/30 rounded-full hover:bg-cream transition"
                  onClick={() => updateQty(line.product.id, line.qty + 1)}
                >
                  <Plus size={16} />
                </button>
                <button
                  aria-label="Remove"
                  className="p-1.5 ml-2 text-burgundy hover:bg-cream rounded transition"
                  onClick={() => removeCart(line.product.id)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <Summary subtotal={subtotal} discount={discount} shipping={shipping} tax={tax} />
      </div>
    </main>
  );
}

interface SummaryProps {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
}

function Summary({ subtotal, discount, shipping, tax }: SummaryProps) {
  const total = subtotal + shipping + tax;
  
  return (
    <aside className="h-max rounded-lg border border-gold/30 bg-white p-5">
      <h2 className="font-display text-3xl">Order Summary</h2>
      {discount > 0 && (
        <p className="mt-3 text-green-700 text-sm font-semibold">
          You save {inr.format(discount)}!
        </p>
      )}
      <div className="my-4 h-3 rounded-full bg-cream overflow-hidden">
        <div
          className="h-3 rounded-full bg-gold transition-all duration-300"
          style={{ width: `${Math.min(100, (subtotal / 5000) * 100)}%` }}
        />
      </div>
      <input
        className="w-full rounded border border-gold/40 px-3 py-2 focus:outline-gold"
        placeholder="Coupon code"
      />
      <dl className="mt-4 grid gap-2">
        <Line label="Subtotal" value={subtotal} />
        <Line label="Shipping" value={shipping} />
        <Line label="GST 18%" value={tax} />
        <Line label="Total" value={total} big />
      </dl>
      <Link
        to="/checkout"
        className="gold-btn mt-5 block rounded px-5 py-3 text-center font-semibold"
      >
        Proceed to Checkout
      </Link>
      <Link to="/products" className="mt-3 block text-center text-gold-dark hover:underline">
        Continue Shopping
      </Link>
    </aside>
  );
}

interface LineProps {
  label: string;
  value: number;
  big?: boolean;
}

function Line({ label, value, big }: LineProps) {
  return (
    <div
      className={`flex justify-between ${
        big ? "border-t border-gold/30 pt-3 text-xl font-bold text-charcoal" : "text-mid text-sm"
      }`}
    >
      <dt>{label}</dt>
      <dd>{inr.format(value)}</dd>
    </div>
  );
}
