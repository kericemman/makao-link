const mongoose = require("mongoose");

const servicePartnerSchema = new mongoose.Schema(
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
      enum: ["movers", "cleaning", "handyman", "furniture", "internet", "other"],
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

    isActive: {
      type: Boolean,
      default: true
    },

    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PartnerApplication",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServicePartner", servicePartnerSchema);