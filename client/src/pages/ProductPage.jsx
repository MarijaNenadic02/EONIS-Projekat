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

  if (isLoading) return <p className="py-20 text-center text-ink/50">Loading…</p>;
  if (!p) return <p className="py-20 text-center">Product not found.</p>;

  const addToCart = async () => {
    setMsg("");
    try {
      await cart.add(p.id, qty);
      setMsg("Added to cart ✓");
    } catch (err) {
      setMsg(apiError(err));
    }
  };

  return (
    <div>
      <Link to="/" className="text-sm text-ink/50 hover:text-gold">
        ← Back to shop
      </Link>
      <div className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-2">
        <img
          src={p.imageUrl}
          alt={p.name}
          className="aspect-square w-full rounded-lg object-cover"
        />
        <div>
          <p className="text-sm uppercase tracking-wide text-gold">{p.brand.name}</p>
          <h1 className="text-4xl">{p.name}</h1>
          <p className="mt-1 text-ink/50">
            {p.volumeMl} ml · {p.category.name} · {p.gender}
          </p>
          <p className="mt-4 text-3xl font-semibold">{money(p.price)}</p>
          <p className="mt-4 leading-relaxed text-ink/70">{p.description}</p>

          <p className="mt-4 text-sm">
            {p.stock > 0 ? (
              <span className="text-green-700">In stock: {p.stock}</span>
            ) : (
              <span className="text-red-600">Out of stock</span>
            )}
          </p>

          {user ? (
            <div className="mt-6 flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={p.stock}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                className="input w-20"
                disabled={p.stock === 0}
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
            <Link to="/login" className="btn-primary mt-6">
              Login to purchase
            </Link>
          )}
          {msg && <p className="mt-3 text-sm text-ink/70">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
