const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RendaAssistantConversation",
      required: true,
      index: true
    },
    channel: { type: String, enum: ["whatsapp", "mobile_app", "web"], required: true },
    sequence: { type: Number, required: true, min: 1 },
    direction: { type: String, enum: ["inbound", "outbound", "system"], required: true },
    contentType: { type: String, enum: ["text"], default: "text" },
    text: { type: String, required: true, trim: true, maxlength: 4000 },
    providerEventId: { type: String, trim: true, maxlength: 200, default: undefined },
    providerMessageId: { type: String, trim: true, maxlength: 200, default: undefined },
    deliveryStatus: {
      type: String,
      enum: ["received", "queued", "sent", "delivered", "read", "failed"],
      required: true
    },
    statusTimestamps: {
      sentAt: { type: Date, default: null },
      deliveredAt: { type: Date, default: null },
      readAt: { type: Date, default: null },
      failedAt: { type: Date, default: null }
    },
    failureCode: { type: String, trim: true, maxlength: 80, default: "" },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, sequence: 1 }, { unique: true });
messageSchema.index(
  { channel: 1, providerEventId: 1 },
  { unique: true, partialFilterExpression: { providerEventId: { $type: "string" } } }
);
messageSchema.index(
  { channel: 1, providerMessageId: 1 },
  { unique: true, partialFilterExpression: { providerMessageId: { $type: "string" } } }
);
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RendaAssistantMessage", messageSchema);
