const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    plan: {
      type: String,
      enum: ["normal", "basic", "premium", "makaopro"],
      default: "normal"
    },

    propertyLimit: {
      type: Number
    },

    status: {
      type: String,
      enum: ["active", "expired"],
      default: "active"
    },

    startDate: {
      type: Date,
      default: Date.now
    },

    endDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);