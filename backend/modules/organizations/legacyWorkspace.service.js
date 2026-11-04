const Organization = require("./organization.model");
const Membership = require("./organizationMembership.model");
const Listing = require("../listings/listings.model");

const mapLegacyPermissions = (permissions = []) => [...new Set(permissions.flatMap((permission) => ({
  listings: ["listings:read", "listings:create", "listings:update", "listings:advertise"],
  inquiries: ["inquiries:read", "inquiries:manage"],
  team: ["members:manage"],
  reports: ["reports:read"],
  deals: ["deals:manage"]
}[permission] || [])))];

const defaultLegacyPermissions = {
  manager: ["listings:read", "listings:create", "listings:update", "listings:advertise", "inquiries:read", "inquiries:manage", "members:manage", "reports:read", "deals:manage"],
  agent: ["listings:read", "listings:update", "listings:advertise", "inquiries:read", "inquiries:manage", "reports:read", "deals:manage"],
  viewer: ["listings:read", "inquiries:read", "reports:read"]
};
const permissionsFromLegacyMember = (member) => {
  const mapped = mapLegacyPermissions(member.teamPermissions);
  if (!mapped.length) return defaultLegacyPermissions[member.teamRole] || [];
  return member.teamRole === "viewer" ? mapped.filter((permission) => permission.endsWith(":read")) : mapped;
};

const ensureLegacyWorkspaceMembership = async (owner, member = owner, session = null) => {
  let organizationQuery = Organization.findOne({ owner: owner._id }).sort({ createdAt: 1 });
  if (session) organizationQuery = organizationQuery.session(session);
  let organization = await organizationQuery;
  if (!organization) {
    const input = { owner: owner._id, name: (owner.businessName || owner.name || "RendaHomes Workspace").trim().slice(0, 160), businessName: owner.businessName || "" };
    [organization] = session ? await Organization.create([input], { session }) : [await Organization.create(input)];
  }
  await Membership.updateOne(
    { organization: organization._id, user: owner._id },
    { $setOnInsert: { role: "owner", permissions: ["organization:manage", "members:manage", "listings:read", "listings:create", "listings:update", "listings:advertise", "inquiries:read", "inquiries:manage", "reports:read", "deals:manage"], scope: "organization", status: "active" } },
    { upsert: true, ...(session ? { session } : {}) }
  );
  if (String(owner._id) !== String(member._id)) {
    await Membership.findOneAndUpdate(
      { organization: organization._id, user: member._id },
      { $set: {
        role: member.teamRole === "manager" ? "branch_manager" : member.teamRole || "viewer",
        permissions: permissionsFromLegacyMember(member),
        scope: "organization",
        status: member.teamStatus === "active" ? "active" : member.teamStatus === "invited" ? "invited" : "revoked",
        revokedAt: member.teamStatus === "active" ? null : new Date()
      }, $setOnInsert: { invitedBy: owner._id } },
      { upsert: true, new: true, runValidators: true, ...(session ? { session } : {}) }
    );
  }
  await Listing.updateMany({ landlord: owner._id, organization: null }, { $set: { organization: organization._id } }, session ? { session } : {});
  return organization;
};

module.exports = { ensureLegacyWorkspaceMembership, mapLegacyPermissions, defaultLegacyPermissions, permissionsFromLegacyMember };
