const express = require("express");
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");

const router = express.Router();

// Get all products (public)
router.get("/", async (_req, res) => {
  try {
    const products = await Product.find().populate("farmer", "name email role");
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch products", error: err.message });
  }
});

// Create product (farmer/admin)
router.post("/", auth, allowRoles("farmer", "admin"), async (req, res) => {
  const { title, description, price, category, imageUrl, isAvailable, farmerId } = req.body;
  if (!title || price == null) {
    return res.status(400).json({ message: "Title and price are required" });
  }

  try {
    const farmer = req.user.role === "admin" && farmerId ? farmerId : req.user.id;
    const product = await Product.create({
      title,
      description,
      price,
      category,
      imageUrl,
      isAvailable,
      farmer,
    });
    return res.status(201).json(product);
  } catch (err) {
    return res.status(500).json({ message: "Failed to create product", error: err.message });
  }
});

// Update product (owner farmer or admin)
router.put("/:id", auth, allowRoles("farmer", "admin"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const isOwner = product.farmer.toString() === req.user.id;
    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({ message: "Not allowed to update this product" });
    }

    const fields = ["title", "description", "price", "category", "imageUrl", "isAvailable"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ message: "Failed to update product", error: err.message });
  }
});

// Delete product (admin only)
router.delete("/:id", auth, allowRoles("admin"), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json({ message: "Product deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete product", error: err.message });
  }
});

module.exports = router;

