const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
  sourceModel: { type: String, enum: ["Inquiry", "AppAlert", "Viewing"], required: true },
  sourceRecord: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "sourceModel" },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
  advertiser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  viewings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Viewing" }],
  propertyRequests: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "PropertyRequest" }], default: [], select: false },
  sourceChannel: { type: String, enum: ["website", "user_portal", "mobile_app", "whatsapp", "agent", "admin"], required: true },
  stage: { type: String, enum: ["new", "contacted", "viewing_requested", "viewing_confirmed", "viewed", "application_negotiation", "closed_successful", "closed_unsuccessful"], default: "new", index: true },
  nextFollowUpAt: { type: Date, default: null },
  outcomeNote: { type: String, trim: true, maxlength: 1000, default: "" }
}, { timestamps: true });

leadSchema.index({ sourceModel: 1, sourceRecord: 1 }, { unique: true });
leadSchema.index({ advertiser: 1, stage: 1, updatedAt: -1 });
leadSchema.index({ assignedAgent: 1, stage: 1, updatedAt: -1 });
module.exports = mongoose.model("Lead", leadSchema);
