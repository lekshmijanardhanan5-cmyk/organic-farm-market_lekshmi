const express = require("express");
const Order = require("../models/Order");
const Review = require("../models/Review");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");

const router = express.Router();

// All customer routes require customer role
router.use(auth, allowRoles("customer"));

// Get customer statistics
router.get("/stats", async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id });
    const reviews = await Review.find({ user: req.user.id });

    const ordersByStatus = {};
    let totalSpent = 0;

    orders.forEach((order) => {
      const status = order.status;
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
      if (status === "Delivered") {
        totalSpent += order.totalAmount || 0;
      }
    });

    return res.json({
      orders: { total: orders.length, byStatus: ordersByStatus },
      reviews: { total: reviews.length },
      totalSpent,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch stats", error: err.message });
  }
});

module.exports = router;
