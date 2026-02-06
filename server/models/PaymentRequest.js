const mongoose = require("mongoose");

const paymentRequestSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [Object], required: true }, // store product refs and qty
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["UPI"], required: true },
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    meta: { type: Object, default: {} }, // e.g., upiUri, transaction info
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentRequest", paymentRequestSchema);

