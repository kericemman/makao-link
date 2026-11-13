const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null
    },

    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    amount: {
      type: Number,
      required: true
    },

    baseAmount: {
      type: Number,
      default: null
    },

    vatRate: {
      type: Number,
      default: null
    },

    vatAmount: {
      type: Number,
      default: null
    },

    currency: {
      type: String,
      default: "KES"
    },

    plan: {
      type: String,
      enum: ["normal", "basic", "premium", "pro"],
      required: true
    },

    status: {
      type: String,
      enum: ["success", "failed"],
      required: true
    },

    paymentEnvironment: {
      type: String,
      enum: ["live", "test", "unknown"],
      default: "unknown",
      index: true
    },

    paidAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
