const mongoose = require("mongoose");

const helpRequestSchema = new mongoose.Schema(
  {
    purpose: {
      type: String,
      enum: ["rent", "sale", "office"],
      required: true
    },
    timeline: { type: String, default: "", trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    location: { type: String, default: "", trim: true },
    monthlyBudget: { type: String, default: "", trim: true },
    purchaseBudget: { type: String, default: "", trim: true },
    propertyType: { type: String, default: "", trim: true },
    bedrooms: { type: String, default: "", trim: true },
    leaseTerm: { type: String, default: "", trim: true },
    financing: { type: String, default: "", trim: true },
    teamSize: { type: String, default: "", trim: true },
    officeSetup: { type: String, default: "", trim: true },
    businessType: { type: String, default: "", trim: true },
    message: { type: String, default: "", trim: true },
    source: {
      type: String,
      enum: ["mobile_app", "website"],
      default: "mobile_app"
    },
    status: {
      type: String,
      enum: ["new", "in_progress", "resolved"],
      default: "new"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("HelpRequest", helpRequestSchema);
