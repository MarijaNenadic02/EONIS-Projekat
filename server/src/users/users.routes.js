import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma.js";
import {
  asyncHandler,
  authenticate,
  authorize,
  validate,
} from "../middleware.js";
import {
  listQuerySchema,
  paginate,
  buildList,
  orderBy,
} from "../utils/pagination.js";

// Admin-only user management.
const router = Router();
router.use(authenticate, authorize("ADMIN"));

const PUBLIC_USER = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  createdAt: true,
};

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["ADMIN", "CUSTOMER"]).default("CUSTOMER"),
});

const updateSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["ADMIN", "CUSTOMER"]),
  password: z.string().min(6).optional(),
});

const SORTABLE = ["email", "firstName", "lastName", "createdAt", "role"];

// GET /api/users: pagination + search
router.get(
  "/",
  validate(listQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const { page, pageSize, sort, order, q } = req.query;
    const where = q
      ? {
          OR: [
            { email: { contains: q } },
            { firstName: { contains: q } },
            { lastName: { contains: q } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: PUBLIC_USER,
        orderBy: orderBy(sort, order, SORTABLE, "createdAt"),
        ...paginate({ page, pageSize }),
      }),
      prisma.user.count({ where }),
    ]);
    res.json(buildList(items, total, { page, pageSize }));
  })
);

router.post(
  "/",
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { password, ...rest } = req.body;
    const user = await prisma.user.create({
      data: { ...rest, passwordHash: await bcrypt.hash(password, 10) },
      select: PUBLIC_USER,
    });
    res.status(201).json(user);
  })
);

router.put(
  "/:id",
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const { password, ...rest } = req.body;
    const data = { ...rest };
    if (password) data.passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data,
      select: PUBLIC_USER,
    });
    res.json(user);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.user.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  })
);

export default router;
