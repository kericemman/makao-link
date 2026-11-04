const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  address: { type: String, trim: true, maxlength: 300, default: "" },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  businessName: { type: String, trim: true, maxlength: 160, default: "" },
  branches: { type: [branchSchema], default: [] },
  status: { type: String, enum: ["active", "suspended"], default: "active", index: true }
}, { timestamps: true });

organizationSchema.index({ owner: 1, name: 1 }, { unique: true });
module.exports = mongoose.model("Organization", organizationSchema);
