import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { money } from "../lib/format.js";
import Pagination from "../components/Pagination.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

const SORTS = [
  { label: "Newest", sort: "createdAt", order: "desc" },
  { label: "Price: Low to High", sort: "price", order: "asc" },
  { label: "Price: High to Low", sort: "price", order: "desc" },
  { label: "Name A–Z", sort: "name", order: "asc" },
];

export default function CatalogPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [gender, setGender] = useState("");
  const [sortIdx, setSortIdx] = useState(0);

  const { user } = useAuth();
  const cart = useCart();

  const { data: brands } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => (await api.get("/brands")).data,
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get("/categories")).data,
  });

  const { sort, order } = SORTS[sortIdx];
  const params = {
    page,
    pageSize: 9,
    sort,
    order,
    ...(search ? { q: search } : {}),
    ...(brandId ? { brandId } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(gender ? { gender } : {}),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["products", params],
    queryFn: async () => (await api.get("/products", { params })).data,
  });

  const applySearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(q);
  };

  const reset = (setter) => (e) => {
    setPage(1);
    setter(e.target.value);
  };

  return (
    <div>
      <section className="mb-8 rounded-lg bg-ink p-10 text-center text-cream">
        <h1 className="text-4xl font-semibold">Discover your signature scent</h1>
        <p className="mt-2 text-cream/70">
          Curated luxury fragrances from the houses you love.
        </p>
      </section>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <form onSubmit={applySearch} className="flex flex-1 gap-2">
          <input
            className="input"
            placeholder="Search perfumes, brands…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn-primary">Search</button>
        </form>

        <select className="input w-auto" value={brandId} onChange={reset(setBrandId)}>
          <option value="">All brands</option>
          {brands?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          className="input w-auto"
          value={categoryId}
          onChange={reset(setCategoryId)}
        >
          <option value="">All types</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select className="input w-auto" value={gender} onChange={reset(setGender)}>
          <option value="">All</option>
          <option value="MALE">Men</option>
          <option value="FEMALE">Women</option>
          <option value="UNISEX">Unisex</option>
        </select>

        <select
          className="input w-auto"
          value={sortIdx}
          onChange={(e) => setSortIdx(Number(e.target.value))}
        >
          {SORTS.map((s, i) => (
            <option key={s.label} value={i}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <p className="py-20 text-center text-ink/50">Loading perfumes…</p>
      ) : data?.items.length === 0 ? (
        <p className="py-20 text-center text-ink/50">No perfumes match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              <Link to={`/products/${p.id}`}>
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="h-56 w-full object-cover"
                  loading="lazy"
                />
              </Link>
              <div className="p-4">
                <p className="text-xs uppercase tracking-wide text-gold">
                  {p.brand.name}
                </p>
                <Link to={`/products/${p.id}`}>
                  <h3 className="text-xl">{p.name}</h3>
                </Link>
                <p className="text-sm text-ink/50">
                  {p.volumeMl} ml · {p.category.name}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-semibold">{money(p.price)}</span>
                  {user ? (
                    <button
                      className="btn-gold"
                      disabled={p.stock === 0}
                      onClick={() => cart.add(p.id)}
                    >
                      {p.stock === 0 ? "Sold out" : "Add to cart"}
                    </button>
                  ) : (
                    <Link to="/login" className="btn-outline">
                      Login to buy
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={data?.page || 1}
        totalPages={data?.totalPages || 1}
        onPage={setPage}
      />
    </div>
  );
}
