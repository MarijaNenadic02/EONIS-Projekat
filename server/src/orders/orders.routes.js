import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import {
  asyncHandler,
  authenticate,
  authorize,
  validate,
} from "../middleware.js";
import { forbidden, notFound } from "../errors.js";
import { listQuerySchema, paginate, buildList } from "../utils/pagination.js";

const router = Router();
router.use(authenticate);

const orderInclude = {
  items: { include: { product: true } },
  user: { select: { id: true, email: true, firstName: true, lastName: true } },
  payment: true,
};

// Extend the shared list schema so the `all` flag survives validation
// (Zod strips unknown keys, which previously dropped ?all=true).
const orderListQuerySchema = listQuerySchema.extend({
  all: z.enum(["true", "false"]).optional(),
});

// GET /api/orders: own orders; admins can pass ?all=true for every order
router.get(
  "/",
  validate(orderListQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const { page, pageSize } = req.query;
    const isAdmin = req.user.role === "ADMIN";
    const all = req.query.all === "true" && isAdmin;
    const where = all ? {} : { userId: req.user.id };

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: "desc" },
        ...paginate({ page, pageSize }),
      }),
      prisma.order.count({ where }),
    ]);
    res.json(buildList(items, total, { page, pageSize }));
  })
);

// GET /api/orders/:id: owner or admin
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: orderInclude,
    });
    if (!order) throw notFound("Order not found");
    if (req.user.role !== "ADMIN" && order.userId !== req.user.id)
      throw forbidden();
    res.json(order);
  })
);

// PUT /api/orders/:id/status (admin)
const statusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "CANCELLED"]),
});
router.put(
  "/:id/status",
  authorize("ADMIN"),
  validate(statusSchema),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { status: req.body.status },
      include: orderInclude,
    });
    res.json(order);
  })
);

export default router;
