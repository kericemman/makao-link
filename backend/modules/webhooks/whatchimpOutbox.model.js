const mongoose = require("mongoose");

const outboxSchema = new mongoose.Schema({
  idempotencyHash: { type: String, required: true, maxlength: 64 },
  recipient: { type: String, required: true, maxlength: 20, select: false },
  text: { type: String, required: true, maxlength: 4000, select: false },
  status: { type: String, enum: ["queued", "sending", "sent", "unknown", "failed"], default: "queued", required: true, index: true },
  attempts: { type: Number, default: 0, min: 0 },
  providerMessageId: { type: String, maxlength: 200, default: "" },
  failureCode: { type: String, maxlength: 80, default: "" },
  sendingStartedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true }
}, { timestamps: true, strict: "throw" });

outboxSchema.index({ idempotencyHash: 1 }, { unique: true });
outboxSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("WhatChimpOutboundMessage", outboxSchema);
