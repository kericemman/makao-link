const OrganizationMembership = require("../organizations/organizationMembership.model");
const PropertyMandate = require("../organizations/propertyMandate.model");
const Organization = require("../organizations/organization.model");

const effectiveRoles = (user) => [...new Set([...(Array.isArray(user?.roles) ? user.roles : []), user?.role].filter(Boolean))];
const hasRole = (user, ...roles) => roles.some((role) => effectiveRoles(user).includes(role));

const isActiveMandate = (mandate, now = new Date()) => Boolean(
  mandate && mandate.status === "active" && mandate.startsAt <= now && (!mandate.expiresAt || mandate.expiresAt > now)
);

const ASSIGNABLE_GLOBAL_ROLES = new Set(["user", "tenant", "landlord", "landlord_staff", "service_provider", "agent", "app_manager"]);
const canGrantRoles = (actor, roles) => hasRole(actor, "admin") && Array.isArray(roles) && roles.length > 0 && roles.every((role) => ASSIGNABLE_GLOBAL_ROLES.has(role));

const canAccessListing = async ({ user, listing, permission, now = new Date(), MembershipModel = OrganizationMembership, MandateModel = PropertyMandate, OrganizationModel = Organization }) => {
  if (!user || !listing || !permission) return false;
  if (hasRole(user, "admin")) return true;
  if (hasRole(user, "landlord") && String(listing.landlord?._id || listing.landlord) === String(user._id)) return true;

  let existingOrganizationMembership = null;
  if (listing.organization) {
    const organization = await OrganizationModel.findById(listing.organization).select("status").lean();
    if (!organization || organization.status !== "active") return false;
    existingOrganizationMembership = await MembershipModel.findOne({ organization: listing.organization, user: user._id }).lean();
    const branchScope = listing.branch
      ? { $or: [{ scope: "organization" }, { scope: "branches", branchIds: listing.branch }] }
      : { scope: "organization" };
    const membership = existingOrganizationMembership?.status === "active" &&
      existingOrganizationMembership.permissions?.includes(permission) &&
      (branchScope.scope === "organization" || existingOrganizationMembership.scope === "organization" ||
        (existingOrganizationMembership.scope === "branches" && existingOrganizationMembership.branchIds?.some((id) => String(id) === String(listing.branch))))
      ? existingOrganizationMembership
      : null;
    if (membership && (membership.role !== "agent" || String(listing.assignedAgent || "") === String(user._id))) return true;
  }

  const mandateScope = [{ listing: listing._id }];
  if (listing.organization) mandateScope.push({ scope: "organization", organization: listing.organization });
  const mandate = await MandateModel.findOne({
    principal: listing.landlord?._id || listing.landlord,
    agent: user._id,
    status: "active",
    permissions: permission,
    $or: mandateScope,
    startsAt: { $lte: now },
    $and: [{ $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }]
  }).lean();
  if (isActiveMandate(mandate, now)) {
    if (mandate.scope !== "organization") return true;
    // An explicit inactive membership is a revocation signal; do not let an
    // organization-wide mandate override it (even if a stale/mocked query returns it).
    if (existingOrganizationMembership && existingOrganizationMembership.status !== "active") return false;
    const activeMembership = existingOrganizationMembership?.status === "active"
      ? existingOrganizationMembership
      : await MembershipModel.findOne({
        organization: mandate.organization,
        user: user._id,
        status: "active"
      }).lean();
    if (activeMembership) return true;
  }

  if (existingOrganizationMembership && existingOrganizationMembership.status !== "active") return false;

  // Preserve existing Premium/Pro team behavior until all legacy records are migrated.
  if (String(listing.assignedAgent || "") === String(user._id) && user.teamStatus === "active" && user.landlordOwner &&
      String(user.landlordOwner) === String(listing.landlord?._id || listing.landlord)) {
    const legacyPermission = permission.startsWith("listings:") ? "listings" : permission.startsWith("inquiries:") ? "inquiries" : null;
    return Boolean(legacyPermission && (user.teamPermissions || []).includes(legacyPermission));
  }
  return false;
};

module.exports = { canAccessListing, effectiveRoles, hasRole, isActiveMandate, canGrantRoles };
