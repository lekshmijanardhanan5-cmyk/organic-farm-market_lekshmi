const express = require("express");
const Product = require("../models/Product");
const Order = require("../models/Order");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");

const router = express.Router();

// All farmer routes require farmer role
router.use(auth, allowRoles("farmer"));

// Get farmer's own products
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find({ farmer: req.user.id }).sort({ createdAt: -1 });
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch products", error: err.message });
  }
});

// Delete farmer's own product
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed to delete this product" });
    }

    await Product.findByIdAndDelete(req.params.id);
    return res.json({ message: "Product deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete product", error: err.message });
  }
});

// Get farmer statistics
router.get("/stats", async (req, res) => {
  try {
    const farmerProducts = await Product.find({ farmer: req.user.id }).distinct("_id");
    const productIds = farmerProducts.map((p) => p.toString());

    const allOrders = await Order.find()
      .populate("items.product")
      .lean();

    // Filter orders that contain at least one product from this farmer
    const farmerOrders = allOrders.filter((order) =>
      order.items.some((item) => {
        const productId = item.product?._id?.toString() || item.product?.toString();
        return productId && productIds.includes(productId);
      })
    );

    const ordersByStatus = {};
    let totalRevenue = 0;

    farmerOrders.forEach((order) => {
      const status = order.status;
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
      if (status === "Delivered") {
        totalRevenue += order.totalAmount || 0;
      }
    });

    return res.json({
      products: { total: farmerProducts.length },
      orders: { total: farmerOrders.length, byStatus: ordersByStatus },
      revenue: totalRevenue,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch stats", error: err.message });
  }
});

module.exports = router;
