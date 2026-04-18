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

    purpose: {
      type: String,
      enum: ["rent", "sale"],
      required: true,
      default: "rent",
      index: true
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

    type: {
      type: String,
      enum: [
        "apartment",
        "bedsitter",
        "maisonette",
        "studio",
        "bungalow",
        "townhouse",
        "office",
        "other"
      ],
      required: true,
      index: true
    },

    bedrooms: {
      type: Number,
      min: 0,
      default: null
    },

    bathrooms: {
      type: Number,
      min: 0,
      default: null
    },

    kitchen: {
      type: Boolean,
      default: true
    },

    size: {
      type: Number,
      min: 0,
      default: null
    },

    sizeUnit: {
      type: String,
      enum: ["sqft"],
      default: null
    },

    images: {
      type: [String],
      validate: [arrayLimit, "Maximum 5 images allowed"]
    },

    video: {
      type: String,
      default: null
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

listingSchema.pre("validate", function () {
  // Office listings should have size in square feet
  if (this.type === "office") {
    if (!this.size) {
      throw new Error("Office listings must include size in square feet");
    }

    if (!this.sizeUnit) {
      this.sizeUnit = "sqft";
    }
  }

  // Residential types should usually have bedrooms and bathrooms
  const residentialTypes = [
    "apartment",
    "bedsitter",
    "maisonette",
    "studio",
    "bungalow",
    "townhouse"
  ];

  if (residentialTypes.includes(this.type)) {
    if (this.bedrooms === null || this.bedrooms === undefined) {
      throw new Error("Residential listings must include bedrooms");
    }

    if (this.bathrooms === null || this.bathrooms === undefined) {
      throw new Error("Residential listings must include bathrooms");
    }
  }
});
module.exports = mongoose.model("Listing", listingSchema);

