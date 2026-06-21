import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import {
  asyncHandler,
  authenticate,
  authorize,
  validate,
} from "../middleware.js";

const router = Router();
const bodySchema = z.object({ name: z.string().min(1) });

// GET /api/categories: public
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    res.json(categories);
  })
);

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(bodySchema),
  asyncHandler(async (req, res) => {
    const category = await prisma.category.create({ data: req.body });
    res.status(201).json(category);
  })
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(bodySchema),
  asyncHandler(async (req, res) => {
    const category = await prisma.category.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(category);
  })
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req, res) => {
    await prisma.category.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  })
);

export default router;
