const mongoose = require("mongoose");

const auditRecordSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  actorType: { type: String, enum: ["user", "system"], default: "user", required: true },
  action: { type: String, required: true, trim: true, maxlength: 100 },
  resourceType: { type: String, required: true, trim: true, maxlength: 80 },
  resourceId: { type: String, required: true, trim: true, maxlength: 120 },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null, index: true },
  changes: { type: mongoose.Schema.Types.Mixed, default: {} },
  requestId: { type: String, trim: true, maxlength: 120, default: "" },
  dedupeKey: { type: String, trim: true, maxlength: 180, default: undefined },
  ip: { type: String, trim: true, maxlength: 80, default: "" }
}, { timestamps: true, versionKey: false });

auditRecordSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
auditRecordSchema.index({ dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } });
module.exports = mongoose.model("AuthorizationAuditRecord", auditRecordSchema);
