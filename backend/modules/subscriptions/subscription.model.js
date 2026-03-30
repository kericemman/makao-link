const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    plan: {
      type: String,
      enum: ["normal", "basic", "premium", "pro"],
      required: true,
      default: "normal"
    },

    status: {
      type: String,
      enum: ["free", "pending_payment", "active", "grace", "expired", "cancelled"],
      required: true,
      default: "free"
    },

    paystackCustomerCode: {
      type: String,
      default: null
    },

    paystackSubscriptionCode: {
      type: String,
      default: null
    },

    paystackEmailToken: {
      type: String,
      default: null
    },

    currentPeriodStart: {
      type: Date,
      default: null
    },

    currentPeriodEnd: {
      type: Date,
      default: null
    },

    gracePeriodEnd: {
      type: Date,
      default: null
    },

    lastPaymentDate: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);