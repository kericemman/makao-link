const mongoose = require("mongoose");

const ORG_ROLES = ["owner", "admin", "branch_manager", "agent", "listing_editor", "analyst", "viewer"];
const ORG_PERMISSIONS = ["organization:manage", "members:manage", "listings:read", "listings:create", "listings:update", "listings:advertise", "inquiries:read", "inquiries:manage", "reports:read", "deals:manage"];

const membershipSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  role: { type: String, enum: ORG_ROLES, required: true },
  permissions: { type: [String], enum: ORG_PERMISSIONS, default: [] },
  scope: { type: String, enum: ["organization", "branches"], default: "organization" },
  branchIds: [{ type: mongoose.Schema.Types.ObjectId }],
  status: { type: String, enum: ["active", "invited", "revoked"], default: "active", index: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  revokedAt: { type: Date, default: null }
}, { timestamps: true });

membershipSchema.index({ organization: 1, user: 1 }, { unique: true });
membershipSchema.index({ user: 1, status: 1 });
membershipSchema.statics.ORG_ROLES = ORG_ROLES;
membershipSchema.statics.ORG_PERMISSIONS = ORG_PERMISSIONS;
module.exports = mongoose.model("OrganizationMembership", membershipSchema);
