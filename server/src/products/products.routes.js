import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import {
  asyncHandler,
  authenticate,
  authorize,
  validate,
} from "../middleware.js";
import { notFound } from "../errors.js";
import {
  listQuerySchema,
  paginate,
  buildList,
  orderBy,
} from "../utils/pagination.js";

const router = Router();

const productQuerySchema = listQuerySchema.extend({
  brandId: z.coerce.number().int().optional(),
  categoryId: z.coerce.number().int().optional(),
  gender: z.enum(["MALE", "FEMALE", "UNISEX"]).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
});

const productBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  volumeMl: z.number().int().positive(),
  gender: z.enum(["MALE", "FEMALE", "UNISEX"]),
  imageUrl: z.string().url(),
  brandId: z.number().int(),
  categoryId: z.number().int(),
});

const SORTABLE = ["name", "price", "createdAt", "stock"];

// GET /api/products: public list with pagination, sorting, search, filters
router.get(
  "/",
  validate(productQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const { page, pageSize, sort, order, q, brandId, categoryId, gender, minPrice, maxPrice } =
      req.query;

    const where = {
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { description: { contains: q } },
              { brand: { name: { contains: q } } },
            ],
          }
        : {}),
      ...(brandId ? { brandId } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(gender ? { gender } : {}),
      ...(minPrice != null || maxPrice != null
        ? {
            price: {
              ...(minPrice != null ? { gte: minPrice } : {}),
              ...(maxPrice != null ? { lte: maxPrice } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { brand: true, category: true },
        orderBy: orderBy(sort, order, SORTABLE, "createdAt"),
        ...paginate({ page, pageSize }),
      }),
      prisma.product.count({ where }),
    ]);

    res.json(buildList(items, total, { page, pageSize }));
  })
);

// GET /api/products/:id
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: { brand: true, category: true },
    });
    if (!product) throw notFound("Product not found");
    res.json(product);
  })
);

// POST /api/products (admin)
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(productBodySchema),
  asyncHandler(async (req, res) => {
    const product = await prisma.product.create({
      data: req.body,
      include: { brand: true, category: true },
    });
    res.status(201).json(product);
  })
);

// PUT /api/products/:id (admin)
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(productBodySchema),
  asyncHandler(async (req, res) => {
    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: req.body,
      include: { brand: true, category: true },
    });
    res.json(product);
  })
);

// DELETE /api/products/:id (admin)
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req, res) => {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  })
);

export default router;
