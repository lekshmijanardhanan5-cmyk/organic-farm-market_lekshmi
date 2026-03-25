const express = require("express");
const crypto = require("crypto");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");

const router = express.Router();
const orderEvents = require("../utils/orderEvents");

const ALLOWED_PAYMENT_METHODS = ["COD", "UPI", "CARD"];
const ALLOWED_PAYMENT_STATUSES = ["Pending", "Paid", "Failed"];

const buildPaymentMethodSnapshot = (paymentMethod, paymentDetails = {}) => {
  if (paymentMethod === "UPI") {
    if (!paymentDetails.upiId || typeof paymentDetails.upiId !== "string") {
      throw new Error("UPI ID is required for UPI payment");
    }
    return { upiId: paymentDetails.upiId.trim() };
  }

  if (paymentMethod === "CARD") {
    const { cardNumber, cardHolderName, expiryMonth, expiryYear, cvv } = paymentDetails;
    if (!cardNumber || !cardHolderName || !expiryMonth || !expiryYear || !cvv) {
      throw new Error("Card details are required for card payment");
    }
    const normalizedNumber = String(cardNumber).replace(/\s+/g, "");
    if (!/^\d{13,19}$/.test(normalizedNumber)) {
      throw new Error("Invalid card number");
    }
    const cardLast4 = normalizedNumber.slice(-4);
    return {
      cardLast4,
      cardHolderName: String(cardHolderName).trim(),
      expiryMonth: String(expiryMonth).trim(),
      expiryYear: String(expiryYear).trim(),
    };
  }

  return {};
};

const validateAndBuildOrderItems = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Items array is required");
  }

  const productIds = items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds }, isAvailable: true }).populate("farmer", "_id");
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  let totalAmount = 0;
  const orderItems = [];
  const transactionItems = [];
  const farmerIdSet = new Set();

  for (const item of items) {
    const product = productMap.get(String(item.product));
    if (!product) {
      throw new Error("One or more products are unavailable");
    }
    const quantity = Number(item.quantity) || 0;
    if (quantity < 1) {
      throw new Error("Quantity must be at least 1");
    }

    const lineTotal = quantity * product.price;
    totalAmount += lineTotal;
    orderItems.push({ product: product._id, quantity });
    if (product.farmer?._id) {
      farmerIdSet.add(product.farmer._id.toString());
    }
    transactionItems.push({
      product: product._id,
      farmer: product.farmer?._id,
      title: product.title,
      quantity,
      unitPrice: product.price,
    });
  }

  return {
    totalAmount,
    orderItems,
    transactionItems,
    farmerIds: Array.from(farmerIdSet),
  };
};

const buildGatewayResponse = (paymentMethod, paymentSnapshot, amount) => {
  const gatewaySessionId = `sess_${crypto.randomBytes(8).toString("hex")}`;
  const clientSecret = `sim_${crypto.randomBytes(10).toString("hex")}`;
  const basePayload = {
    gatewaySessionId,
    clientSecret,
    amount,
    paymentMethod,
  };

  if (paymentMethod === "UPI") {
    return {
      ...basePayload,
      upi: {
        upiId: paymentSnapshot.upiId,
        intent: `upi://pay?pa=merchant@upi&pn=OrganicFarmMarket&am=${amount}&tn=OFM%20Order&tr=${gatewaySessionId}`,
      },
    };
  }

  if (paymentMethod === "CARD") {
    return {
      ...basePayload,
      card: {
        brand: "SIMULATED-VISA",
        last4: paymentSnapshot.cardLast4,
        authHint: "Use any OTP in this simulated gateway",
      },
    };
  }

  return {
    ...basePayload,
    cod: { note: "Cash will be collected at delivery" },
  };
};

// Simulated checkout gateway init (customer)
router.post("/checkout/initiate", auth, allowRoles("customer"), async (req, res) => {
  const { items, paymentMethod, paymentDetails = {} } = req.body;
  try {
    if (!paymentMethod || !ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const paymentSnapshot = buildPaymentMethodSnapshot(paymentMethod, paymentDetails);
    const { totalAmount } = await validateAndBuildOrderItems(items);
    const gateway = buildGatewayResponse(paymentMethod, paymentSnapshot, totalAmount);

    return res.json({
      message: "Payment session initiated",
      gateway,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Failed to initiate payment session" });
  }
});

// Simulated checkout confirm and place order (customer)
router.post("/checkout/confirm", auth, allowRoles("customer"), async (req, res) => {
  const { items, paymentMethod, paymentDetails = {}, outcome = "SUCCESS", gatewaySessionId } = req.body;
  try {
    if (!paymentMethod || !ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const paymentSnapshot = buildPaymentMethodSnapshot(paymentMethod, paymentDetails);
    const { totalAmount, orderItems, transactionItems, farmerIds } = await validateAndBuildOrderItems(items);
    const paymentSuccess = paymentMethod === "COD" ? true : outcome === "SUCCESS";
    const paymentStatus = paymentSuccess ? (paymentMethod === "COD" ? "Pending" : "Paid") : "Failed";

    let order = null;
    if (paymentSuccess) {
      const orderPayload = {
        user: req.user.id,
        items: orderItems,
        totalAmount,
        paymentMethod,
        paymentStatus,
      };
      if (paymentMethod === "UPI") orderPayload.upiId = paymentSnapshot.upiId;
      if (paymentMethod === "CARD") orderPayload.cardLast4 = paymentSnapshot.cardLast4;
      order = await Order.create(orderPayload);
    }

    const transaction = await Transaction.create({
      order: order?._id,
      customer: req.user.id,
      farmers: farmerIds,
      items: transactionItems,
      totalAmount,
      paymentMethod,
      paymentStatus,
      transactionStatus: paymentSuccess ? "Completed" : "Failed",
      gatewaySessionId: gatewaySessionId || `sess_${crypto.randomBytes(8).toString("hex")}`,
      gatewayTransactionId: `txn_${crypto.randomBytes(10).toString("hex")}`,
      upiId: paymentMethod === "UPI" ? paymentSnapshot.upiId : undefined,
      cardLast4: paymentMethod === "CARD" ? paymentSnapshot.cardLast4 : undefined,
      meta: paymentMethod === "CARD"
        ? { cardHolderName: paymentSnapshot.cardHolderName }
        : {},
    });

    if (!paymentSuccess) {
      return res.status(400).json({
        message: "Payment failed",
        transaction,
      });
    }

    return res.status(201).json({
      message: "Order placed successfully",
      order,
      transaction,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Failed to confirm payment" });
  }
});

// Place new order (customer)
router.post("/", auth, allowRoles("customer"), async (req, res) => {
  const { items, paymentMethod, upiId, cardNumber, paymentStatus } = req.body;
  try {
    const method = paymentMethod || "COD";
    if (!ALLOWED_PAYMENT_METHODS.includes(method)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }
    if (paymentStatus && !ALLOWED_PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid paymentStatus" });
    }
    const paymentDetails =
      method === "UPI"
        ? { upiId }
        : method === "CARD"
          ? { cardNumber, cardHolderName: "Legacy Card", expiryMonth: "01", expiryYear: "2030", cvv: "000" }
          : {};
    const paymentSnapshot = buildPaymentMethodSnapshot(method, paymentDetails);
    const { totalAmount, orderItems, transactionItems, farmerIds } = await validateAndBuildOrderItems(items);
    const chosenPaymentStatus =
      method === "COD" ? "Pending" : paymentStatus === "Failed" ? "Failed" : "Paid";
    if (chosenPaymentStatus === "Failed") {
      return res.status(400).json({ message: "Payment failed" });
    }
    const orderPayload = {
      user: req.user.id,
      items: orderItems,
      totalAmount,
      paymentMethod: method,
      paymentStatus: chosenPaymentStatus,
    };
    if (method === "UPI") {
      orderPayload.upiId = paymentSnapshot.upiId;
    }
    if (method === "CARD") {
      orderPayload.cardLast4 = paymentSnapshot.cardLast4;
    }

    const order = await Order.create(orderPayload);
    await Transaction.create({
      order: order._id,
      customer: req.user.id,
      farmers: farmerIds,
      items: transactionItems,
      totalAmount,
      paymentMethod: method,
      paymentStatus: chosenPaymentStatus,
      transactionStatus: "Completed",
      gatewaySessionId: `legacy_${crypto.randomBytes(8).toString("hex")}`,
      gatewayTransactionId: `txn_${crypto.randomBytes(10).toString("hex")}`,
      upiId: method === "UPI" ? paymentSnapshot.upiId : undefined,
      cardLast4: method === "CARD" ? paymentSnapshot.cardLast4 : undefined,
    });

    return res.status(201).json(order);
  } catch (err) {
    return res.status(400).json({ message: err.message || "Failed to create order", error: err.message });
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

