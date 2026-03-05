# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Organic Farm Market — a MERN stack app connecting organic farmers with customers, with admin oversight. Three user roles: `admin`, `farmer`, `customer`. Farmers require admin approval before their products are publicly visible.

## Development Commands

### Backend (server/)

```bash
cd server
Copy-Item env.template .env   # then edit .env with MONGO_URI, JWT_SECRET, etc.
npm install
npm run dev        # starts with nodemon (hot reload)
npm start          # production start (node server.js)
npm run seed       # wipes DB and seeds demo users + products
```

Demo seed credentials: `admin@example.com`, `farmer@example.com`, `customer@example.com` — all use password `password123`.

### Frontend (client/)

```bash
cd client
npm install
npm run dev        # Vite dev server at http://localhost:5173
npm run build      # production build to client/dist/
npm run lint       # ESLint (flat config, eslint.config.js)
npm run preview    # preview production build
```

### Environment Variables

Backend (`server/.env`): `PORT`, `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`
Frontend: `VITE_API_URL` (defaults to `http://localhost:5000` if unset)

## Architecture

### Backend — Express 5 + Mongoose (CommonJS)

Entry point: `server/server.js` — sets up CORS (using `FRONTEND_URL`), JSON parsing, MongoDB connection, and mounts all route groups.

**Middleware chain pattern:** Routes requiring auth use `auth` middleware (JWT from `Authorization: Bearer <token>`) which sets `req.user` with `{ id, role, name, email }`. Role restriction uses `allowRoles(...roles)` which reads `req.user.role`. Route files that are entirely role-restricted (admin, farmer, customer) apply both via `router.use(auth, allowRoles(...))` at the top.

**Route mount paths:**
- `/api/auth` — register, login, profile CRUD (routes/auth.js)
- `/api/products` — public product listing + farmer/admin CRUD (routes/products.js)
- `/api/orders` — customer order placement, farmer/admin order management, SSE subscription (routes/orders.js)
- `/api/admin` — user management, approval/blocking, all-orders/products/stats (routes/admin.js)
- `/api/farmer` — farmer's own products and stats (routes/farmer.js)
- `/api/customer` — customer stats (routes/customer.js)
- `/api/reviews` — product reviews, one per customer per product, requires delivered order (routes/reviews.js)
- `/api/order` — alternative order placement with UPI mock payment flow (routes/order_payment.js)

**Models** (server/models/): `User`, `Product`, `Order`, `Review`, `PaymentRequest`. Key relationships:
- Product.farmer → User (ObjectId ref)
- Order.user → User; Order.items[].product → Product
- Review has unique compound index on `(product, user)` to enforce one review per customer per product

**Real-time updates:** `utils/orderEvents.js` exports a Node EventEmitter. The SSE endpoint at `GET /api/orders/subscribe/:orderId` streams order status changes. Accepts auth token via header or `?token=` query param (for browser EventSource).

**Farmer visibility gate:** Public product queries use Mongoose `populate` with `match: { isApproved: true, isBlocked: false }` to filter out unapproved/blocked farmers. Farmer product creation checks `isApproved` and `isBlocked` before allowing.

### Frontend — Vite + React 19 + React Router 7 (ES Modules)

Entry: `client/src/main.jsx` → `BrowserRouter` > `AuthProvider` > `App`.

**Auth state:** `AuthContext` stores `user` and `token` in React state, persisted to `localStorage` key `ofm_auth`. On mount, it re-fetches the profile from `/api/auth/profile` to sync latest `isApproved`/`isBlocked` status.

**API layer:** `client/src/services/api.js` exports:
- `apiRequest(path, opts)` — raw fetch wrapper that reads `VITE_API_URL`, attaches Bearer token, and handles errors
- `useApi()` hook — returns `{ get, post, put, delete }` methods pre-bound with the current auth token from context

**Routing** (App.jsx):
- `/` → ProductsPage (public)
- `/product/:id` → ProductDetailsPage (public)
- `/login`, `/register` → auth pages
- `/dashboard/*` → DashboardPage (nested routes, protected)
- `*` → redirects to `/`

**Dashboard** is role-aware: renders different views (profile, orders, products, stats, admin panels) based on `user.role`. Uses inline styles throughout.

**Styling:** Global styles in `client/src/index.css` and `client/src/styles/common.css`. Component styles are inline. No CSS framework.

## Key Conventions

- Backend uses CommonJS (`require`/`module.exports`); frontend uses ES modules (`import`/`export`).
- All API responses use `{ message: "..." }` for errors. Successful responses return the entity directly or `{ message, ...data }`.
- JWT tokens expire in 7 days (`{ expiresIn: "7d" }` in `routes/auth.js`).
- Order status flow: `Pending` → `Accepted` → `Packed` → `Delivered`.
- Payment methods: `COD` and `UPI`. The UPI flow in `order_payment.js` uses a two-step process (create PaymentRequest, then verify) whereas `orders.js` creates orders directly.
- ESLint flat config is in `client/eslint.config.js`; `no-unused-vars` ignores variables starting with uppercase or underscore.

## Deployment

Frontend deploys to Vercel (root directory: `client`), backend to Render (root directory: `server`). See `DEPLOYMENT.md` for full instructions. Key env var linking: Render needs `FRONTEND_URL` set to the Vercel URL; Vercel needs `VITE_API_URL` set to the Render URL (no trailing slash).

## No Test Suite

There are no automated tests configured. The `test` script in `server/package.json` is a placeholder.
