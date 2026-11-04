const mongoose = require("mongoose");

const applicationDocumentSchema = new mongoose.Schema({
  key: { type: String, trim: true, required: true },
  originalName: { type: String, trim: true, maxlength: 180, required: true },
  contentType: { type: String, trim: true, required: true },
  size: { type: Number, min: 1, max: 10 * 1024 * 1024, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const agentApplicationSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true, minlength: 2, maxlength: 100 },
  email: { type: String, trim: true, lowercase: true, required: true, maxlength: 254 },
  phone: { type: String, trim: true, required: true, maxlength: 32 },
  county: { type: String, trim: true, maxlength: 80, default: "" },
  town: { type: String, trim: true, maxlength: 80, default: "" },
  experience: { type: String, trim: true, maxlength: 1500, default: "" },
  identityType: { type: String, enum: ["national_id", "passport"], default: "national_id" },
  documents: {
    identityFront: { type: applicationDocumentSchema, default: undefined },
    identityBack: { type: applicationDocumentSchema, default: undefined },
    professionalCredential: { type: applicationDocumentSchema, default: undefined }
  },
  documentProcessingConsent: {
    accepted: { type: Boolean, default: false },
    acceptedAt: { type: Date, default: null },
    policyVersion: { type: String, trim: true, maxlength: 40, default: "" }
  },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  reviewNote: { type: String, trim: true, maxlength: 1000, default: "" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt: { type: Date, default: null },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  invitationStatus: { type: String, enum: ["not_sent", "sent", "failed"], default: "not_sent" },
  invitationSentAt: { type: Date, default: null }
}, { timestamps: true, strict: "throw" });

agentApplicationSchema.index({ email: 1, status: 1 }, { unique: true, partialFilterExpression: { status: "pending" } });
agentApplicationSchema.index({ invitationStatus: 1, status: 1 });

module.exports = mongoose.model("AgentApplication", agentApplicationSchema);
