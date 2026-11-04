const mongoose = require("mongoose");

const viewingSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  advertiser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  websiteInquiry: { type: mongoose.Schema.Types.ObjectId, ref: "Inquiry", default: null },
  appAlert: { type: mongoose.Schema.Types.ObjectId, ref: "AppAlert", default: null },
  propertyRequest: { type: mongoose.Schema.Types.ObjectId, ref: "PropertyRequest", default: null, select: false },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", default: null, index: true },
  idempotencyKey: { type: String, select: false, default: undefined },
  requestedStartAt: { type: Date, required: true, index: true },
  requestedEndAt: { type: Date, required: true },
  confirmedStartAt: { type: Date, default: null },
  confirmedEndAt: { type: Date, default: null },
  proposedStartAt: { type: Date, default: null },
  proposedEndAt: { type: Date, default: null },
  proposalBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  proposalMessage: { type: String, trim: true, maxlength: 1200, default: "" },
  timezone: { type: String, required: true, default: "Africa/Nairobi", maxlength: 100 },
  customerMessage: { type: String, trim: true, maxlength: 1200, default: "" },
  advertiserMessage: { type: String, trim: true, maxlength: 1200, default: "" },
  consent: { contactSharing: { type: Boolean, required: true, default: false } },
  status: { type: String, enum: ["requested", "confirmed", "reschedule_proposed", "declined", "cancelled", "completed"], default: "requested", index: true },
  completedOutcome: { type: String, enum: ["viewed", "no_show", "customer_withdrew", "not_completed", null], default: null },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  cancelledReason: { type: String, trim: true, maxlength: 500, default: "" }
}, { timestamps: true });

viewingSchema.index({ customer: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } });
viewingSchema.index({ advertiser: 1, status: 1, requestedStartAt: 1 });
viewingSchema.index({ assignedAgent: 1, status: 1, requestedStartAt: 1 });
module.exports = mongoose.model("Viewing", viewingSchema);
