import { z } from "zod";

// Reusable query schema for list endpoints (pagination + sorting + search).
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("asc"),
  q: z.string().optional(),
});

// Builds Prisma skip/take from page & pageSize.
export function paginate({ page, pageSize }) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

// Builds a standard paginated response envelope.
export function buildList(items, total, { page, pageSize }) {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// Returns a safe Prisma orderBy, falling back to a default field.
export function orderBy(sort, order, allowed, fallback) {
  const field = allowed.includes(sort) ? sort : fallback;
  return { [field]: order };
}
