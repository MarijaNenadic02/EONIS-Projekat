import "dotenv/config";
import express from "express";
import cors from "cors";

import { errorHandler } from "./middleware.js";
import { handleWebhook } from "./payments/webhook.js";
import uploadRoutes, { UPLOAD_DIR } from "./uploads/uploads.routes.js";

import authRoutes from "./auth/auth.routes.js";
import productRoutes from "./products/products.routes.js";
import brandRoutes from "./catalog/brands.routes.js";
import categoryRoutes from "./catalog/categories.routes.js";
import cartRoutes from "./cart/cart.routes.js";
import orderRoutes from "./orders/orders.routes.js";
import userRoutes from "./users/users.routes.js";
import checkoutRoutes from "./payments/checkout.routes.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));

// The Stripe webhook must receive the raw body for signature verification,
// so it is registered BEFORE the JSON body parser.
app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

app.use(express.json());

// Serve uploaded product images statically
app.use("/uploads", express.static(UPLOAD_DIR));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/uploads", uploadRoutes);

// Unknown route → 404 JSON
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Essence API running on http://localhost:${PORT}`);
});
