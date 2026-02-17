const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

// Register
router.post("/register", async (req, res) => {
  const { name, email, password, role = "customer" } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password required" });
  }

  // Validate role against allowed roles
  const allowedRoles = ["admin", "farmer", "customer"];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        isBlocked: user.isBlocked,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Account is blocked. Please contact admin." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        isBlocked: user.isBlocked,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// Current user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Return a normalized user object with `id` (matches login/register response)
    return res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      isBlocked: user.isBlocked,
      phoneNumber: user.phoneNumber || "",
      address: user.address || "",
      place: user.place || "",
      landmark: user.landmark || "",
      pincode: user.pincode || "",
      farmName: user.farmName || "",
      productTypes: user.productTypes || [],
      yearsOfExperience: user.yearsOfExperience || 0,
    });
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch profile", error: err.message });
  }
});

// Update profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, email, phoneNumber, address, place, landmark, pincode, farmName, productTypes, yearsOfExperience } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      // Check if email is being changed and if it's already taken
      if (email !== user.email) {
        const existing = await User.findOne({ email });
        if (existing) {
          return res.status(400).json({ message: "Email already in use" });
        }
        user.email = email;
      }
    }

    // Validate phone number (10 digits)
    if (phoneNumber !== undefined) {
      const phoneRegex = /^\d{10}$/;
      if (phoneNumber && !phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
      }
      user.phoneNumber = phoneNumber || "";
    }

    // Validate pincode (6 digits)
    if (pincode !== undefined) {
      const pincodeRegex = /^\d{6}$/;
      if (pincode && !pincodeRegex.test(pincode)) {
        return res.status(400).json({ message: "Pincode must be exactly 6 digits" });
      }
      user.pincode = pincode || "";
    }

    if (name) user.name = name;
    if (address !== undefined) user.address = address || "";
    if (place !== undefined) user.place = place || "";
    if (landmark !== undefined) user.landmark = landmark || "";
    if (farmName !== undefined) user.farmName = farmName || "";
    if (productTypes !== undefined) {
      user.productTypes = Array.isArray(productTypes) ? productTypes : [];
    }
    if (yearsOfExperience !== undefined) {
      const years = Number(yearsOfExperience);
      user.yearsOfExperience = isNaN(years) ? 0 : Math.max(0, years);
    }

    await user.save();

    // Return user without password
    const userResponse = await User.findById(user._id).select("-password");
    return res.json({ message: "Profile updated", user: userResponse });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
});

module.exports = router;

