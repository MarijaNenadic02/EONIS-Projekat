import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncHandler, authenticate, authorize } from "../middleware.js";
import { badRequest } from "../errors.js";
import { getStripe } from "./stripe.js";
import { listQuerySchema, paginate, buildList } from "../utils/pagination.js";
import { validate } from "../middleware.js";

const router = Router();

// POST /api/checkout/create-session — turn the cart into a PENDING order and
// return a Stripe Checkout URL. Business rule: validate stock before paying.
router.post(
  "/create-session",
  authenticate,
  asyncHandler(async (req, res) => {
    const stripe = getStripe();
    if (!stripe)
      throw badRequest(
        "Stripe is not configured. Add STRIPE_SECRET_KEY to the server .env."
      );

    const cart = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true },
    });
    if (cart.length === 0) throw badRequest("Your cart is empty");

    for (const item of cart) {
      if (item.quantity > item.product.stock) {
        throw badRequest(
          `Only ${item.product.stock} item(s) of "${item.product.name}" available`
        );
      }
    }

    const total = cart.reduce(
      (sum, i) => sum + i.quantity * i.product.price,
      0
    );

    // Create the order up-front in PENDING state.
    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        total,
        status: "PENDING",
        items: {
          create: cart.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.product.price,
          })),
        },
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: cart.map((i) => ({
        quantity: i.quantity,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(i.product.price * 100),
          product_data: { name: i.product.name },
        },
      })),
      success_url: `${process.env.CLIENT_URL}/checkout/success?order=${order.id}`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      client_reference_id: String(order.id),
      metadata: { orderId: String(order.id), userId: String(req.user.id) },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    res.json({ url: session.url, orderId: order.id });
  })
);

// GET /api/checkout/payments (admin) — transaction list for the admin panel
router.get(
  "/payments",
  authenticate,
  authorize("ADMIN"),
  validate(listQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const { page, pageSize } = req.query;
    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        include: {
          order: {
            include: {
              user: {
                select: { id: true, email: true, firstName: true, lastName: true },
              },
              items: { include: { product: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        ...paginate({ page, pageSize }),
      }),
      prisma.payment.count(),
    ]);
    res.json(buildList(items, total, { page, pageSize }));
  })
);

export default router;
