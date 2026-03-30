const mongoose = require("mongoose");

function arrayLimit(val) {
  return val.length <= 5;
}

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    location: {
      type: String,
      required: true,
      index: true
    },

    bedrooms: {
      type: Number,
      required: true,
      min: 0
    },

    bathrooms: {
      type: Number,
      required: true,
      min: 0
    },

    kitchen: {
      type: Boolean,
      default: true
    },

    type: {
      type: String,
      enum: ["apartment", "bedsitter", "maisonette", "studio", "bungalow", "townhouse", "other"],
      required: true
    },

    images: {
      type: [String],
      validate: [arrayLimit, "Maximum 5 images allowed"]
    },

    amenities: {
      garden: { type: Boolean, default: false },
      tarmacAccess: { type: Boolean, default: false },
      nearSchools: { type: Boolean, default: false },
      nearShoppingCentre: { type: Boolean, default: false },
      nearHospital: { type: Boolean, default: false },
      waterAvailable: { type: Boolean, default: true },
      electricityAvailable: { type: Boolean, default: true }
    },

    contactPhone: {
      type: String,
      required: true
    },

    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    availability: {
      type: String,
      enum: ["available", "taken"],
      default: "available"
    },

    isActive: {
      type: Boolean,
      default: true
    },

    unlistReason: {
      type: String,
      enum: ["taken", "expired_subscription", "admin_action", null],
      default: null
    },

    views: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Listing", listingSchema);