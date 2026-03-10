const mongoose = require("mongoose")

const settingsSchema = new mongoose.Schema({

  platformName: {
    type: String,
    default: "MakaoLink"
  },

  supportEmail: String,

  supportPhone: String,

  whatsappNumber: String,

  currency: {
    type: String,
    default: "KES"
  },

  partnerApplicationFee: {
    type: Number,
    default: 5000
  },

  propertyApprovalRequired: {
    type: Boolean,
    default: true
  },

  logo: {
    url: String,
    public_id: String
  },

  socialLinks: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String
  }

}, { timestamps: true })

module.exports = mongoose.model("Settings", settingsSchema)