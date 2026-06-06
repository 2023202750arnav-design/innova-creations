import { useState, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Product, categories } from "../data";
import { fetchProducts } from "../api";
import { Seo } from "../components/Seo";
import { ProductCard } from "../components/ProductCard";

export function Listing() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const [sort, setSort] = useState("Featured");
  const [list, setList] = useState(false);
  
  const { data = [] } = useQuery<Product[]>({
    queryKey: ["products", slug],
    queryFn: () => fetchProducts({ category: slug, limit: 200 }),
  });

  const q = params.get("q")?.toLowerCase();
  const newOnly = params.get("new") === "true";
  const saleOnly = params.get("sale") === "true";

  const visible = useMemo(
    () =>
      [...(data as Product[])]
        .filter((p) => !q || p.name.toLowerCase().includes(q))
        .filter((p) => !newOnly || (p.badges ?? []).includes("New"))
        .filter((p) => !saleOnly || (p.badges ?? []).includes("Sale"))
        .sort((a, b) =>
          sort.includes("Low")
            ? a.price - b.price
            : sort.includes("High")
            ? b.price - a.price
            : b.rating - a.rating
        ),
    [data, q, newOnly, saleOnly, sort]
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <Seo title="Products" description="Browse luxury lights and chandeliers with filters." />
      <p className="mb-3 text-sm text-mid">
        Home / Products {slug ? `/ ${slug}` : ""}
      </p>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-5xl">Showing {visible.length} products</h1>
        <div className="flex gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded border border-gold/40 px-3 py-2"
          >
            {[
              "Featured",
              "Price Low-High",
              "Price High-Low",
              "Newest",
              "Best Rated",
              "Most Reviewed",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <button
            className="rounded border border-gold px-3"
            onClick={() => setList(!list)}
          >
            {list ? "Grid" : "List"}
          </button>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[270px_1fr]">
        <Filters />
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                to={`/products/category/${c.slug}`}
                className="rounded-full border border-gold/40 px-3 py-1 text-sm"
                key={c.slug}
              >
                {c.name}
              </Link>
            ))}
          </div>
          <div
            className={
              list
                ? "grid gap-5"
                : "grid gap-5 md:grid-cols-2 xl:grid-cols-3"
            }
          >
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function Filters() {
  return (
    <aside className="sticky top-28 h-max rounded-lg border border-gold/30 bg-white p-5">
      <h2 className="font-display text-3xl">Filters</h2>
      {[
        "Category",
        "Material",
        "Color Finish",
        "Room Type",
        "Rating",
        "Stock Status",
      ].map((g) => (
        <div className="mt-5" key={g}>
          <b>{g}</b>
          <div className="mt-2 grid gap-2 text-sm">
            {["Gold", "Crystal", "Brass", "LED", "In Stock only"].map((x) => (
              <label className="flex gap-2" key={x}>
                <input type="checkbox" /> {x}
              </label>
            ))}
          </div>
        </div>
      ))}
      <label className="mt-5 block">
        <b>Price Range</b>
        <input type="range" min="1000" max="80000" className="mt-2 w-full" />
      </label>
      <button className="mt-4 text-sm text-burgundy">Clear All</button>
    </aside>
  );
}
