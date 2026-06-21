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

// GET /api/brands: public
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
    res.json(brands);
  })
);

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(bodySchema),
  asyncHandler(async (req, res) => {
    const brand = await prisma.brand.create({ data: req.body });
    res.status(201).json(brand);
  })
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(bodySchema),
  asyncHandler(async (req, res) => {
    const brand = await prisma.brand.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(brand);
  })
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req, res) => {
    await prisma.brand.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  })
);

export default router;
