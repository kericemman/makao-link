const mongoose = require("mongoose");

const diagnosticEventSchema = new mongoose.Schema({
  diagnosticHash: { type: String, required: true, maxlength: 64 },
  diagnosticFields: { type: [{ type: String, maxlength: 160 }], required: true, default: [] },
  payloadBytes: { type: Number, required: true, min: 1, max: 65536 },
  expiresAt: { type: Date, required: true }
}, {
  timestamps: true,
  strict: "throw",
  collection: "whatchimp_diagnostic_events"
});

diagnosticEventSchema.index({ diagnosticHash: 1 }, { unique: true });
diagnosticEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const DiagnosticEvent = mongoose.models.WhatChimpDiagnosticEvent
  || mongoose.model("WhatChimpDiagnosticEvent", diagnosticEventSchema);

module.exports = DiagnosticEvent;
module.exports.diagnosticEventSchema = diagnosticEventSchema;
