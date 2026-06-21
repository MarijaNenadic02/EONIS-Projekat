# Essence: Parfumerija (Web prodavnica)

Full-stack web shop for selling perfumes, built for the **EONIS 2026** project
specification. Node.js + Express + Prisma (SQLite, code-first) backend and a
React + Vite frontend, with Stripe test payments and an admin panel.

## Features

- JWT authentication & authorization with two roles: **ADMIN** and **CUSTOMER**
- Full CRUD for products, brands, categories, users, orders
- Catalog with **pagination, sorting, search and filters**
- Shopping cart with stock-aware business rules (can't add more than in stock)
- **Stripe** test checkout + webhook → stock decremented and transaction
  recorded on payment
- Admin panel: manage entities + view transactions
- Form validation on both backend (Zod) and frontend (react-hook-form + Zod)
- Central exception handling

## Project structure

```
.
├── server/        Express + Prisma backend (REST API)
├── client/        React + Vite frontend
└── docs/          Design specification
```

## Prerequisites

- Node.js 18+ (tested on Node 24)
- npm
- (optional, for real payments) a Stripe account with test keys

## Setup

### 1. Backend

```bash
cd server
npm install
cp .env.example .env          # then edit values
npx prisma migrate dev --name init
npm run seed                  # creates demo data + accounts
npm run dev                   # starts API on http://localhost:4000
```

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env          # then edit values
npm run dev                   # starts app on http://localhost:5173
```

## Demo accounts (after seeding)

| Role     | Email                   | Password    |
|----------|-------------------------|-------------|
| Admin    | admin@essence.test      | admin123    |
| Customer | customer@essence.test   | customer123 |

## Stripe (test mode)

1. Get test keys from the Stripe Dashboard (Developers → API keys).
2. Set `STRIPE_SECRET_KEY` in `server/.env` and
   `VITE_STRIPE_PUBLISHABLE_KEY` in `client/.env`.
3. To receive webhooks locally, run the Stripe CLI:

   ```bash
   stripe listen --forward-to localhost:4000/api/webhook
   ```

   Copy the printed signing secret into `STRIPE_WEBHOOK_SECRET` in
   `server/.env`.
4. Use test card `4242 4242 4242 4242`, any future expiry, any CVC.

Until keys are configured, the rest of the app works; only the checkout step
requires Stripe.

## How the spec is satisfied

- **Zadatak II**: code-first data model (`server/prisma/schema.prisma`) with
  core tables (product, user, admin-as-role, order) plus associative classes
  (CartItem, OrderItem) and Payment. Business logic in code.
- **Zadatak III**: CRUD per table, exception handling, search, auth & two
  roles (`server/src`).
- **Zadatak IV**: React frontend with validation, login, pagination, sorting,
  search, and Stripe payments with webhook → admin transactions (`client/src`).
