const mongoose = require("mongoose");

const landlordOnboardingMessageSchema = new mongoose.Schema({
  requestId: { type: String, required: true, trim: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  channel: { type: String, enum: ["email"], required: true },
  status: { type: String, enum: ["sending", "sent", "failed", "unknown"], required: true },
  hasUnresolvedDelivery: { type: Boolean, default: false },
  contentDigest: { type: String, required: true, select: false },
  providerMessageId: { type: String, default: "", select: false },
  sentAt: { type: Date, default: null },
  errorCode: { type: String, default: "" }
}, { timestamps: true });

landlordOnboardingMessageSchema.index({ user: 1, createdAt: -1 });
landlordOnboardingMessageSchema.index(
  { user: 1, channel: 1 },
  { unique: true, partialFilterExpression: { hasUnresolvedDelivery: true } }
);

module.exports = mongoose.model("LandlordOnboardingMessage", landlordOnboardingMessageSchema);
