const express = require("express");
const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");

const router = express.Router();

// Get reviews for a product (public)
router.get("/product/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });
    return res.json(reviews);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch reviews", error: err.message });
  }
});

// Create review (customer only, must have ordered the product)
router.post("/", auth, allowRoles("customer"), async (req, res) => {
  const { productId, rating, comment } = req.body;
  if (!productId || !rating) {
    return res.status(400).json({ message: "Product ID and rating are required" });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  try {
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user has ordered this product AND the order is delivered
    const hasDeliveredOrder = await Order.findOne({
      user: req.user.id,
      status: "Delivered",
      items: {
        $elemMatch: {
          product: productId,
        },
      },
    });

    if (!hasDeliveredOrder) {
      return res.status(403).json({ message: "You can only review products from orders that have been delivered" });
    }

    // Check if review already exists
    const existing = await Review.findOne({ product: productId, user: req.user.id });
    if (existing) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    const review = await Review.create({
      product: productId,
      user: req.user.id,
      rating,
      comment: comment || "",
    });

    const populated = await Review.findById(review._id).populate("user", "name");
    return res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }
    return res.status(500).json({ message: "Failed to create review", error: err.message });
  }
});

// Get user's reviews
router.get("/my-reviews", auth, allowRoles("customer"), async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate("product", "title price")
      .sort({ createdAt: -1 });
    return res.json(reviews);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch reviews", error: err.message });
  }
});

// Check if user can review a product (has delivered order)
router.get("/can-review/:productId", auth, allowRoles("customer"), async (req, res) => {
  try {
    const hasDeliveredOrder = await Order.findOne({
      user: req.user.id,
      status: "Delivered",
      items: {
        $elemMatch: {
          product: req.params.productId,
        },
      },
    });

    const hasReviewed = await Review.findOne({
      user: req.user.id,
      product: req.params.productId,
    });

    return res.json({
      canReview: !!hasDeliveredOrder && !hasReviewed,
      hasDeliveredOrder: !!hasDeliveredOrder,
      hasReviewed: !!hasReviewed,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to check review eligibility", error: err.message });
  }
});

module.exports = router;
