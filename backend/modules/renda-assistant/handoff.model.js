const mongoose = require("mongoose");

const handoffSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "RendaAssistantConversation", required: true },
  reason: { type: String, enum: ["user_requested", "assistant_escalation"], required: true },
  status: { type: String, enum: ["pending", "claimed", "resolved"], default: "pending", index: true },
  requestedAt: { type: Date, required: true },
  resolvedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true }
}, { timestamps: true, strict: "throw" });

handoffSchema.index({ conversation:  1, status: 1 });
handoffSchema.index({ conversation: 1 }, { unique: true, partialFilterExpression: { status: "pending" } });
handoffSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RendaAssistantHandoff", handoffSchema);
