const mongoose = require("mongoose");

const contactInfoSchema = new mongoose.Schema(
  {
    email: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    whatsapp: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    socials: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      x: { type: String, default: "" },
      tiktok: { type: String, default: "" }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactInfo", contactInfoSchema);