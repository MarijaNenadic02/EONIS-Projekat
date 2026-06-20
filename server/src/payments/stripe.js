import Stripe from "stripe";

let client = null;

// Lazily create the Stripe client so the app still boots without keys
// (only the checkout/webhook endpoints require them).
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.startsWith("sk_test_xxx")) return null;
  if (!client) client = new Stripe(key);
  return client;
}
