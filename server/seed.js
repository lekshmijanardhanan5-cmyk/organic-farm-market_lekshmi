const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");
const Product = require("./models/Product");

dotenv.config();

async function seed() {
  try {
    await connectDB();

    console.log("Clearing existing demo data...");
    await User.deleteMany({});
    await Product.deleteMany({});

    const password = await bcrypt.hash("password123", 10);

    console.log("Creating users...");
    const [admin, farmer, customer] = await User.create([
      {
        name: "Admin User",
        email: "admin@example.com",
        password,
        role: "admin",
      },
      {
        name: "Farmer User",
        email: "farmer@example.com",
        password,
        role: "farmer",
        isApproved: true, // Pre-approved for demo
      },
      {
        name: "Customer User",
        email: "customer@example.com",
        password,
        role: "customer",
      },
    ]);

    console.log("Creating products for farmer...");
    await Product.create([
      {
        title: "Organic Tomato",
        description: "Naturally grown, pesticide-free tomatoes.",
        price: 50,
        category: "Vegetables",
        imageUrl: "",
        farmer: farmer._id,
      },
      {
        title: "Organic Banana",
        description: "Sweet, naturally ripened bananas.",
        price: 60,
        category: "Fruits",
        imageUrl: "",
        farmer: farmer._id,
      },
    ]);

    console.log("Seed complete!");
    console.log("Login credentials for demo:");
    console.log("Admin    -> admin@example.com / password123");
    console.log("Farmer   -> farmer@example.com / password123");
    console.log("Customer -> customer@example.com / password123");

    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seed();


