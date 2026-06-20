import { prisma } from "../prisma.js";
import { getStripe } from "./stripe.js";

// Stripe webhook handler. Mounted with express.raw() so the signature can be
// verified against the raw request body.
export async function handleWebhook(req, res) {
  const stripe = getStripe();
  if (!stripe) return res.status(503).send("Stripe not configured");

  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = Number(session.metadata?.orderId);
    if (orderId) await fulfillOrder(event.id, session, orderId);
  }

  res.json({ received: true });
}

// Idempotent fulfillment: mark order PAID, decrement stock, record payment,
// and clear the buyer's cart — all in one transaction.
async function fulfillOrder(eventId, session, orderId) {
  // Skip if this event was already processed.
  const already = await prisma.payment.findUnique({
    where: { stripeEventId: eventId },
  });
  if (already) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.status === "PAID") return;

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID" },
    }),
    ...order.items.map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    ),
    prisma.payment.create({
      data: {
        stripeEventId: eventId,
        stripePaymentIntent: String(session.payment_intent ?? ""),
        amount: (session.amount_total ?? 0) / 100,
        currency: session.currency ?? "usd",
        status: session.payment_status ?? "paid",
        orderId,
      },
    }),
    prisma.cartItem.deleteMany({ where: { userId: order.userId } }),
  ]);
}
