# SCENTIQ: Web Parfumerija

A full-stack web shop for selling luxury perfumes, built for the **EONIS 2026**
project assignment (Eksploatacija, održavanje i nadogradnja informacionih
sistema). It implements a complete online store: product catalog, shopping
cart, authentication with roles, an administration panel, and card payments
through Stripe.

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Demo accounts](#demo-accounts)
- [Stripe payments](#stripe-payments-test-mode)
- [API overview](#api-overview)
- [How the assignment is covered](#how-the-assignment-is-covered)

## Features

**Storefront (customer)**
- Browse a catalog of perfumes with **search, filtering** (brand, type,
  gender, price) and **sorting** (price, name, newest)
- **Pagination** across the catalog
- Product detail pages with stock availability
- **Shopping cart** with quantity controls and live totals
- Stock-aware rules, so you can never add more than is in stock
- **Stripe checkout** and an order history view
- Registration and login with form validation

**Administration**
- Secure admin panel (role-protected)
- Full **CRUD** for products, brands, categories, users and orders
- **Image upload** for products, with live preview
- Update order status and review every customer order
- **Transactions** view populated automatically from Stripe webhooks
- Dashboard with key store statistics

**Engineering**
- JWT authentication and role-based authorization (ADMIN / CUSTOMER)
- Centralized error handling with meaningful HTTP status codes
- Input validation on both the client and the server (Zod)
- Server-side business logic (code-first approach)

## Tech stack

| Layer       | Technology |
|-------------|------------|
| Frontend    | React, Vite, React Router, TanStack Query |
| Styling     | Tailwind CSS |
| Forms       | React Hook Form + Zod |
| Backend     | Node.js, Express |
| Database    | SQLite via Prisma ORM (code-first) |
| Auth        | JSON Web Tokens, bcrypt |
| Payments    | Stripe (test mode) with webhooks |
| Uploads     | Multer (local file storage) |

## Project structure

```
.
├── server/                 Express REST API
│   ├── prisma/
│   │   ├── schema.prisma    Data model (code-first)
│   │   └── seed.js          Demo data + default accounts
│   ├── uploads/             Uploaded product images
│   └── src/
│       ├── auth/            Register / login / current user
│       ├── products/        Product CRUD + search/sort/pagination
│       ├── catalog/         Brands & categories CRUD
│       ├── cart/            Cart with stock rules
│       ├── orders/          Orders + status management
│       ├── users/           User management (admin)
│       ├── payments/        Stripe checkout, webhook, transactions
│       ├── uploads/         Image upload endpoint
│       └── middleware.js    Auth, validation, error handling
└── client/                 React single-page application
    └── src/
        ├── pages/           Catalog, product, cart, orders, auth
        │   └── admin/       Admin panel pages
        ├── components/      Navbar, layout, modal, pagination
        ├── context/         Auth & cart state
        └── api/             Axios client + helpers
```

## Getting started

### Prerequisites

- Node.js 18 or newer (developed on Node 24)
- npm

### 1. Backend

```bash
cd server
npm install
cp .env.example .env            # then edit the values
npx prisma migrate dev --name init
npm run seed                    # demo data + accounts
npm run dev                     # API at http://localhost:4000
```

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env            # then edit the values
npm run dev                     # app at http://localhost:5173
```

Open **http://localhost:5173** in your browser.

## Demo accounts

After seeding, you can sign in with:

| Role     | Email                   | Password    |
|----------|-------------------------|-------------|
| Admin    | admin@scentiq.test      | admin123    |
| Customer | customer@scentiq.test   | customer123 |

## Stripe payments (test mode)

The shop uses Stripe Checkout for card payments. The rest of the app works
without Stripe; only the checkout step requires keys.

1. From the Stripe Dashboard (Developers → API keys) copy your **test** keys.
2. In `server/.env` set `STRIPE_SECRET_KEY`, and in `client/.env` set
   `VITE_STRIPE_PUBLISHABLE_KEY`.
3. Forward webhooks locally with the Stripe CLI and copy the printed signing
   secret into `STRIPE_WEBHOOK_SECRET`:

   ```bash
   stripe listen --forward-to localhost:4000/api/webhook
   ```

4. Pay with the test card `4242 4242 4242 4242`, any future expiry and any CVC.

On a successful payment the webhook marks the order as paid, decrements stock,
and records the transaction in the admin panel.

## API overview

| Method | Endpoint                       | Access    | Description |
|--------|--------------------------------|-----------|-------------|
| POST   | `/api/auth/register`           | public    | Create a customer account |
| POST   | `/api/auth/login`              | public    | Log in, returns a JWT |
| GET    | `/api/products`                | public    | List with search/sort/filter/pagination |
| GET    | `/api/products/:id`            | public    | Product details |
| POST/PUT/DELETE | `/api/products[/:id]` | admin     | Manage products |
| GET    | `/api/brands`, `/api/categories` | public  | Catalog metadata |
| GET/POST/PUT/DELETE | `/api/cart[/:id]` | customer  | Shopping cart |
| GET    | `/api/orders`                  | auth      | Own orders (admin: `?all=true`) |
| PUT    | `/api/orders/:id/status`       | admin     | Change order status |
| GET/POST/PUT/DELETE | `/api/users[/:id]` | admin   | Manage users |
| POST   | `/api/uploads`                 | admin     | Upload a product image |
| POST   | `/api/checkout/create-session` | customer  | Start a Stripe checkout |
| POST   | `/api/webhook`                 | Stripe    | Payment confirmation webhook |
| GET    | `/api/checkout/payments`       | admin     | Transaction list |

## How the assignment is covered

- **Zadatak II: Database & business logic.** Code-first data model in
  `server/prisma/schema.prisma`: core tables (product, user, admin as a role,
  order) plus associative classes (cart item, order item) and a payment table.
  Business rules (stock limits, stock reduction on payment) are implemented in
  the application code.
- **Zadatak III: Backend.** Full CRUD per table, exception handling, search,
  and two roles (ADMIN / CUSTOMER) with authentication and authorization.
- **Zadatak IV: Frontend.** React application with validation, login,
  pagination, sorting and search, plus Stripe payments whose webhook records
  transactions shown to the administrator.
