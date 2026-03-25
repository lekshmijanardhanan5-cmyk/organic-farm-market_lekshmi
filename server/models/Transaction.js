const mongoose = require("mongoose");

const transactionItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    farmers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    items: { type: [transactionItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["COD", "UPI", "CARD"], required: true },
    paymentStatus: { type: String, enum: ["Pending", "Paid", "Failed"], required: true },
    transactionStatus: {
      type: String,
      enum: ["Initiated", "Completed", "Failed"],
      default: "Initiated",
    },
    gatewaySessionId: { type: String },
    gatewayTransactionId: { type: String },
    upiId: { type: String },
    cardLast4: { type: String },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
