const mongoose = require("mongoose");
const {
  COUNTY_TOWNS,
  COUNTIES,
  RESIDENTIAL_TYPES,
  LISTING_TYPES,
  LISTING_PURPOSES,
  OFFICE_SIZE_UNITS
} = require("./listing.constants");

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
      required: true,
      trim: true
    },

    purpose: {
      type: String,
      enum: LISTING_PURPOSES,
      required: true,
      default: "rent",
      index: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    county: {
      type: String,
      enum: COUNTIES,
      required: true,
      index: true
    },

    town: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    area: {
      type: String,
      default: "",
      trim: true
    },

    type: {
      type: String,
      enum: LISTING_TYPES,
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
      enum: OFFICE_SIZE_UNITS,
      default: null
    },

    images: {
      type: [String],
      default: [],
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
      required: true,
      trim: true
    },

    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },

    availability: {
      type: String,
      enum: ["available", "taken"],
      default: "available",
      index: true
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
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
  if (this.county && this.town) {
    const allowedTowns = COUNTY_TOWNS[this.county] || [];

    if (!allowedTowns.includes(this.town)) {
      throw new Error("Selected town does not belong to the selected county");
    }
  }

  if (this.type === "office") {
    if (this.size === null || this.size === undefined || this.size === "") {
      throw new Error("Office listings must include size");
    }

    if (!this.sizeUnit) {
      this.sizeUnit = "sqft";
    }

    return;
  }

  if (RESIDENTIAL_TYPES.includes(this.type)) {
    if (this.bedrooms === null || this.bedrooms === undefined || this.bedrooms === "") {
      throw new Error("Residential listings must include bedrooms");
    }

    if (this.bathrooms === null || this.bathrooms === undefined || this.bathrooms === "") {
      throw new Error("Residential listings must include bathrooms");
    }
  }
});

module.exports = mongoose.model("Listing", listingSchema);