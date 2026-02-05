const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");

const router = express.Router();

// All admin routes require admin role
router.use(auth, allowRoles("admin"));

// Get available user roles
router.get("/roles", async (req, res) => {
  try {
    // Return the roles from User model enum
    const roles = ["admin", "farmer", "customer", "delivery"];
    return res.json(roles);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch roles", error: err.message });
  }
});

// Get all users with filters
router.get("/users", async (req, res) => {
  try {
    const { role, isApproved, isBlocked } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isApproved !== undefined) filter.isApproved = isApproved === "true";
    if (isBlocked !== undefined) filter.isBlocked = isBlocked === "true";

    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
});

// Approve/reject farmer
router.put("/users/:id/approve", async (req, res) => {
  try {
    const { isApproved } = req.body;
    if (typeof isApproved !== "boolean") {
      return res.status(400).json({ message: "isApproved must be boolean" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "farmer") {
      return res.status(400).json({ message: "Only farmers can be approved/rejected" });
    }

    user.isApproved = isApproved;
    await user.save();

    return res.json({ message: `Farmer ${isApproved ? "approved" : "rejected"}`, user });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update approval", error: err.message });
  }
});

// Block/unblock user
router.put("/users/:id/block", async (req, res) => {
  try {
    const { isBlocked } = req.body;
    if (typeof isBlocked !== "boolean") {
      return res.status(400).json({ message: "isBlocked must be boolean" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot block admin accounts" });
    }

    user.isBlocked = isBlocked;
    await user.save();

    return res.json({ message: `User ${isBlocked ? "blocked" : "unblocked"}`, user });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update block status", error: err.message });
  }
});

// Delete user
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot delete admin accounts" });
    }

    await User.findByIdAndDelete(req.params.id);
    return res.json({ message: "User deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete user", error: err.message });
  }
});

// Get all products (admin view - includes unapproved farmer products)
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find()
      .populate("farmer", "name email role isApproved isBlocked")
      .sort({ createdAt: -1 });
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch products", error: err.message });
  }
});

// Get all orders (admin view)
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email role phoneNumber address place landmark pincode")
      .populate({
        path: "items.product",
        populate: { path: "farmer", select: "name email phoneNumber address place landmark pincode" },
      })
      .populate("deliveryAgent", "name email phoneNumber")
      .sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
});

// Get all delivery agents
router.get("/delivery-agents", async (req, res) => {
  try {
    const agents = await User.find({ role: "delivery", isBlocked: false })
      .select("name email phoneNumber")
      .sort({ name: 1 });
    return res.json(agents);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch delivery agents", error: err.message });
  }
});

// Assign delivery agent to order
router.put("/orders/:id/assign-delivery", async (req, res) => {
  try {
    const { deliveryAgentId } = req.body;

    if (!deliveryAgentId) {
      return res.status(400).json({ message: "deliveryAgentId is required" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify order is accepted by farmer (status should be Accepted or Packed)
    if (order.status !== "Accepted" && order.status !== "Packed") {
      return res.status(400).json({ message: "Order must be Accepted or Packed before assigning delivery agent" });
    }

    // Verify delivery agent exists and is a delivery role
    const deliveryAgent = await User.findById(deliveryAgentId);
    if (!deliveryAgent || deliveryAgent.role !== "delivery") {
      return res.status(400).json({ message: "Invalid delivery agent" });
    }

    if (deliveryAgent.isBlocked) {
      return res.status(400).json({ message: "Cannot assign blocked delivery agent" });
    }

    order.deliveryAgent = deliveryAgentId;
    order.deliveryStatus = "Assigned";
    await order.save();

    // Populate before returning
    await order.populate([
      { path: "user", select: "name email phoneNumber address place landmark pincode" },
      {
        path: "items.product",
        populate: { path: "farmer", select: "name email phoneNumber address place landmark pincode" },
      },
      { path: "deliveryAgent", select: "name email phoneNumber" },
    ]);

    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: "Failed to assign delivery agent", error: err.message });
  }
});

// Get statistics
router.get("/stats", async (req, res) => {
  try {
    const [users, farmers, customers, products, orders] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "farmer" }),
      User.countDocuments({ role: "customer" }),
      Product.countDocuments(),
      Order.countDocuments(),
    ]);

    const pendingFarmers = await User.countDocuments({ role: "farmer", isApproved: false });
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    const totalRevenue = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    return res.json({
      users: { total: users, farmers, customers, pendingFarmers, blockedUsers },
      products: { total: products },
      orders: { total: orders },
      revenue: totalRevenue[0]?.total || 0,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch stats", error: err.message });
  }
});

module.exports = router;
