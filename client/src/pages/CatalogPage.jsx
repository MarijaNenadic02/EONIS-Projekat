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
  { label: "Name A to Z", sort: "name", order: "asc" },
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
      {/* Hero */}
      <section className="relative mb-12 overflow-hidden rounded-2xl bg-ink shadow-lift">
        <img
          src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1600&q=80"
          alt="An arrangement of luxury perfume bottles"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
        <div className="relative px-8 py-20 sm:px-14 sm:py-28">
          <p className="eyebrow mb-4 animate-fade-in">Maison Essence</p>
          <h1 className="max-w-2xl text-balance text-5xl font-medium leading-[1.05] text-cream animate-fade-up sm:text-6xl">
            Discover your signature scent
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-cream/70 animate-fade-up">
            A curated collection of luxury fragrances from the houses you love,
            chosen for character and crafted to last.
          </p>
          <a href="#catalog" className="btn-gold mt-8 animate-fade-up">
            Explore the collection
          </a>
        </div>
      </section>

      {/* Controls */}
      <div id="catalog" className="mb-8 scroll-mt-24">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-3xl">The collection</h2>
          <span className="text-sm text-ink-muted">
            {data ? `${data.total} fragrances` : " "}
          </span>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <form onSubmit={applySearch} className="flex flex-1 gap-2">
            <input
              className="input"
              placeholder="Search perfumes, brands…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search perfumes"
            />
            <button className="btn-primary shrink-0">Search</button>
          </form>

          <select
            className="input w-auto"
            value={brandId}
            onChange={reset(setBrandId)}
            aria-label="Filter by brand"
          >
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
            aria-label="Filter by type"
          >
            <option value="">All types</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="input w-auto"
            value={gender}
            onChange={reset(setGender)}
            aria-label="Filter by gender"
          >
            <option value="">Everyone</option>
            <option value="MALE">Men</option>
            <option value="FEMALE">Women</option>
            <option value="UNISEX">Unisex</option>
          </select>

          <select
            className="input w-auto"
            value={sortIdx}
            onChange={(e) => setSortIdx(Number(e.target.value))}
            aria-label="Sort products"
          >
            {SORTS.map((s, i) => (
              <option key={s.label} value={i}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="h-64 w-full animate-pulse bg-cream-deep" />
              <div className="space-y-3 p-5">
                <div className="h-3 w-1/3 animate-pulse rounded bg-cream-deep" />
                <div className="h-5 w-2/3 animate-pulse rounded bg-cream-deep" />
                <div className="h-8 w-full animate-pulse rounded bg-cream-deep" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-20 text-center">
          <p className="font-serif text-2xl">No fragrances found</p>
          <p className="text-sm text-ink-muted">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((p, i) => (
            <article
              key={p.id}
              className="card group overflow-hidden transition-all duration-300 ease-luxe hover:-translate-y-1 hover:shadow-lift animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <Link to={`/products/${p.id}`} className="block overflow-hidden">
                <div className="relative h-64 overflow-hidden bg-cream-deep">
                  <img
                    src={p.imageUrl}
                    alt={`${p.name} by ${p.brand.name}`}
                    className="h-full w-full object-cover transition-transform duration-700 ease-luxe group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-paper/85 px-2.5 py-1 text-[10px] uppercase tracking-luxe text-ink-soft backdrop-blur-sm">
                    {p.gender === "MALE"
                      ? "Him"
                      : p.gender === "FEMALE"
                      ? "Her"
                      : "Unisex"}
                  </span>
                </div>
              </Link>
              <div className="flex flex-col p-5">
                <p className="eyebrow">{p.brand.name}</p>
                <Link to={`/products/${p.id}`}>
                  <h3 className="mt-1 text-2xl leading-tight transition-colors group-hover:text-gold-deep">
                    {p.name}
                  </h3>
                </Link>
                <p className="mt-1 text-sm text-ink-muted">
                  {p.volumeMl} ml · {p.category.name}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="tnum text-lg font-medium">
                    {money(p.price)}
                  </span>
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
            </article>
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
