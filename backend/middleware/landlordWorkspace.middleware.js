const User = require("../modules/users/user.model");
const Subscription = require("../modules/subscriptions/subscription.model");
const { hasRole } = require("../modules/authorization/authorization.service");
const OrganizationMembership = require("../modules/organizations/organizationMembership.model");
const Organization = require("../modules/organizations/organization.model");

const permissionForRequest = (permission, method) => {
  if (permission === "listings") return method === "GET" ? "listings:read" : method === "POST" ? "listings:create" : "listings:update";
  if (permission === "inquiries") return method === "GET" ? "inquiries:read" : "inquiries:manage";
  if (permission === "team") return "members:manage";
  if (permission === "reports") return "reports:read";
  if (permission === "deals") return "deals:manage";
  return null;
};

const ROLE_PERMISSIONS = {
  manager: ["listings", "inquiries", "team", "reports", "deals"],
  agent: ["listings", "inquiries", "reports", "deals"],
  viewer: ["listings", "inquiries", "reports"]
};

const landlordWorkspace = (permission) => async (req, res, next) => {
  try {
    if (hasRole(req.user, "landlord") && req.user.role !== "landlord_staff") {
      req.landlordOwner = req.user;
      req.landlordOwnerId = req.user._id;
      req.landlordTeamPermissions = ["listings", "inquiries", "team", "reports", "deals"];
      const requestedOrganizationId = req.params.organizationId || req.query.organizationId || req.body?.organizationId;
      const organizations = await Organization.find({ owner: req.user._id, status: "active" }).sort({ createdAt: 1 });
      if (requestedOrganizationId) {
        req.landlordOrganization = organizations.find((organization) => String(organization._id) === String(requestedOrganizationId)) || null;
        if (!req.landlordOrganization) return res.status(404).json({ message: "Organization not found." });
      } else if (organizations.length === 1) {
        req.landlordOrganization = organizations[0];
      }
      return next();
    }

    const memberships = await OrganizationMembership.find({ user: req.user._id, status: "active" }).sort({ createdAt: 1 });
    const requestedOrganizationId = req.params.organizationId || req.query.organizationId;
    if (memberships.length > 1 && !requestedOrganizationId) {
      return res.status(409).json({ code: "ORGANIZATION_CONTEXT_REQUIRED", message: "Select an organization to continue." });
    }
    const membership = requestedOrganizationId
      ? memberships.find((item) => String(item.organization) === String(requestedOrganizationId))
      : memberships[0];
    if (requestedOrganizationId && !membership) return res.status(404).json({ message: "Organization membership not found." });
    if (membership) {
      const organization = await Organization.findOne({ _id: membership.organization, status: "active" });
      const owner = organization && await User.findOne({ _id: organization.owner, role: "landlord" }).select("name email role");
      if (!owner) return res.status(403).json({ message: "The organization workspace is unavailable." });
      const subscription = await Subscription.findOne({ user: owner._id });
      if (!subscription || !["premium", "pro"].includes(subscription.plan) || subscription.status !== "active") {
        return res.status(403).json({ code: "ADVANCED_PLAN_REQUIRED", message: "An active Premium or Pro plan is required for company workspace access." });
      }
      const requiredPermission = permissionForRequest(permission, req.method);
      if (membership.role === "viewer" && req.method !== "GET") {
        return res.status(403).json({ message: "Viewer access is read-only." });
      }
      if (requiredPermission && !membership.permissions.includes(requiredPermission)) {
        return res.status(403).json({ message: "Your organization role does not allow this action." });
      }
      req.landlordOwner = owner;
      req.landlordOwnerId = owner._id;
      req.landlordSubscription = subscription;
      req.landlordOrganization = organization;
      req.organizationMembership = membership;
      req.landlordTeamPermissions = membership.permissions;
      return next();
    }

    if (!hasRole(req.user, "landlord_staff") || req.user.teamStatus !== "active" || !req.user.landlordOwner) {
      return res.status(403).json({ message: "Active landlord workspace access is required." });
    }

    const owner = await User.findOne({ _id: req.user.landlordOwner, role: "landlord" }).select("name email role");
    if (!owner) return res.status(403).json({ message: "The company workspace is unavailable." });

    const legacyOrganization = await Organization.findOne({ owner: owner._id }).sort({ createdAt: 1 });
    if (legacyOrganization) {
      const formalMembership = await OrganizationMembership.findOne({ organization: legacyOrganization._id, user: req.user._id });
      if (formalMembership && formalMembership.status !== "active") {
        return res.status(403).json({ message: "Your organization membership is no longer active." });
      }
    }

    const subscription = await Subscription.findOne({ user: owner._id });
    if (!subscription || !["premium", "pro"].includes(subscription.plan) || subscription.status !== "active") {
      return res.status(403).json({ code: "ADVANCED_PLAN_REQUIRED", message: "An active Premium or Pro plan is required for company team access." });
    }

    const permissions = req.user.teamPermissions?.length
      ? req.user.teamPermissions
      : ROLE_PERMISSIONS[req.user.teamRole] || [];
    if (permission && !permissions.includes(permission)) {
      return res.status(403).json({ message: "Your company role does not allow this action." });
    }
    if (req.user.teamRole === "viewer" && req.method !== "GET") {
      return res.status(403).json({ message: "Viewer access is read-only." });
    }

    req.landlordOwner = owner;
    req.landlordOwnerId = owner._id;
    req.landlordSubscription = subscription;
    req.landlordTeamPermissions = permissions;
    next();
  } catch (error) {
    next(error);
  }
};

landlordWorkspace.rolePermissions = ROLE_PERMISSIONS;
module.exports = landlordWorkspace;
