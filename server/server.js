const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");
const farmerRoutes = require("./routes/farmer");
const reviewRoutes = require("./routes/reviews");
const customerRoutes = require("./routes/customer");
const orderPaymentRoutes = require("./routes/order_payment");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Connect to MongoDB
connectDB();

// Health/test route
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/farmer", farmerRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/order", orderPaymentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

