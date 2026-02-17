const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");

const router = express.Router();
const orderEvents = require("../utils/orderEvents");

// Place new order (customer)
router.post("/", auth, allowRoles("customer"), async (req, res) => {
  const { items, paymentMethod, upiId, paymentStatus } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Items array is required" });
  }

  try {
    const productIds = items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds }, isAvailable: true });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    let totalAmount = 0;
    for (const item of items) {
      const product = productMap.get(String(item.product));
      if (!product) {
        return res.status(400).json({ message: "One or more products are unavailable" });
      }
      const quantity = Number(item.quantity) || 0;
      if (quantity < 1) {
        return res.status(400).json({ message: "Quantity must be at least 1" });
      }
      totalAmount += quantity * product.price;
    }

    // Validate payment method (expect 'COD' or 'UPI')
    const allowedPayments = ["COD", "UPI"];
    if (!paymentMethod) {
      return res.status(400).json({ message: "Select payment method" });
    }
    if (!allowedPayments.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }
    const chosenPayment = paymentMethod;

    // If UPI payment is selected, require a UPI ID (demo: basic format check)
    if (chosenPayment === "UPI") {
      if (!upiId || typeof upiId !== "string") {
        return res.status(400).json({ message: "UPI ID is required for UPI payment" });
      }
    }

    // Validate optional paymentStatus (allow client to send 'Paid' in demo)
    const allowedPaymentStatuses = ["Pending", "Paid", "Failed"];
    let chosenPaymentStatus = "Pending";
    if (paymentStatus) {
      if (!allowedPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ message: "Invalid paymentStatus" });
      }
      chosenPaymentStatus = paymentStatus;
    }

    const orderPayload = {
      user: req.user.id,
      items,
      totalAmount,
      paymentMethod: chosenPayment,
      paymentStatus: chosenPaymentStatus,
    };
    if (chosenPayment === "UPI") {
      orderPayload.upiId = upiId.trim();
    }

    const order = await Order.create(orderPayload);

    return res.status(201).json(order);
  } catch (err) {
    return res.status(500).json({ message: "Failed to create order", error: err.message });
  }
});

// Get customer orders
router.get("/user", auth, allowRoles("customer"), async (req, res) => {
  try {
    const query = { user: req.user.id };
    // Optional status filter from query parameter
    if (req.query.status && req.query.status.trim()) {
      query.status = req.query.status.trim();
    }
    const orders = await Order.find(query)
      .populate("items.product")
      .sort({ createdAt: -1 })
      .lean();
    return res.json(orders || []);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
});

// Server-Sent Events endpoint for order updates (real-time)
router.get("/subscribe/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    // Fetch order
    const order = await Order.findById(orderId).populate("items.product");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Authenticate: accept token from Authorization header or query param `token` (for EventSource)
    const jwt = require("jsonwebtoken");
    const authHeader = req.headers.authorization || "";
    const tokenFromHeader = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const token = tokenFromHeader || req.query.token;
    if (!token) return res.status(401).json({ message: "No token provided" });
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const reqUser = decoded;
    const isOwner = order.user.toString() === reqUser.id;
    const isAdmin = reqUser.role === "admin";
    const isFarmer = reqUser.role === "farmer" && order.items.some((i) => {
      if (!i.product || !i.product.farmer) return false;
      // Handle both populated object (with _id) and ObjectId reference
      const farmerId = i.product.farmer._id 
        ? i.product.farmer._id.toString() 
        : i.product.farmer.toString();
      return farmerId === reqUser.id;
    });

    if (!isOwner && !isAdmin && !isFarmer) {
      return res.status(403).json({ message: "Not authorized to subscribe to this order" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders && res.flushHeaders();

    const send = (payload) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    // initial state
    send({ orderId, status: order.status });

    const handler = (payload) => {
      send({ orderId, ...payload });
    };

    orderEvents.on(`order:${orderId}`, handler);

    req.on("close", () => {
      orderEvents.removeListener(`order:${orderId}`, handler);
      res.end();
    });
  } catch (err) {
    console.error("SSE subscribe error:", err);
    return res.status(500).end();
  }
});

// Get farmer orders
router.get("/farmer", auth, allowRoles("farmer", "admin"), async (req, res) => {
  try {
    // Optional status filter from query parameter
    const statusFilter = req.query.status && req.query.status.trim() ? req.query.status.trim() : null;

    // If admin, allow fetching all orders (optionally filtered by status)
    if (req.user.role === "admin") {
      const adminQuery = {};
      if (statusFilter) adminQuery.status = statusFilter;
      const orders = await Order.find(adminQuery)
        .populate({
          path: "items.product",
          populate: { path: "farmer", select: "name email role" },
        })
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .lean();
      return res.json(orders || []);
    }

    // For farmers: find products that belong to this farmer, then fetch orders containing those products
    const farmerProductIds = await Product.find({ farmer: req.user.id }).distinct("_id");

    if (!farmerProductIds || farmerProductIds.length === 0) {
      // No products for this farmer -> return empty list
      return res.json([]);
    }

    const farmerOrderQuery = {
      "items.product": { $in: farmerProductIds },
    };
    if (statusFilter) farmerOrderQuery.status = statusFilter;

    const farmerOrders = await Order.find(farmerOrderQuery)
      .populate({
        path: "items.product",
        populate: { path: "farmer", select: "name email role" },
      })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.json(farmerOrders || []);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch farmer orders", error: err.message });
  }
});

// Update order status (farmer/admin)
router.put("/:id/status", auth, allowRoles("farmer", "admin"), async (req, res) => {
  const { status } = req.body;
  const allowed = ["Pending", "Accepted", "Packed", "Delivered"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const order = await Order.findById(req.params.id).populate({
      path: "items.product",
      populate: { path: "farmer", select: "name email role" },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isAdmin = req.user.role === "admin";
    const ownsAtLeastOneItem = order.items.some((i) => {
      if (!i.product || !i.product.farmer) return false;
      // Handle both populated object (with _id) and ObjectId reference
      const farmerId = i.product.farmer._id 
        ? i.product.farmer._id.toString() 
        : i.product.farmer.toString();
      return farmerId === req.user.id;
    });

    if (!isAdmin && !ownsAtLeastOneItem) {
      return res.status(403).json({ message: "Not allowed to update this order" });
    }

    order.status = status;
    await order.save();
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: "Failed to update status", error: err.message });
  }
});

module.exports = router;

