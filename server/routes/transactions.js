const express = require("express");
const Transaction = require("../models/Transaction");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");

const router = express.Router();

router.use(auth);

router.get("/customer", allowRoles("customer"), async (req, res) => {
  try {
    const txns = await Transaction.find({ customer: req.user.id })
      .populate("customer", "name email")
      .populate("farmers", "name email")
      .sort({ createdAt: -1 })
      .lean();
    return res.json(txns || []);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch customer transactions", error: err.message });
  }
});

router.get("/farmer", allowRoles("farmer"), async (req, res) => {
  try {
    const txns = await Transaction.find({ farmers: req.user.id })
      .populate("customer", "name email")
      .populate("farmers", "name email")
      .sort({ createdAt: -1 })
      .lean();
    return res.json(txns || []);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch farmer transactions", error: err.message });
  }
});

router.get("/admin", allowRoles("admin"), async (_req, res) => {
  try {
    const txns = await Transaction.find()
      .populate("customer", "name email")
      .populate("farmers", "name email")
      .sort({ createdAt: -1 })
      .lean();
    return res.json(txns || []);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch all transactions", error: err.message });
  }
});

module.exports = router;
