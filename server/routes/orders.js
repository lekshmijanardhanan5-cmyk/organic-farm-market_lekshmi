const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");

const router = express.Router();

// Place new order (customer)
router.post("/", auth, allowRoles("customer"), async (req, res) => {
  const { items } = req.body;
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

    const order = await Order.create({
      user: req.user.id,
      items,
      totalAmount,
    });

    return res.status(201).json(order);
  } catch (err) {
    return res.status(500).json({ message: "Failed to create order", error: err.message });
  }
});

// Get customer orders
router.get("/user", auth, allowRoles("customer"), async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("items.product")
      .sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
});

// Get farmer orders
router.get("/farmer", auth, allowRoles("farmer", "admin"), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({
        path: "items.product",
        populate: { path: "farmer", select: "name email role" },
      })
      .sort({ createdAt: -1 });

    const filtered = req.user.role === "admin"
      ? orders
      : orders.filter((order) =>
          order.items.every((i) => i.product && i.product.farmer?.toString() === req.user.id)
        );

    return res.json(filtered);
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
    const ownsAllItems = order.items.every(
      (i) => i.product && i.product.farmer?.toString() === req.user.id
    );

    if (!isAdmin && !ownsAllItems) {
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

