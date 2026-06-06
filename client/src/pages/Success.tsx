import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Seo } from "../components/Seo";

export function Success() {
  const { id = "" } = useParams();

  return (
    <main className="grid min-h-[60vh] place-items-center px-4 text-center">
      <Seo title="Order Success" description="Order confirmed." />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded bg-white p-10 shadow-gold border border-gold/15 max-w-md"
      >
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gold text-white text-4xl">
          ✓
        </div>
        <h1 className="mt-4 font-display text-5xl text-navy">Order Confirmed</h1>
        <p className="mt-2 text-mid text-sm">
          Order ID: <strong className="text-charcoal">{id}</strong>
        </p>
        <p className="text-mid text-sm mt-1">Expected delivery: 3-5 business days.</p>
        <Link className="gold-btn mt-5 inline-block rounded px-5 py-3 font-semibold" to="/track-order">
          Track Your Order
        </Link>
      </motion.div>
    </main>
  );
}
