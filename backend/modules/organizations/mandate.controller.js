const mongoose = require("mongoose");
const Listing = require("../listings/listings.model");
const User = require("../users/user.model");
const Organization = require("./organization.model");
const Membership = require("./organizationMembership.model");
const Mandate = require("./propertyMandate.model");
const { hasRole } = require("../authorization/authorization.service");
const { recordAuthorizationChange } = require("../authorization/audit.service");
const { withAuthorizationTransaction } = require("../authorization/transaction.service");

const allowedPermissions = new Set(["listings:read", "listings:update", "listings:advertise", "inquiries:read", "inquiries:manage"]);

exports.grantMandate = async (req, res, next) => {
  try {
    const { agentId, listingId, organizationId, permissions, expiresAt } = req.body;
    if (!mongoose.isValidObjectId(agentId) || !Array.isArray(permissions) || !permissions.length || permissions.some((permission) => !allowedPermissions.has(permission))) {
      return res.status(400).json({ message: "Agent and valid mandate permissions are required." });
    }
    const agent = await User.findById(agentId);
    if (!agent || !hasRole(agent, "agent") || agent.agentStatus === "suspended") return res.status(400).json({ message: "Choose an active agent account." });

    let organization = null;
    if (organizationId) {
      if (!mongoose.isValidObjectId(organizationId)) return res.status(400).json({ message: "Invalid organization." });
      organization = await Organization.findOne({ _id: organizationId, owner: req.user._id, status: "active" });
      if (!organization) return res.status(404).json({ message: "Organization not found." });
    }

    let listing = null;
    if (listingId) {
      if (!mongoose.isValidObjectId(listingId)) return res.status(400).json({ message: "Invalid property." });
      listing = await Listing.findOne({ _id: listingId, landlord: req.user._id, isDeleted: { $ne: true } }).select("_id landlord organization");
      if (!listing) return res.status(404).json({ message: "Property not found in your account." });
      if (organization && listing.organization && String(listing.organization) !== String(organization._id)) return res.status(400).json({ message: "Property belongs to another organization." });
    }
    if (!listing && !organization) return res.status(400).json({ message: "Specify a property or an organization for this mandate." });
    if (organization && !await Membership.exists({ organization: organization._id, user: agent._id, status: "active" })) {
      return res.status(400).json({ message: "Organization-wide mandates require the agent to be an active organization member." });
    }
    const expiration = expiresAt ? new Date(expiresAt) : null;
    if (expiration && (!Number.isFinite(expiration.getTime()) || expiration <= new Date())) return res.status(400).json({ message: "Mandate expiry must be in the future." });

    const mandate = await withAuthorizationTransaction(async (session) => {
      const [created] = await Mandate.create([{
        principal: req.user._id,
        organization: organization?._id || listing?.organization || null,
        agent: agent._id,
        listing: listing?._id || null,
        scope: listing ? "property" : "organization",
        permissions: [...new Set(permissions)],
        grantedBy: req.user._id,
        expiresAt: expiration
      }], { session });
      if (listing) await Listing.updateOne({ _id: listing._id, landlord: req.user._id }, { $set: { advertisingMandate: created._id } }, { session });
      await recordAuthorizationChange(req, { action: "property_mandate.granted", resourceType: "property_mandate", resourceId: created._id, organization: organization?._id || null, changes: { agentId: String(agent._id), listingId: listing?._id ? String(listing._id) : null, permissions: created.permissions, expiresAt: expiration }, session });
      return created;
    });
    res.status(201).json({ success: true, mandate });
  } catch (error) { next(error); }
};

exports.getMyMandates = async (req, res, next) => {
  try {
    const filter = hasRole(req.user, "admin") ? {} : { $or: [{ principal: req.user._id }, { agent: req.user._id }] };
    const mandates = await Mandate.find(filter).sort({ createdAt: -1 }).populate("agent", "name email role roles").populate("listing", "title landlord").populate("organization", "name");
    res.json({ success: true, mandates });
  } catch (error) { next(error); }
};

exports.revokeMandate = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Mandate not found." });
    const mandate = await withAuthorizationTransaction(async (session) => {
      const active = await Mandate.findOne({ _id: req.params.id, principal: req.user._id, status: "active" }).session(session);
      if (!active) return null;
      active.status = "revoked";
      active.revokedAt = new Date();
      await active.save({ session });
      await Listing.updateOne({ _id: active.listing, advertisingMandate: active._id }, { $unset: { advertisingMandate: 1 } }, { session });
      await recordAuthorizationChange(req, { action: "property_mandate.revoked", resourceType: "property_mandate", resourceId: active._id, organization: active.organization, changes: { agentId: String(active.agent), listingId: active.listing ? String(active.listing) : null }, session });
      return active;
    });
    if (!mandate) return res.status(404).json({ message: "Active mandate not found." });
    res.json({ success: true, mandate });
  } catch (error) { next(error); }
};
