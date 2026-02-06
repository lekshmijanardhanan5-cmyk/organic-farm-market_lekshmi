const express = require("express");
const crypto = require("crypto");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const PaymentRequest = require("../models/PaymentRequest");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");

const router = express.Router();

// Helper to generate a pseudo payment id and UPI uri (mock)
function generatePaymentPayload(userId, amount) {
  const paymentId = crypto.randomBytes(12).toString("hex");
  // Mock UPI URI (in real system integrate with payment provider)
  const upiUri = `upi://pay?pa=merchant@upi&pn=OrganicFarmMarket&am=${amount}&tn=Order%20Payment&tr=${paymentId}`;
  const qrData = `upi://qr?pa=merchant@upi&am=${amount}&tr=${paymentId}`;
  return { paymentId, upiUri, qrData };
}

// Place order endpoint
// Accepts: product_id, quantity, payment_method (COD or UPI), user_id (optional)
router.post("/", auth, allowRoles("customer", "admin", "farmer"), async (req, res) => {
  try {
    const { product_id, quantity, payment_method, user_id } = req.body;
    const userId = req.user?.id || user_id;

    // Basic validation
    if (!product_id) return res.status(400).json({ message: "product_id is required" });
    const qty = Number(quantity) || 0;
    if (isNaN(qty) || qty <= 0) return res.status(400).json({ message: "Quantity must be greater than 0" });
    if (!["COD", "UPI", "Cash on Delivery"].includes(payment_method)) {
      return res.status(400).json({ message: "payment_method must be 'COD' or 'UPI'" });
    }

    // Fetch product
    const product = await Product.findById(product_id).populate("farmer", "name email");
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (!product.isAvailable) return res.status(400).json({ message: "Product is not available" });

    const totalAmount = (product.price || 0) * qty;

    // If COD -> create order immediately with status Pending
    if (payment_method === "COD" || payment_method === "Cash on Delivery") {
      const order = await Order.create({
        user: userId,
        items: [{ product: product._id, quantity: qty }],
        totalAmount,
        paymentMethod: "Cash on Delivery",
        status: "Pending",
      });
      await order.populate([{ path: "items.product", populate: { path: "farmer", select: "name" } }, { path: "user", select: "name email" }]);
      return res.status(201).json({ message: "Order placed with Cash on Delivery", order });
    }

    // If UPI -> create payment request and return payment payload, do NOT create order yet
    if (payment_method === "UPI") {
      const { paymentId, upiUri, qrData } = generatePaymentPayload(userId, totalAmount);
      const paymentRequest = await PaymentRequest.create({
        paymentId,
        user: userId,
        items: [{ product: product._id, quantity: qty }],
        totalAmount,
        paymentMethod: "UPI",
        meta: { upiUri, qrData },
      });
      return res.status(200).json({
        message: "Payment initiated",
        paymentRequest: {
          paymentId: paymentRequest.paymentId,
          upiUri,
          qrData,
          amount: totalAmount,
        },
      });
    }

    return res.status(400).json({ message: "Unsupported payment method" });
  } catch (err) {
    console.error("Order placement error:", err);
    return res.status(500).json({ message: "Failed to place order", error: err.message });
  }
});

// Verify UPI payment and create order upon success
// Accepts: paymentId, status ('SUCCESS'|'FAILED'), transactionId (optional)
router.post("/payment/verify", auth, async (req, res) => {
  try {
    const { paymentId, status, transactionId } = req.body;
    if (!paymentId || !status) return res.status(400).json({ message: "paymentId and status are required" });

    const pr = await PaymentRequest.findOne({ paymentId });
    if (!pr) return res.status(404).json({ message: "Payment request not found" });
    if (pr.status === "paid") return res.status(400).json({ message: "Payment already processed" });

    if (status === "SUCCESS") {
      // Mark payment as paid
      pr.status = "paid";
      pr.meta = { ...pr.meta, transactionId };
      await pr.save();

      // Create the order now with status Paid
      const order = await Order.create({
        user: pr.user,
        items: pr.items.map((it) => ({ product: it.product, quantity: it.quantity })),
        totalAmount: pr.totalAmount,
        paymentMethod: "UPI",
        status: "Paid",
      });
      await order.populate([{ path: "items.product", populate: { path: "farmer", select: "name" } }, { path: "user", select: "name email" }]);
      return res.status(201).json({ message: "Payment verified and order created", order });
    } else {
      // Mark failed/cancelled
      pr.status = "failed";
      pr.meta = { ...pr.meta, transactionId };
      await pr.save();
      return res.status(400).json({ message: "Payment failed or cancelled" });
    }
  } catch (err) {
    console.error("Payment verification error:", err);
    return res.status(500).json({ message: "Failed to verify payment", error: err.message });
  }
});

// List orders for a user (only accessible by that user or admin)
router.get("/user/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    // allow admin or the same user
    if (req.user.role !== "admin" && req.user.id !== userId) {
      return res.status(403).json({ message: "Not authorized to view these orders" });
    }
    const orders = await Order.find({ user: userId })
      .populate({
        path: "items.product",
        populate: { path: "farmer", select: "name email" },
      })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();
    return res.json(orders || []);
  } catch (err) {
    console.error("Failed to fetch user orders:", err);
    return res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
});

module.exports = router;

