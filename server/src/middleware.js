import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { ApiError, unauthorized, forbidden } from "./errors.js";

// Wraps an async route handler so thrown errors reach the error middleware.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Verifies the JWT from the Authorization header and attaches req.user.
export function authenticate(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(unauthorized("Missing authentication token"));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch {
    next(unauthorized("Invalid or expired token"));
  }
}

// Restricts a route to one or more roles. Use after authenticate.
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };

// Validates a request part (body/query/params) against a Zod schema,
// replacing it with the parsed/coerced result.
export const validate =
  (schema, where = "body") =>
  (req, _res, next) => {
    const result = schema.safeParse(req[where]);
    if (!result.success) {
      return next(
        new ApiError(400, "Validation failed", result.error.flatten())
      );
    }
    req[where] = result.data;
    next();
  };

// Central error handler — last middleware in the chain.
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }
  if (err instanceof ZodError) {
    return res
      .status(400)
      .json({ error: "Validation failed", details: err.flatten() });
  }
  // Prisma unique constraint violation
  if (err.code === "P2002") {
    return res
      .status(409)
      .json({ error: `A record with this ${err.meta?.target} already exists` });
  }
  // Prisma record not found
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found" });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
