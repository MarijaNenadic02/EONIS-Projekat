import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

export default function CheckoutSuccessPage() {
  const [params] = useSearchParams();
  const orderId = params.get("order");
  const { refresh } = useCart();

  // The webhook clears the server cart; refresh local state to match.
  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="py-20 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gold text-3xl text-white">
        ✓
      </div>
      <h1 className="text-3xl">Thank you for your purchase!</h1>
      <p className="mt-2 text-ink/60">
        {orderId ? `Order #${orderId} has been placed.` : "Your order has been placed."}{" "}
        Payment is confirmed via Stripe.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/orders" className="btn-primary">
          View my orders
        </Link>
        <Link to="/" className="btn-outline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
