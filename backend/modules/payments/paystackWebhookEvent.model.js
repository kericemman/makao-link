const mongoose = require("mongoose");

const paystackWebhookEventSchema = new mongoose.Schema(
  {
    eventKey: { type: String, required: true, unique: true },
    eventType: { type: String, required: true },
    status: { type: String, enum: ["processing", "processed", "failed"], required: true },
    attempts: { type: Number, default: 1 },
    lockToken: { type: String, default: null },
    lockExpiresAt: { type: Date, default: null },
    processedAt: { type: Date, default: null },
    lastError: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaystackWebhookEvent", paystackWebhookEventSchema);
