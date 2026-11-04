const mongoose = require("mongoose");
const Organization = require("./organization.model");
const Membership = require("./organizationMembership.model");
const User = require("../users/user.model");
const Listing = require("../listings/listings.model");
const { recordAuthorizationChange } = require("../authorization/audit.service");
const { withAuthorizationTransaction } = require("../authorization/transaction.service");

const DEFAULT_PERMISSIONS = {
  admin: ["organization:manage", "members:manage", "listings:read", "listings:create", "listings:update", "listings:advertise", "inquiries:read", "inquiries:manage", "reports:read", "deals:manage"],
  branch_manager: ["listings:read", "listings:create", "listings:update", "listings:advertise", "inquiries:read", "inquiries:manage", "reports:read", "deals:manage"],
  agent: ["listings:read", "listings:update", "listings:advertise", "inquiries:read", "inquiries:manage", "deals:manage"],
  listing_editor: ["listings:read", "listings:create", "listings:update", "listings:advertise"],
  analyst: ["listings:read", "inquiries:read", "reports:read"],
  viewer: ["listings:read", "inquiries:read"]
};
const permissionsForRole = (role, requestedPermissions) => {
  const allowed = DEFAULT_PERMISSIONS[role] || [];
  return Array.isArray(requestedPermissions)
    ? [...new Set(requestedPermissions.filter((permission) => allowed.includes(permission)))]
    : allowed;
};

const getOwnedOrganization = async (req) => {
  if (!mongoose.isValidObjectId(req.params.organizationId)) return null;
  return Organization.findOne({ _id: req.params.organizationId, owner: req.user._id, status: "active" });
};

exports.createOrganization = async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name || name.length > 160) return res.status(400).json({ message: "A valid organization name is required." });
    const { organization, membership } = await withAuthorizationTransaction(async (session) => {
      const [createdOrganization] = await Organization.create([{ name, owner: req.user._id, businessName: req.user.businessName || name }], { session });
      await Listing.updateMany({ landlord: req.user._id, organization: null }, { $set: { organization: createdOrganization._id } }, { session });
      const [createdMembership] = await Membership.create([{ organization: createdOrganization._id, user: req.user._id, role: "owner", permissions: DEFAULT_PERMISSIONS.admin, scope: "organization" }], { session });
      await recordAuthorizationChange(req, { action: "organization.created", resourceType: "organization", resourceId: createdOrganization._id, organization: createdOrganization._id, session });
      return { organization: createdOrganization, membership: createdMembership };
    });
    res.status(201).json({ success: true, organization, membership });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "You already have an organization with that name." });
    next(error);
  }
};

exports.getMyOrganizations = async (req, res, next) => {
  try {
    const memberships = await Membership.find({ user: req.user._id, status: "active" }).populate("organization").lean();
    res.json({ success: true, organizations: memberships.map((membership) => ({ ...membership.organization, membership: { role: membership.role, permissions: membership.permissions, branchIds: membership.branchIds } })).filter((item) => item._id) });
  } catch (error) { next(error); }
};

exports.listMembers = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.organizationId)) return res.status(404).json({ message: "Organization not found." });
    const organization = await Organization.findOne({ _id: req.params.organizationId, status: "active" }).select("_id owner");
    if (!organization) return res.status(404).json({ message: "Organization not found." });
    const isOwner = String(organization.owner) === String(req.user._id);
    const requesterMembership = isOwner ? null : await Membership.findOne({ organization: organization._id, user: req.user._id, status: "active" }).select("permissions");
    if (!isOwner && !requesterMembership?.permissions.includes("members:manage")) {
      return res.status(403).json({ message: "You do not have permission to view organization members." });
    }
    const memberships = await Membership.find({ organization: organization._id, status: "active", role: { $ne: "owner" } })
      .populate({ path: "user", select: "_id name email role teamRole" })
      .sort({ createdAt: 1 }).lean();
    res.json({ success: true, members: memberships.filter((item) => item.user).map((item) => ({
      _id: item.user._id,
      name: item.user.name,
      email: item.user.email,
      role: item.role,
      status: item.status,
      scope: item.scope,
      branchIds: item.branchIds
    })) });
  } catch (error) { next(error); }
};

exports.addBranch = async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name || name.length > 100) return res.status(400).json({ message: "A valid branch name is required." });
    const organization = await withAuthorizationTransaction(async (session) => {
      const owned = await Organization.findOne({ _id: req.params.organizationId, owner: req.user._id, status: "active" }).session(session);
      if (!owned) return null;
      owned.branches.push({ name, address: String(req.body.address || "").trim().slice(0, 300) });
      await owned.save({ session });
      await recordAuthorizationChange(req, { action: "organization.branch_created", resourceType: "organization", resourceId: owned._id, organization: owned._id, session });
      return owned;
    });
    if (!organization) return res.status(404).json({ message: "Organization not found." });
    res.status(201).json({ success: true, branches: organization.branches });
  } catch (error) { next(error); }
};

exports.addMember = async (req, res, next) => {
  try {
    const organization = await getOwnedOrganization(req);
    if (!organization) return res.status(404).json({ message: "Organization not found." });
    const { userId, role } = req.body;
    if (!mongoose.isValidObjectId(userId) || !DEFAULT_PERMISSIONS[role]) return res.status(400).json({ message: "Choose an existing user and a supported organization role." });
    if (String(userId) === String(req.user._id)) return res.status(400).json({ message: "The organization owner is already a member." });
    const user = await User.findById(userId).select("_id role landlordOwner");
    if (!user) return res.status(404).json({ message: "User not found." });
    const scope = req.body.scope;
    const branchIds = req.body.branchIds || [];
    if (!["organization", "branches"].includes(scope) || (scope === "branches" && (!Array.isArray(branchIds) || !branchIds.length)) || (scope === "organization" && branchIds.length)) {
      return res.status(400).json({ message: "Choose organization-wide scope or provide one or more branch IDs." });
    }
    const validBranchIds = new Set(organization.branches.map((branch) => String(branch._id)));
    if (!Array.isArray(branchIds) || branchIds.some((id) => !validBranchIds.has(String(id)))) return res.status(400).json({ message: "One or more branches do not belong to this organization." });
    const permissions = permissionsForRole(role, req.body.permissions);
    const membership = await withAuthorizationTransaction(async (session) => {
      const previous = await Membership.findOne({ organization: organization._id, user: user._id }).session(session).lean();
      const updated = await Membership.findOneAndUpdate(
        { organization: organization._id, user: user._id },
        { $set: { role, permissions, scope, branchIds, status: "active", invitedBy: req.user._id, revokedAt: null } },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true, session }
      );
      if (user.role === "landlord_staff" && String(user.landlordOwner || "") === String(req.user._id)) {
        await User.updateOne({ _id: user._id }, { $set: { teamStatus: "active" } }, { session });
      }
      await recordAuthorizationChange(req, { action: "organization.member_activated", resourceType: "organization_membership", resourceId: updated._id, organization: organization._id, changes: { previous: previous ? { role: previous.role, permissions: previous.permissions, scope: previous.scope, status: previous.status } : null, userId: String(user._id), role, permissions, scope, branchIds }, session });
      return updated;
    });
    res.status(201).json({ success: true, membership });
  } catch (error) { next(error); }
};

exports.permissionsForRole = permissionsForRole;

exports.revokeMember = async (req, res, next) => {
  try {
    const result = await withAuthorizationTransaction(async (session) => {
      const organization = await Organization.findOne({ _id: req.params.organizationId, owner: req.user._id, status: "active" }).session(session);
      if (!organization) return null;
      const membership = await Membership.findOne({ _id: req.params.membershipId, organization: organization._id, status: "active", role: { $ne: "owner" } }).session(session);
      if (!membership) return null;
      membership.status = "revoked";
      membership.revokedAt = new Date();
      await membership.save({ session });
      const memberUser = await User.findById(membership.user).select("role landlordOwner").session(session);
      if (memberUser?.role === "landlord_staff" && String(memberUser.landlordOwner || "") === String(req.user._id)) {
        await User.updateOne({ _id: memberUser._id }, { $set: { teamStatus: "suspended" } }, { session });
      }
      await recordAuthorizationChange(req, { action: "organization.member_revoked", resourceType: "organization_membership", resourceId: membership._id, organization: organization._id, changes: { userId: String(membership.user) }, session });
      return { organization, membership };
    });
    if (!result) return res.status(404).json({ message: "Active organization membership not found." });
    const { membership } = result;
    res.json({ success: true, membership });
  } catch (error) { next(error); }
};

exports.attachListing = async (req, res, next) => {
  try {
    const ownedOrganization = await getOwnedOrganization(req);
    if (!ownedOrganization) return res.status(404).json({ message: "Organization not found." });
    if (!mongoose.isValidObjectId(req.params.listingId)) return res.status(404).json({ message: "Property not found." });
    const branchId = req.body.branchId || null;
    if (branchId && !ownedOrganization.branches.some((branch) => String(branch._id) === String(branchId) && branch.isActive)) {
      return res.status(400).json({ message: "Branch does not belong to this organization." });
    }
    const listing = await withAuthorizationTransaction(async (session) => {
      const updated = await Listing.findOneAndUpdate(
        { _id: req.params.listingId, landlord: req.user._id, isDeleted: { $ne: true } },
        { organization: ownedOrganization._id, branch: branchId },
        { new: true, session }
      );
      if (updated) await recordAuthorizationChange(req, { action: "organization.listing_attached", resourceType: "listing", resourceId: updated._id, organization: ownedOrganization._id, changes: { branchId }, session });
      return updated;
    });
    if (!listing) return res.status(404).json({ message: "Property not found in your account." });
    res.json({ success: true, listing });
  } catch (error) { next(error); }
};
