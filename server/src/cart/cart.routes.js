import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { asyncHandler, authenticate, validate } from "../middleware.js";
import { badRequest, notFound } from "../errors.js";

const router = Router();
router.use(authenticate);

const addSchema = z.object({
  productId: z.number().int(),
  quantity: z.number().int().min(1).default(1),
});
const updateSchema = z.object({ quantity: z.number().int().min(1) });

// Loads the current user's cart with product details and a computed total.
async function loadCart(userId) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: { include: { brand: true } } },
    orderBy: { id: "asc" },
  });
  const total = items.reduce(
    (sum, i) => sum + i.quantity * i.product.price,
    0
  );
  return { items, total };
}

// GET /api/cart
router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await loadCart(req.user.id));
  })
);

// POST /api/cart — add to cart (business rule: cannot exceed stock)
router.post(
  "/",
  validate(addSchema),
  asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw notFound("Product not found");

    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId: req.user.id, productId } },
    });
    const desired = (existing?.quantity ?? 0) + quantity;
    if (desired > product.stock) {
      throw badRequest(
        `Only ${product.stock} item(s) of "${product.name}" available in stock`
      );
    }

    await prisma.cartItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      create: { userId: req.user.id, productId, quantity },
      update: { quantity: desired },
    });

    res.status(201).json(await loadCart(req.user.id));
  })
);

// PUT /api/cart/:id — set quantity (business rule: cannot exceed stock)
router.put(
  "/:id",
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const item = await prisma.cartItem.findUnique({
      where: { id: Number(req.params.id) },
      include: { product: true },
    });
    if (!item || item.userId !== req.user.id)
      throw notFound("Cart item not found");
    if (req.body.quantity > item.product.stock) {
      throw badRequest(
        `Only ${item.product.stock} item(s) available in stock`
      );
    }
    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: req.body.quantity },
    });
    res.json(await loadCart(req.user.id));
  })
);

// DELETE /api/cart/:id
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const item = await prisma.cartItem.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!item || item.userId !== req.user.id)
      throw notFound("Cart item not found");
    await prisma.cartItem.delete({ where: { id: item.id } });
    res.json(await loadCart(req.user.id));
  })
);

export default router;
