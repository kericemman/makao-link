const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    plan: {
      type: String
    },

    amount: {
      type: Number
    },

    reference: {
      type: String
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Payment", paymentSchema);