const express = require("express");
const Order = require("../models/Order");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");

const router = express.Router();

// All delivery routes require delivery role
router.use(auth, allowRoles("delivery"));

// Get orders assigned to this delivery agent
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find({ deliveryAgent: req.user.id })
      .populate("user", "name email phoneNumber address place landmark pincode")
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

// Update delivery status
router.put("/orders/:id/status", async (req, res) => {
  const { deliveryStatus } = req.body;
  const allowed = ["Assigned", "Picked", "Delivered"];
  
  if (!allowed.includes(deliveryStatus)) {
    return res.status(400).json({ message: "Invalid delivery status. Must be: Assigned, Picked, or Delivered" });
  }

  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify this order is assigned to this delivery agent
    if (order.deliveryAgent?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this order" });
    }

    // Update delivery status
    order.deliveryStatus = deliveryStatus;

    // If delivery status is "Delivered", also update order status to "Delivered"
    if (deliveryStatus === "Delivered") {
      order.status = "Delivered";
    }

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
    return res.status(500).json({ message: "Failed to update delivery status", error: err.message });
  }
});

module.exports = router;
