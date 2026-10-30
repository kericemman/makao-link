const mongoose = require("mongoose");

const statusNotificationSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "RendaAssistantConversation", required: true },
  eventKey: { type: String, required: true, trim: true, maxlength: 180 },
  eventType: {
    type: String,
    required: true,
    enum: ["listing_approved", "listing_rejected", "kyc_approved", "kyc_rejected", "subscription_active", "stay_requested", "stay_confirmed", "stay_declined", "stay_cancelled", "stay_completed"]
  },
  text: { type: String, required: true, trim: true, maxlength: 500 },
  status: { type: String, enum: ["awaiting_provider", "sent", "failed"], default: "awaiting_provider", index: true },
  providerMessageId: { type: String, trim: true, maxlength: 200, default: "" },
  expiresAt: { type: Date, required: true }
}, { timestamps: true, strict: "throw" });

statusNotificationSchema.index({ conversation: 1, eventKey: 1 }, { unique: true });
statusNotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RendaAssistantStatusNotification", statusNotificationSchema);
