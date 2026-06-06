import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchOrder } from "../api";
import { Seo } from "../components/Seo";

export function TrackOrder() {
  const [searchParams] = useSearchParams();
  const initialOrderNumber = searchParams.get("order") || "";
  const [query, setQuery] = useState(initialOrderNumber);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const track = async (orderNum: string) => {
    const saved = JSON.parse(localStorage.getItem("innova-last-order") || "null");
    const targetOrder = orderNum.trim() || saved?.orderNumber;
    if (!targetOrder) {
      toast.error("Enter an order number");
      return;
    }
    setLoading(true);
    try {
      const found = await fetchOrder(targetOrder);
      setOrder({ ...found, eta: "3-5 business days" });
      toast.success("Order found");
    } catch {
      if (saved?.orderNumber?.toLowerCase() === targetOrder.toLowerCase()) {
        setOrder(saved);
        toast.success("Order found");
      } else {
        setOrder(null);
        toast.error("Order not found");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber) {
      track(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Seo title="Track Order" description="Track your Innova Creations order." />
      <h1 className="font-display text-6xl">Track Order</h1>
      <div className="mt-6 flex flex-col gap-3 rounded bg-white p-6 shadow-gold border border-gold/15 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter order number"
          className="flex-1 rounded border border-gold/40 px-4 py-3 focus:outline-gold"
        />
        <button
          disabled={loading}
          onClick={() => track(query)}
          className="gold-btn rounded px-6 py-3 disabled:opacity-60 font-semibold"
        >
          {loading ? "Checking..." : "Track"}
        </button>
      </div>
      {order && (
        <div className="mt-6 rounded bg-white p-6 shadow-gold border border-gold/15">
          <h2 className="font-display text-3xl text-navy">{order.orderNumber}</h2>
          <p className="text-green-700 font-semibold mt-1">
            Status: {String(order.status).replace(/_/g, " ")}
          </p>
          <p className="text-mid text-sm mt-1">Estimated delivery: {order.eta}</p>
          <p className="mt-3 text-sm text-charcoal font-semibold">
            Items: {order.items?.length || 0}
          </p>
        </div>
      )}
    </main>
  );
}
