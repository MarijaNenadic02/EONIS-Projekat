import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { api, apiError } from "../api/client.js";
import { money } from "../lib/format.js";

export default function CartPage() {
  const { items, total, update, remove } = useCart();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const changeQty = async (id, quantity) => {
    setError("");
    try {
      await update(id, quantity);
    } catch (err) {
      setError(apiError(err));
    }
  };

  const checkout = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/checkout/create-session");
      window.location.href = res.data.url; // redirect to Stripe Checkout
    } catch (err) {
      setError(apiError(err));
      setLoading(false);
    }
  };

  if (items.length === 0)
    return (
      <div className="py-20 text-center">
        <h1 className="text-3xl">Your cart is empty</h1>
        <Link to="/" className="btn-primary mt-6">
          Browse perfumes
        </Link>
      </div>
    );

  return (
    <div>
      <h1 className="mb-6 text-3xl">Your cart</h1>
      {error && (
        <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>
      )}

      <div className="space-y-4">
        {items.map((i) => (
          <div key={i.id} className="card flex items-center gap-4 p-4">
            <img
              src={i.product.imageUrl}
              alt={i.product.name}
              className="h-20 w-20 rounded object-cover"
            />
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-gold">
                {i.product.brand.name}
              </p>
              <h3 className="text-lg">{i.product.name}</h3>
              <p className="text-sm text-ink/50">{money(i.product.price)} each</p>
            </div>
            <input
              type="number"
              min={1}
              max={i.product.stock}
              value={i.quantity}
              onChange={(e) => changeQty(i.id, Math.max(1, Number(e.target.value)))}
              className="input w-20"
            />
            <span className="w-24 text-right font-semibold">
              {money(i.quantity * i.product.price)}
            </span>
            <button
              className="text-sm text-red-600 hover:underline"
              onClick={() => remove(i.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-end gap-6">
        <span className="text-xl">
          Total: <span className="font-semibold">{money(total)}</span>
        </span>
        <button className="btn-gold" onClick={checkout} disabled={loading}>
          {loading ? "Redirecting…" : "Checkout with Stripe"}
        </button>
      </div>
    </div>
  );
}
