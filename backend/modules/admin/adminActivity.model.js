const mongoose = require("mongoose");

const adminActivitySchema = new mongoose.Schema({
  eventType: { type: String, required: true, index: true },
  description: { type: String, required: true, trim: true },
  details: { type: String, trim: true, default: "" },
  path: { type: String, required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  actorName: { type: String, trim: true, default: "" },
  entityType: { type: String, trim: true, default: "" },
  entityId: { type: String, trim: true, default: "" },
  dedupeKey: { type: String, unique: true, sparse: true, index: true },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

adminActivitySchema.index({ createdAt: -1 });
adminActivitySchema.index({ readBy: 1, createdAt: -1 });

module.exports = mongoose.model("AdminActivity", adminActivitySchema);
