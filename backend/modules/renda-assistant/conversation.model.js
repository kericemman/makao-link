const mongoose = require("mongoose");

const searchStateSchema = new mongoose.Schema(
  {
    purpose: { type: String, enum: ["rent", "sale", "short_term", ""], default: "" },
    propertyType: { type: String, trim: true, maxlength: 60, default: "" },
    county: { type: String, trim: true, maxlength: 80, default: "" },
    town: { type: String, trim: true, maxlength: 80, default: "" },
    minPrice: { type: Number, min: 0, default: null },
    maxPrice: { type: Number, min: 0, default: null },
    bedrooms: { type: Number, min: 0, max: 30, default: null }
  },
  { _id: false }
);

const workflowSchema = new mongoose.Schema(
  {
    intent: {
      type: String,
      enum: ["unknown", "property_search", "list_property", "support"],
      default: "unknown"
    },
    step: { type: String, trim: true, maxlength: 60, default: "welcome" },
    search: { type: searchStateSchema, default: () => ({}) }
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    channel: { type: String, enum: ["whatsapp", "mobile_app", "web"], required: true, default: "whatsapp" },
    externalContactId: { type: String, required: true, trim: true, maxlength: 160 },
    mobileSessionTokenHash: { type: String, select: false, default: undefined },
    mobileSessionExpiresAt: { type: Date, default: null },
    webSessionTokenHash: { type: String, select: false, default: undefined },
    webSessionExpiresAt: { type: Date, default: null },
    linkedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    contactName: { type: String, trim: true, maxlength: 100, default: "" },
    contactEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: "" },
    accountLinkStatus: {
      type: String,
      enum: ["unlinked", "pending", "verified"],
      default: "unlinked"
    },
    linkChallengeHash: { type: String, select: false, default: undefined },
    linkChallengeExpiresAt: { type: Date, default: null },
    serviceConsent: { type: String, enum: ["unknown", "granted", "withdrawn"], default: "unknown" },
    updatesConsent: { type: String, enum: ["unknown", "granted", "withdrawn"], default: "unknown" },
    consentSource: { type: String, enum: ["user_message", "web", "mobile_app", ""], default: "" },
    consentPolicyVersion: { type: String, trim: true, maxlength: 40, default: "" },
    consentRecordedAt: { type: Date, default: null },
    workflow: { type: workflowSchema, default: () => ({}) },
    workflowRevision: { type: Number, default: 0, min: 0 },
    handoffStatus: { type: String, enum: ["none", "pending", "claimed", "resolved"], default: "none", index: true },
    handoffReason: { type: String, enum: ["", "user_requested", "assistant_escalation"], default: "" },
    handoffRequestedAt: { type: Date, default: null },
    messageSequence: { type: Number, default: 0, min: 0 },
    lastMessageAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

conversationSchema.index({ channel: 1, externalContactId: 1 }, { unique: true });
conversationSchema.index(
  { mobileSessionTokenHash: 1 },
  { unique: true, partialFilterExpression: { mobileSessionTokenHash: { $type: "string" } } }
);
conversationSchema.index(
  { webSessionTokenHash: 1 },
  { unique: true, partialFilterExpression: { webSessionTokenHash: { $type: "string" } } }
);
conversationSchema.index(
  { linkChallengeHash: 1 },
  { unique: true, partialFilterExpression: { linkChallengeHash: { $type: "string" } } }
);
conversationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RendaAssistantConversation", conversationSchema);
