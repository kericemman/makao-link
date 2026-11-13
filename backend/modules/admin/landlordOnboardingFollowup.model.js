const mongoose = require("mongoose");

const landlordOnboardingFollowupSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  campaign: { type: String, required: true, default: "signup_no_listing_v1" },
  status: {
    type: String,
    enum: ["pending", "sending", "sent", "failed", "unknown", "suppressed"],
    required: true,
    default: "pending",
    index: true
  },
  attempts: { type: Number, default: 0, min: 0 },
  claimedAt: { type: Date, default: null },
  sentAt: { type: Date, default: null },
  providerMessageId: { type: String, default: "", select: false },
  lastErrorCode: { type: String, default: "" },
  manualRetryBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  manualRetryAt: { type: Date, default: null }
}, { timestamps: true });

landlordOnboardingFollowupSchema.index({ user: 1, campaign: 1 }, { unique: true });
landlordOnboardingFollowupSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model("LandlordOnboardingFollowup", landlordOnboardingFollowupSchema);
