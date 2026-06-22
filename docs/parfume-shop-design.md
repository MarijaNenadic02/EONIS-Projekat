# Parfume Shop ("SCENTIQ") — Design Specification

**Course:** Eksploatacija, održavanje i nadogradnja informacionih sistema 2025/26 (EONIS 2026)
**Project:** Web prodavnica — Parfumerija
**Date:** 2026-06-20

## 1. Goal & Scope

A full-stack web shop for selling perfumes, fulfilling the EONIS 2026 project
specification (Zadatak II–IV). It includes:

- A relational data model (code-first) with core tables and associative classes.
- A backend REST API with full CRUD per table, authentication/authorization,
  exception handling, and search/pagination/sorting.
- A React frontend with validation, login/auth, catalog browsing, cart,
  Stripe test checkout, customer order history, and an admin panel.
- Stripe test payment processor with a webhook that records transactions for
  the admin panel.

UML diagrams (Zadatak I) and written documentation (Zadatak V) are out of scope
for this build but the model below is documentation-ready.

## 2. Technology Stack

| Layer    | Choice |
|----------|--------|
| Backend  | Node.js + Express |
| ORM / DB | Prisma + SQLite, **code-first** (business logic in code) |
| Auth     | JWT (jsonwebtoken) + bcrypt password hashing |
| Validation | Zod (backend) / react-hook-form + Zod (frontend) |
| Payments | Stripe SDK (test mode) + webhook |
| Frontend | React + Vite, React Router, TanStack Query, axios |
| Styling  | Tailwind CSS |

Monorepo layout: `/server` and `/client`.

**Why code-first:** Satisfies Zadatak II by realizing business logic in code
rather than DB triggers (the spec explicitly allows this). SQLite needs zero
installation, ideal for a laptop demo at the defense.

## 3. Data Model

Core tables required by the spec: product, user, employee/admin, order.
Admin is modeled as a `User` with `role = ADMIN` (satisfies the "minimum two
roles: ADMIN + CUSTOMER" requirement).

### Entities

- **User** — `id, email (unique), passwordHash, firstName, lastName,
  role (ADMIN | CUSTOMER), createdAt`
- **Brand** — `id, name (unique), createdAt`
- **Category** — `id, name (unique), createdAt`
- **Product** (perfume) — `id, name, description, price, stock, volumeMl,
  gender (MALE | FEMALE | UNISEX), imageUrl, brandId, categoryId, createdAt`
- **CartItem** *(associative User↔Product)* — `id, userId, productId, quantity`
  (unique on userId+productId)
- **Order** — `id, userId, status (PENDING | PAID | SHIPPED | CANCELLED),
  total, stripeSessionId, createdAt`
- **OrderItem** *(associative Order↔Product)* — `id, orderId, productId,
  quantity, unitPrice`
- **Payment** *(populated by Stripe webhook)* — `id, orderId, stripeEventId
  (unique), stripePaymentIntent, amount, currency, status, createdAt`

### Relationships

- User 1—* Order, User 1—* CartItem
- Brand 1—* Product, Category 1—* Product
- Order 1—* OrderItem *—1 Product
- CartItem *—1 Product
- Order 1—1 Payment

### Business logic (in code)

- Adding to cart cannot exceed available `stock`.
- At checkout, validate stock for every cart item.
- On Stripe `checkout.session.completed` webhook: mark Order `PAID`,
  decrement `stock` for each OrderItem, create a `Payment` record (idempotent
  via unique `stripeEventId`), and clear the user's cart.

## 4. Backend API (Zadatak III)

All responses use proper HTTP status codes; a central error-handling middleware
converts thrown errors (validation, not-found, auth, business-rule) to JSON.

### Auth
- `POST /api/auth/register` — create CUSTOMER account
- `POST /api/auth/login` — returns JWT + user
- `GET  /api/auth/me` — current user (auth required)

### Products (search/pagination/sorting; mutations admin-only)
- `GET    /api/products` — query params: `page, pageSize, sort, order, q,
  brandId, categoryId, gender, minPrice, maxPrice`
- `GET    /api/products/:id`
- `POST   /api/products` *(admin)*
- `PUT    /api/products/:id` *(admin)*
- `DELETE /api/products/:id` *(admin)*

### Brands & Categories
- Full CRUD; `GET` public, mutations admin-only.

### Cart (customer)
- `GET /api/cart`, `POST /api/cart` (add), `PUT /api/cart/:id` (qty),
  `DELETE /api/cart/:id`

### Orders
- `GET  /api/orders` — current user's orders (admin sees all via `?all=true`)
- `GET  /api/orders/:id`
- `PUT  /api/orders/:id/status` *(admin)*

### Users (admin)
- Full CRUD with pagination/search.

### Checkout & Payments
- `POST /api/checkout/create-session` — builds Stripe Checkout Session from cart,
  creates a PENDING order
- `POST /api/webhook` — Stripe webhook (raw body), handles
  `checkout.session.completed`
- `GET  /api/payments` *(admin)* — transaction list for the admin panel

## 5. Frontend (Zadatak IV)

### Public
- **Catalog** — product grid with pagination, sort (price/name), search box,
  filters (brand, category, gender, price range).
- **Product detail** — full info + add to cart.

### Auth
- Login / Register with form validation (react-hook-form + Zod).

### Customer
- **Cart** — update quantities, remove, see total.
- **Checkout** — redirect to Stripe Checkout (test mode); success/cancel pages.
- **Order history** — list of own orders + statuses.

### Admin panel
- Dashboard with key stats.
- Manage products, brands, categories, users, orders (CRUD with tables,
  pagination, search).
- **Transactions view** — payments recorded by the webhook (which product,
  price, quantity, buyer).

### State & data
- Auth state in React Context (JWT in localStorage; axios interceptor attaches
  token).
- Server data via TanStack Query (handles pagination/caching).
- Role-gated routes (admin routes require role=ADMIN).

## 6. Tooling & DX

- `prisma/schema.prisma` + migrations; `prisma/seed.ts` seeds admin + customer
  accounts, brands, categories, and ~12 perfumes with images.
- `.env.example` documenting `DATABASE_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `CLIENT_URL`; frontend `VITE_API_URL`,
  `VITE_STRIPE_PUBLISHABLE_KEY`.
- Root `README.md` with setup/run/seed/Stripe instructions.

## 7. Default Accounts (seed)

- Admin: `admin@scentiq.test` / `admin123`
- Customer: `customer@scentiq.test` / `customer123`

## 8. Out of Scope (this build)

- UML diagrams (Zadatak I) and written documentation (Zadatak V).
- Real Stripe keys (placeholders provided; user adds test keys).
- Product reviews/ratings (YAGNI).
