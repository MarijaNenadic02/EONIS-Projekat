import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { authenticate, authorize, asyncHandler } from "../middleware.js";
import { badRequest } from "../errors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.join(__dirname, "../../uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const safe = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype))
      return cb(new Error("Only image files (jpg, png, webp, gif) are allowed"));
    cb(null, true);
  },
});

const router = Router();

// POST /api/uploads — admin uploads a product image, returns its public URL
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  (req, res, next) =>
    upload.single("image")(req, res, (err) =>
      err ? next(badRequest(err.message)) : next()
    ),
  asyncHandler(async (req, res) => {
    if (!req.file) throw badRequest("No image file provided");
    const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.status(201).json({ url });
  })
);

export default router;
