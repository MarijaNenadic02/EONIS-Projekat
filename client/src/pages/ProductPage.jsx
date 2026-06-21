import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, apiError } from "../api/client.js";
import { money } from "../lib/format.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function ProductPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");

  const { data: p, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => (await api.get(`/products/${id}`)).data,
  });

  if (isLoading)
    return <p className="py-24 text-center text-ink-muted">Loading…</p>;
  if (!p) return <p className="py-24 text-center">Product not found.</p>;

  const addToCart = async () => {
    setMsg("");
    try {
      await cart.add(p.id, qty);
      setMsg("Added to your cart.");
    } catch (err) {
      setMsg(apiError(err));
    }
  };

  return (
    <div className="animate-fade-in">
      <Link
        to="/"
        className="text-sm text-ink-muted transition-colors hover:text-ink"
      >
        ← Back to the collection
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl bg-cream-deep shadow-soft">
          <img
            src={p.imageUrl}
            alt={`${p.name} by ${p.brand.name}`}
            className="aspect-square w-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-center">
          <p className="eyebrow">{p.brand.name}</p>
          <h1 className="mt-1 text-5xl leading-[1.05]">{p.name}</h1>
          <p className="mt-3 text-sm uppercase tracking-wide text-ink-muted">
            {p.volumeMl} ml · {p.category.name} ·{" "}
            {p.gender === "MALE" ? "For him" : p.gender === "FEMALE" ? "For her" : "Unisex"}
          </p>

          <p className="tnum mt-6 text-3xl font-medium text-gold-deep">
            {money(p.price)}
          </p>

          <p className="mt-6 max-w-prose leading-relaxed text-ink-soft">
            {p.description}
          </p>

          <p className="mt-5 text-sm">
            {p.stock > 0 ? (
              <span className="inline-flex items-center gap-2 text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                In stock, {p.stock} available
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                Currently out of stock
              </span>
            )}
          </p>

          {user ? (
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <input
                type="number"
                min={1}
                max={p.stock}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                className="input w-20"
                disabled={p.stock === 0}
                aria-label="Quantity"
              />
              <button
                className="btn-gold"
                onClick={addToCart}
                disabled={p.stock === 0}
              >
                Add to cart
              </button>
              <button className="btn-outline" onClick={() => navigate("/cart")}>
                Go to cart
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary mt-7 w-fit">
              Login to purchase
            </Link>
          )}
          {msg && <p className="mt-4 text-sm text-ink-muted">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
