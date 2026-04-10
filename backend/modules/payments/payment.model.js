const mongoose = require("mongoose");
const partnerApplicationModel = require("../services/partnerApplication.model");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
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

    paymentType: {
      type: String,
      enum: ["subscription", "partnerApplication"],
      default: "subscription"
    },

    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PartnerApplication",
      default: null
    },

    paidAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);