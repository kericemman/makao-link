const mongoose = require("mongoose");

const partnerApplicationSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true
    },

    contactPerson: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      enum: ["movers", "cleaning", "handyman", "furniture", "internet"],
      required: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    location: {
      type: String,
      required: true,
      trim: true
    },

    website: {
      type: String,
      default: "",
      trim: true
    },

    logo: {
      type: String,
      default: ""
    },

    paymentReference: {
      type: String,
      default: null
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending"
    },

    amountPaid: {
      type: Number,
      default: 100
    },

    status: {
      type: String,
      enum: ["pending_review", "approved", "rejected"],
      default: "pending_review"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PartnerApplication", partnerApplicationSchema);