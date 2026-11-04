const mongoose = require("mongoose");

const propertyMandateSchema = new mongoose.Schema({
  principal: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null, index: true },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", default: null, index: true },
  scope: { type: String, enum: ["organization", "property"], required: true },
  permissions: { type: [String], enum: ["listings:read", "listings:update", "listings:advertise", "inquiries:read", "inquiries:manage"], required: true },
  status: { type: String, enum: ["active", "revoked", "expired"], default: "active", index: true },
  grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startsAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
  revokedAt: { type: Date, default: null }
}, { timestamps: true });

propertyMandateSchema.index({ agent: 1, listing: 1, status: 1 });
propertyMandateSchema.index({ principal: 1, organization: 1, agent: 1, scope: 1, status: 1 });
module.exports = mongoose.model("PropertyMandate", propertyMandateSchema);
