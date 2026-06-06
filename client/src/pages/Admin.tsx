import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Package, Tags, ShoppingBag, Users, Settings, Star } from "lucide-react";
import { Product, inr } from "../data";
import { fetchProducts } from "../api";
import { Seo } from "../components/Seo";

function labelFromSlug(value?: string) {
  return value
    ? value
        .split("-")
        .map((x) => x[0].toUpperCase() + x.slice(1))
        .join(" ")
    : undefined;
}

export function Admin({ page = "Dashboard" }: { page?: string }) {
  const { data: adminProducts = [] } = useQuery<Product[]>({
    queryKey: ["admin-products"],
    queryFn: () => fetchProducts({ limit: 6 }),
  });

  const navs = [
    ["Dashboard", BarChart3],
    ["Products", Package],
    ["Categories", Tags],
    ["Orders", ShoppingBag],
    ["Customers", Users],
    ["Coupons", Tags],
    ["Banners", Settings],
    ["Reviews", Star],
    ["Reports", BarChart3],
    ["Settings", Settings],
  ] as const;

  return (
    <main className="grid min-h-screen bg-[#f4f1ea] md:grid-cols-[250px_1fr]">
      <Seo title={`Admin ${page}`} description="Protected admin panel." />
      <aside className="bg-navy p-5 text-gold-light">
        <h1 className="font-display text-3xl text-gold">Admin</h1>
        {navs.map(([n, Icon]) => (
          <Link
            className="mt-3 flex gap-2 rounded px-3 py-2 hover:bg-white/10 transition"
            to={`/admin${n === "Dashboard" ? "" : `/${String(n).toLowerCase()}`}`}
            key={String(n)}
          >
            {Icon && <Icon size={18} />}
            <span>{String(n)}</span>
          </Link>
        ))}
      </aside>
      <section className="p-6">
        <h2 className="font-display text-5xl text-navy">{page}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {["Catalogue Value", "Seeded Products", "Categories", "Products in Stock"].map(
            (k, i) => (
              <div className="rounded bg-white p-5 shadow-sm border border-gold/10" key={k}>
                <p className="text-mid text-sm">{k}</p>
                <b className="text-2xl text-charcoal">
                  {i === 0 ? inr.format(842300) : i === 1 ? 106 : i === 2 ? 5 : "Live"}
                </b>
              </div>
            )
          )}
        </div>
        <div className="mt-6 rounded bg-white p-5 shadow-sm border border-gold/10">
          <h3 className="font-display text-3xl text-navy">{page} Management</h3>
          <p className="text-mid text-sm mt-1">
            Product, category, coupon, banner, and order APIs are connected to the seeded
            catalogue database.
          </p>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gold/20 text-sm font-semibold text-charcoal">
                  <th className="py-2 pr-4">Product Name</th>
                  <th className="py-2 pr-4">Stock</th>
                  <th className="py-2 pr-4">Price</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminProducts.map((p) => (
                  <tr className="border-t border-gold/10 text-sm" key={p.id}>
                    <td className="py-3 pr-4 font-semibold text-charcoal">{p.name}</td>
                    <td className="py-3 pr-4 text-mid">{p.stock} in stock</td>
                    <td className="py-3 pr-4 font-semibold text-gold-dark">
                      {inr.format(p.price)}
                    </td>
                    <td className="py-3 text-right">
                      <button className="rounded border border-gold px-3 py-1 text-xs hover:bg-cream transition font-semibold">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

export function AdminRoute() {
  const { page } = useParams();
  return <Admin page={labelFromSlug(page) || "Dashboard"} />;
}
