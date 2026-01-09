## Organic Farm Market – MERN Project

Simple MERN app to connect organic farmers and customers, with admin oversight. Built for final-year project demos: focus on clarity and working flows, not production security.

---

### 1. Project Structure

- **server** – Node/Express + MongoDB (Mongoose)
  - `server.js` – Express app, CORS, JSON, MongoDB connection, routes
  - `config/db.js` – MongoDB connection helper
  - `models/User.js` – `name`, `email`, `password`, `role` (`admin|farmer|customer`)
  - `models/Product.js` – organic product info, `farmer` ref
  - `models/Order.js` – order items, `user` ref, status
  - `routes/auth.js` – register, login, profile
  - `routes/products.js` – products CRUD with role checks
  - `routes/orders.js` – place orders, view by user/farmer, update status
  - `middleware/auth.js` – JWT verification
  - `middleware/roles.js` – simple role-based access
  - `env.template` – template for environment variables
- **client** – Vite + React + React Router
  - `src/main.jsx` – wraps app with `BrowserRouter` + `AuthProvider`
  - `src/App.jsx` – layout + routes
  - `src/context/AuthContext.jsx` – auth/token state, localStorage
  - `src/services/api.js` – small fetch helper with token
  - `src/pages/LoginPage.jsx`, `RegisterPage.jsx`, `ProductsPage.jsx`, `DashboardPage.jsx`

---

### 2. Setup Instructions

#### 2.1 Prerequisites

- Node.js (LTS is fine)
- MongoDB connection string (local or cloud)

#### 2.2 Backend Setup (`server`)

```bash
cd server
copy env.template .env   # on Windows PowerShell: Copy-Item env.template .env
```

Edit `.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_demo_secret_value
```

Install and run:

```bash
cd server
npm install
npm run dev      # or: npm start
```

Optional: seed demo data (recommended for presentation):

```bash
cd server
npm run seed
```

Demo accounts created by seeding:

- Admin: `admin@example.com` / `password123`
- Farmer: `farmer@example.com` / `password123`
- Customer: `customer@example.com` / `password123`

You should see:

- Console: `MongoDB connected: ...` and `Server listening on port ...`
- Browser: `GET http://localhost:5000/` → `{ "message": "API is running" }`

#### 2.3 Frontend Setup (`client`)

```bash
cd client
npm install
npm run dev
```

Open the printed URL (usually `http://localhost:5173`).

---

### 3. API Overview (Short Version)

- **Auth**
  - `POST /api/auth/register` – `{ name, email, password, role? }`
  - `POST /api/auth/login` – `{ email, password }`
  - `GET /api/auth/profile` – current user (requires `Authorization: Bearer <token>`)
- **Products**
  - `GET /api/products` – public product list
  - `POST /api/products` – farmer/admin only
  - `PUT /api/products/:id` – owner farmer or admin
  - `DELETE /api/products/:id` – admin only
- **Orders**
  - `POST /api/orders` – customer; `{ items: [{ product, quantity }] }`
  - `GET /api/orders/user` – logged-in customer’s orders
  - `GET /api/orders/farmer` – farmer’s orders (or all for admin)
  - `PUT /api/orders/:id/status` – farmer/admin; status in `["Pending","Accepted","Packed","Delivered"]`

---

### 4. Frontend Pages & Roles

- `/` (**ProductsPage**) – public list of organic products.
  - Logged-in **customer** can choose quantity and click **Order Now**.
- `/register` (**RegisterPage**) – create `customer`, `farmer`, or `admin` account.
- `/login` (**LoginPage**) – login and save JWT in localStorage.
- `/dashboard` (**DashboardPage**, protected)
  - Shows logged-in user name and role, plus logout.
  - **Customer**: `My Orders` – calls `GET /api/orders/user`.
  - **Farmer**:
    - `My Products` – quick form to add products, list of existing.
    - `Farmer Orders` – orders containing their products; can change status.
  - **Admin**:
    - Same farmer views plus **Admin Overview** (counts products + orders).

---

### 5. Suggested Demo Script (For Evaluation)

1. **Intro (1–2 minutes)**
   - Show `project_spec.txt` summary (problem + solution).
   - Briefly explain roles: **Admin**, **Farmer**, **Customer**.
2. **Backend Check (1 minute)**
   - Show server terminal: Mongo connected, server running.
   - Hit `http://localhost:5000/` to show “API is running”.
3. **Customer Journey (3–4 minutes)**
   - Register as **Farmer** (e.g. `farmer1`).
   - Register as **Customer** (e.g. `customer1`).
   - Login as `farmer1` → Dashboard → **My Products** → create a few products.
   - Logout, then login as `customer1`.
   - Go to `/` (products page), view products, order one item.
   - Go to Dashboard → **My Orders** and show the new order (status `Pending`).
4. **Farmer/Admin View (3–4 minutes)**
   - Login as `farmer1`.
   - Dashboard → **Farmer Orders**: show incoming order with status `Pending`.
   - Click buttons to move status: `Accepted` → `Packed` → `Delivered`.
   - Quickly switch back to `customer1` and show updated status in **My Orders**.
   - (Optional) Login as **Admin**, show **Admin Overview** with counts of products and orders.
5. **Wrap-Up (1–2 minutes)**
   - Reconnect to problem statement: transparency, direct farmer–customer link.
   - Mention that frontends for all roles make it easy for evaluators to test features.
   - Mention limitations (no advanced security, basic UI) and possible future improvements.

---

### 6. Notes & Customization

- Roles are stored as strings: `"admin"`, `"farmer"`, `"customer"`.
- Passwords are hashed with `bcryptjs`; authentication uses JWT with a simple secret.
- You can pre-create an admin account by registering with role `admin` or by inserting directly into MongoDB.
- To reset auth state in the browser, clear `localStorage` key: `ofm_auth`.


