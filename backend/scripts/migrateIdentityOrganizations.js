require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../modules/users/user.model");
const Organization = require("../modules/organizations/organization.model");
const Membership = require("../modules/organizations/organizationMembership.model");
const Listing = require("../modules/listings/listings.model");
const AuditRecord = require("../modules/authorization/auditRecord.model");
const { permissionsFromLegacyMember } = require("../modules/organizations/legacyWorkspace.service");

const apply = process.argv.includes("--apply");
const safeDatabaseName = (uri, env = process.env) => {
  if (env.NODE_ENV === "production" || env.RENDA_IDENTITY_MIGRATION_TARGET !== "staging" || !env.MONGO_URI_STAGING || uri !== env.MONGO_URI_STAGING || uri === env.MONGO_URI) {
    throw new Error("Identity migration is restricted to an explicitly selected staging target.");
  }
  let parsed;
  try {
    parsed = new URL(uri);
    if (!["mongodb:", "mongodb+srv:"].includes(parsed.protocol)) throw new Error("unsupported URI protocol");
    if (!parsed.username || !parsed.hostname) throw new Error("missing database identity");
  }
  catch { throw new Error("MONGO_URI_STAGING must identify an explicitly allowlisted staging database."); }
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!databaseName) {
    throw new Error("Refusing to connect: MONGO_URI_STAGING must include an explicit staging database name in its path.");
  }
  if (!/(^|[_-])(staging|stage|test|dev|local)([_-]|$)/i.test(databaseName)) {
    throw new Error("Refusing to connect: database name must clearly identify a non-production staging/test database.");
  }
  const allowedHosts = String(env.MONGO_STAGING_ALLOWED_HOSTS || "").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
  if (!allowedHosts.includes(parsed.hostname.toLowerCase())) {
    throw new Error("Refusing to connect: MongoDB host must exactly match MONGO_STAGING_ALLOWED_HOSTS.");
  }
  const expectedUser = String(env.MONGO_STAGING_DB_USER || "");
  let decodedUser;
  try { decodedUser = decodeURIComponent(parsed.username); } catch { decodedUser = ""; }
  if (!expectedUser || decodedUser !== expectedUser || !/(staging|stage|test)/i.test(expectedUser)) {
    throw new Error("Refusing to connect: URI must use the explicitly configured staging-only database user.");
  }
  return databaseName;
};
const permissionMap = {
  manager: ["listings:read", "listings:create", "listings:update", "listings:advertise", "inquiries:read", "inquiries:manage", "members:manage", "reports:read", "deals:manage"],
  agent: ["listings:read", "listings:update", "listings:advertise", "inquiries:read", "inquiries:manage", "deals:manage"],
  viewer: ["listings:read", "inquiries:read", "reports:read"]
};

async function main() {
  const databaseName = safeDatabaseName(process.env.MONGO_URI_STAGING, process.env);
  await mongoose.connect(process.env.MONGO_URI_STAGING);
  const users = await User.find({}).select("_id role roles landlordOwner teamRole teamPermissions teamStatus businessName name").lean();
  const landlords = users.filter((user) => user.role === "landlord");
  const staff = users.filter((user) => user.role === "landlord_staff" && user.landlordOwner);
  const organizationsToCreate = landlords.filter((owner) => staff.some((member) => String(member.landlordOwner) === String(owner._id)));

  const organizationPreview = await Promise.all(organizationsToCreate.map(async (owner) => ({
    ownerId: String(owner._id),
    legacyStaffCount: staff.filter((member) => String(member.landlordOwner) === String(owner._id)).length,
    existingOrganization: Boolean(await Organization.exists({ owner: owner._id })),
    listingsToAssociate: await Listing.countDocuments({ landlord: owner._id, organization: null })
  })));
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", target: "staging", databaseName, usersNeedingPrimaryRoleBackfill: users.filter((user) => !(user.roles || []).includes(user.role)).length, organizations: organizationPreview }, null, 2));
  if (!apply) return;

  for (const user of users) {
    if (user.role) await User.updateOne({ _id: user._id }, { $addToSet: { roles: user.role } });
  }
  for (const owner of organizationsToCreate) {
    const name = (owner.businessName || owner.name || "RendaHomes Workspace").trim().slice(0, 160);
    let organization = await Organization.findOne({ owner: owner._id }).sort({ createdAt: 1 });
    if (!organization) organization = await Organization.create({ name, businessName: owner.businessName || name, owner: owner._id });
    await Membership.updateOne(
      { organization: organization._id, user: owner._id },
      { $setOnInsert: { role: "owner", permissions: permissionMap.manager, scope: "organization", status: "active" } },
      { upsert: true }
    );
    await Listing.updateMany({ landlord: owner._id, organization: null }, { $set: { organization: organization._id } });
    for (const member of staff.filter((item) => String(item.landlordOwner) === String(owner._id))) {
      const memberStatus = member.teamStatus === "active" ? "active" : member.teamStatus === "invited" ? "invited" : "revoked";
      await Membership.updateOne(
        { organization: organization._id, user: member._id },
        { $setOnInsert: { role: member.teamRole === "manager" ? "branch_manager" : member.teamRole || "viewer", permissions: permissionsFromLegacyMember(member), scope: "organization", status: memberStatus } },
        { upsert: true }
      );
    }
    const dedupeKey = `identity-migration:organization:${organization._id}`;
    await AuditRecord.findOneAndUpdate(
      { dedupeKey },
      { $setOnInsert: { actor: null, actorType: "system", action: "identity_migration.organization_backfilled", resourceType: "organization", resourceId: String(organization._id), organization: organization._id, changes: { legacyOwnerId: String(owner._id), migratedStaffCount: staff.filter((item) => String(item.landlordOwner) === String(owner._id)).length }, dedupeKey } },
      { upsert: true, new: true }
    );
  }
  await Promise.all([User, Organization, Membership, Listing, AuditRecord].map((Model) => Model.createIndexes()));
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Identity/organization migration failed:", error.message);
    process.exitCode = 1;
  }).finally(async () => {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  });
}

module.exports = { safeDatabaseName };
