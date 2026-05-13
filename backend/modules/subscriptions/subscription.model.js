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
      default: "normal",
      required: true
    },

    status: {
      type: String,
      enum: ["free", "pending_payment", "active", "grace", "expired", "cancelled"],
      default: "free",
      required: true
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
    },

    paystackCustomerCode: {
      type: String,
      default: null
    },

    paystackSubscriptionCode: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);