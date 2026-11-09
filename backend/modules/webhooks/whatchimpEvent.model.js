const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  kind: { type: String, enum: ["message"], required: true, default: "message", index: true },
  messageIdHash: { type: String, maxlength: 64, default: undefined },
  contactId: { type: String, maxlength: 160, select: false },
  text: { type: String, maxlength: 4000, select: false },
  occurredAt: { type: Date, default: undefined },
  status: { type: String, enum: ["queued", "processing", "processed", "failed", "dead"], required: true, default: "queued", index: true },
  attempts: { type: Number, default: 0, min: 0 },
  nextAttemptAt: { type: Date, default: Date.now, index: true },
  processingStartedAt: { type: Date, default: null },
  lastErrorCode: { type: String, maxlength: 80, default: "" },
  expiresAt: { type: Date, required: true }
}, { timestamps: true, strict: "throw" });

eventSchema.index({ messageIdHash: 1 }, { unique: true, partialFilterExpression: { messageIdHash: { $type: "string" } } });
eventSchema.index({ status: 1, nextAttemptAt: 1, createdAt: 1 });
eventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const createEventModel = (connection) => connection.models.WhatChimpWebhookEvent
  || connection.model("WhatChimpWebhookEvent", eventSchema);

module.exports = { createEventModel, eventSchema };
