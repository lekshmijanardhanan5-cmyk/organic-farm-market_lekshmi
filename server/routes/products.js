const express = require("express");
const Product = require("../models/Product");
const User = require("../models/User");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");

const router = express.Router();

// Get all products (public - only from approved farmers)
router.get("/", async (_req, res) => {
  try {
    const products = await Product.find()
      .populate({
        path: "farmer",
        select: "name email role isApproved",
        match: { isApproved: true, isBlocked: false },
      })
      .lean();
    
    // Filter out products where farmer is null (not approved or blocked)
    const validProducts = products.filter((p) => p.farmer);
    return res.json(validProducts);
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
    // If farmer, check if approved and not blocked
    if (req.user.role === "farmer") {
      const farmer = await User.findById(req.user.id);
      if (!farmer.isApproved) {
        return res.status(403).json({ message: "Farmer account not approved yet" });
      }
      if (farmer.isBlocked) {
        return res.status(403).json({ message: "Account is blocked" });
      }
    }

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

// Delete product (admin or owner farmer)
router.delete("/:id", auth, allowRoles("admin", "farmer"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const isOwner = product.farmer.toString() === req.user.id;
    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({ message: "Not allowed to delete this product" });
    }

    await Product.findByIdAndDelete(req.params.id);
    return res.json({ message: "Product deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete product", error: err.message });
  }
});

module.exports = router;

