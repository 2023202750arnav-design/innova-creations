import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchMyOrders } from "../api";
import { Seo } from "../components/Seo";
import { inr } from "../data";

function labelFromSlug(value?: string) {
  return value
    ? value
        .split("-")
        .map((x) => x[0].toUpperCase() + x.slice(1))
        .join(" ")
    : undefined;
}

export function Account({ page = "Profile" }: { page?: string }) {
  const navs = [
    "Profile",
    "Orders",
    "Wishlist",
    "Addresses",
    "Reviews",
    "Notifications",
    "Logout",
  ];
  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["my-orders"],
    queryFn: fetchMyOrders,
    enabled: page === "Orders",
    retry: false,
  });

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-[260px_1fr]">
      <Seo title="Account" description="Customer dashboard." />
      <aside className="rounded bg-white p-4 border border-gold/15 h-max">
        {navs.map((n) => (
          <Link
            className="block rounded px-3 py-2 hover:bg-cream transition font-semibold text-charcoal"
            to={`/account/${n.toLowerCase() === "profile" ? "profile" : n.toLowerCase()}`}
            key={n}
          >
            {n}
          </Link>
        ))}
      </aside>
      <section className="rounded bg-white p-6 border border-gold/15">
        <h1 className="font-display text-5xl text-navy">{page}</h1>
        {page === "Orders" ? (
          <div className="mt-5 grid gap-4">
            {orders.length === 0 && (
              <p className="rounded border border-gold/30 p-4 text-mid text-sm">No orders yet.</p>
            )}
            {orders.map((order) => (
              <div className="rounded border border-gold/30 p-4" key={order.id}>
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <b className="text-charcoal">{order.orderNumber}</b>
                    <p className="text-xs text-mid">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-gold-dark">
                    {String(order.status).replace(/_/g, " ")}
                  </span>
                </div>
                <p className="mt-2 font-semibold text-charcoal">{inr.format(order.total || 0)}</p>
                <p className="text-xs text-mid">{order.items?.length || 0} item(s)</p>
                <Link
                  to={`/track-order?order=${order.orderNumber}`}
                  className="mt-3 inline-block text-gold-dark hover:underline text-sm font-semibold"
                >
                  Track order
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <>
            <p className="mt-3 text-mid text-sm">
              Manage your {page.toLowerCase()} with saved addresses, order tracking,
              invoices, review requests, and email preferences.
            </p>
            <div className="mt-5 grid gap-3">
              {["Pending", "Confirmed", "Processing", "Shipped", "Delivered"].map((s) => (
                <div className="rounded border border-gold/30 p-3 text-sm text-charcoal font-semibold" key={s}>
                  {s}
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export function AccountRoute() {
  const { page } = useParams();
  return <Account page={labelFromSlug(page) || "Profile"} />;
}
