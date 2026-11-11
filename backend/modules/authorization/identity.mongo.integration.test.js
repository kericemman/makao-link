require("dotenv").config();
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const express = require("express");
const http = require("node:http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { safeDatabaseName } = require("../../scripts/migrateIdentityOrganizations");
const { protect } = require("../../middleware/auth.middleware");
const listingAccess = require("../../middleware/listingAccess.middleware");
const organizationRoutes = require("../organizations/organization.routes");
const User = require("../users/user.model");
const Listing = require("../listings/listings.model");
const Organization = require("../organizations/organization.model");
const Membership = require("../organizations/organizationMembership.model");
const Mandate = require("../organizations/propertyMandate.model");
const Subscription = require("../subscriptions/subscription.model");
const AuditRecord = require("./auditRecord.model");

const uri = process.env.MONGO_URI_STAGING;
const runStagingIntegration = process.env.RUN_STAGING_INTEGRATION_TESTS === "true";

test("staging MongoDB and Express identity authorization integration", { skip: !runStagingIntegration ? "Set RUN_STAGING_INTEGRATION_TESTS=true to run staging database tests" : !uri && "MONGO_URI_STAGING is not configured" }, async (t) => {
  const databaseName = safeDatabaseName(uri, process.env);
  assert.ok(process.env.JWT_SECRET, "JWT_SECRET must be configured for route integration tests");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

  const id = crypto.randomUUID();
  const created = { users: [], listings: [], organizations: [], memberships: [], mandates: [], subscriptions: [] };
  const app = express();
  app.use(express.json());
  app.put("/integration/listings/:id", protect, listingAccess("listings:update"), (req, res) => res.status(204).end());
  app.use("/api/organizations", organizationRoutes);
  const server = http.createServer(app);

  const remember = async (collection, document) => {
    await document.save();
    created[collection].push(document._id);
    return document;
  };
  const makeUser = async (name, role, roles = [role]) => remember("users", new User({
    name,
    email: `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.${id}@integration.invalid`,
    phone: `+254700${crypto.randomInt(100000, 999999)}`,
    password: crypto.randomBytes(24).toString("hex"),
    role,
    roles
  }));
  const makeListing = async (landlord, extra = {}) => remember("listings", new Listing({
    title: `Integration fixture ${id}`,
    description: "Synthetic authorization integration fixture.",
    purpose: "rent",
    price: 25000,
    county: "nairobi",
    town: "westlands",
    type: "apartment",
    bedrooms: 2,
    bathrooms: 1,
    contactPhone: "+254700000000",
    landlord: landlord._id,
    ...extra
  }));
  const tokenFor = (user) => jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET, { expiresIn: "5m" });
  const request = async (path, token, body = {}) => fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });

    const owner = await makeUser("Owner", "landlord");
    const tenant = await makeUser("Tenant", "tenant", ["tenant", "user"]);
    const multiRoleAgent = await makeUser("MultiRoleAgent", "user", ["user", "agent"]);
    const companyOwner = await makeUser("CompanyOwner", "landlord");
    const companyEmployee = await makeUser("CompanyEmployee", "user", ["user", "agent"]);
    const admin = await makeUser("Admin", "admin");

    const ownedListing = await makeListing(owner);
    const mandatedListing = await makeListing(owner);
    const revokedListing = await makeListing(owner);
    const expiredListing = await makeListing(owner);

    const organization = await remember("organizations", new Organization({
      name: `Integration company ${id}`,
      owner: companyOwner._id,
      branches: [{ name: "East branch" }, { name: "West branch" }]
    }));
    const [east, west] = organization.branches;
    const companyListingEast = await makeListing(companyOwner, { organization: organization._id, branch: east._id });
    const companyListingWest = await makeListing(companyOwner, { organization: organization._id, branch: west._id });
    await remember("subscriptions", new Subscription({ user: companyOwner._id, plan: "pro", status: "active" }));
    const employeeMembership = await remember("memberships", new Membership({
      organization: organization._id,
      user: companyEmployee._id,
      role: "listing_editor",
      permissions: ["listings:update"],
      scope: "branches",
      branchIds: [east._id],
      status: "active"
    }));

    const grantMandate = (listing, values = {}) => remember("mandates", new Mandate({
      principal: owner._id,
      agent: multiRoleAgent._id,
      listing: listing._id,
      scope: "property",
      permissions: ["listings:update"],
      grantedBy: owner._id,
      ...values
    }));
    await grantMandate(mandatedListing);
    const revokedMandate = await grantMandate(revokedListing, { status: "revoked", revokedAt: new Date() });
    const expiredMandate = await grantMandate(expiredListing, { expiresAt: new Date(Date.now() - 60_000) });
    assert.ok(revokedMandate && expiredMandate);

    const ownerToken = tokenFor(owner);
    const tenantToken = tokenFor(tenant);
    const agentToken = tokenFor(multiRoleAgent);
    const employeeToken = tokenFor(companyEmployee);

    await t.test("tenant cannot edit another landlord property; owner can", async () => {
      assert.equal((await request(`/integration/listings/${ownedListing._id}`, tenantToken)).status, 403);
      assert.equal((await request(`/integration/listings/${ownedListing._id}`, ownerToken)).status, 204);
    });
    await t.test("multi-role agent can use an active mandate, but revoked and expired mandates fail", async () => {
      assert.equal((await request(`/integration/listings/${mandatedListing._id}`, agentToken)).status, 204);
      assert.equal((await request(`/integration/listings/${revokedListing._id}`, agentToken)).status, 403);
      assert.equal((await request(`/integration/listings/${expiredListing._id}`, agentToken)).status, 403);
    });
    await t.test("company employee is limited to assigned branch and revocation takes effect immediately", async () => {
      assert.equal((await request(`/integration/listings/${companyListingEast._id}`, employeeToken)).status, 204);
      assert.equal((await request(`/integration/listings/${companyListingWest._id}`, employeeToken)).status, 403);
      employeeMembership.status = "revoked";
      employeeMembership.revokedAt = new Date();
      await employeeMembership.save();
      assert.equal((await request(`/integration/listings/${companyListingEast._id}`, employeeToken)).status, 403);
    });
    await t.test("tenant cannot assign roles; even admin cannot grant a global admin role", async () => {
      const route = `/api/organizations/users/${tenant._id}/roles`;
      assert.equal((await request(route, tenantToken, { roles: ["landlord"] })).status, 403);
      assert.equal((await request(route, tokenFor(admin), { roles: ["admin"] })).status, 400);
    });
    await t.test("legacy landlord/team migration backfills only additive links and is repeat-safe", async () => {
      const legacyOwner = await makeUser("LegacyOwner", "landlord");
      const legacyStaff = await makeUser("LegacyStaff", "landlord_staff", ["landlord_staff"]);
      legacyStaff.landlordOwner = legacyOwner._id;
      legacyStaff.teamRole = "agent";
      legacyStaff.teamPermissions = ["listings", "inquiries"];
      legacyStaff.teamStatus = "active";
      await legacyStaff.save();
      const legacyListing = await makeListing(legacyOwner);
      await Promise.all([
        User.collection.updateOne({ _id: legacyOwner._id }, { $set: { roles: [] } }),
        User.collection.updateOne({ _id: legacyStaff._id }, { $set: { roles: [] } })
      ]);

      const migrationScript = path.resolve(__dirname, "../../scripts/migrateIdentityOrganizations.js");
      const runMigration = (applyMigration = false) => execFileSync(process.execPath, [migrationScript, ...(applyMigration ? ["--apply"] : [])], {
        cwd: path.resolve(__dirname, "../.."),
        env: process.env,
        encoding: "utf8",
        timeout: 45000,
        maxBuffer: 1024 * 1024
      });

      const preview = runMigration();
      assert.match(preview, /"usersNeedingPrimaryRoleBackfill":\s*2/);
      assert.match(preview, /"legacyStaffCount":\s*1/);
      assert.match(runMigration(true), /"mode":\s*"apply"/);

      const [migratedOwner, migratedStaff, migratedListing] = await Promise.all([
        User.findById(legacyOwner._id).lean(),
        User.findById(legacyStaff._id).lean(),
        Listing.findById(legacyListing._id).lean()
      ]);
      assert.ok(migratedOwner.roles.includes("landlord"));
      assert.ok(migratedStaff.roles.includes("landlord_staff"));
      assert.equal(String(migratedListing.landlord), String(legacyOwner._id));
      assert.ok(migratedListing.organization);

      const migratedOrganization = await Organization.findOne({ owner: legacyOwner._id });
      assert.ok(migratedOrganization);
      created.organizations.push(migratedOrganization._id);
      const migratedMemberships = await Membership.find({ organization: migratedOrganization._id });
      created.memberships.push(...migratedMemberships.map((membership) => membership._id));
      const migratedStaffMembership = migratedMemberships.find((membership) => String(membership.user) === String(legacyStaff._id));
      assert.equal(migratedStaffMembership?.role, "agent");
      assert.ok(migratedStaffMembership.permissions.includes("listings:update"));
      assert.ok(migratedStaffMembership.permissions.includes("inquiries:manage"));

      const migrationAudit = await AuditRecord.find({ organization: migratedOrganization._id, action: "identity_migration.organization_backfilled" }).select("_id").lean();
      assert.equal(migrationAudit.length, 1);
      assert.equal(migratedMemberships.length, 2);

      assert.match(runMigration(true), /"mode":\s*"apply"/);
      assert.equal(await Organization.countDocuments({ owner: legacyOwner._id }), 1);
      assert.equal(await Membership.countDocuments({ organization: migratedOrganization._id }), 2);
      assert.equal(await AuditRecord.countDocuments({ organization: migratedOrganization._id, action: "identity_migration.organization_backfilled" }), 1);
      assert.equal(await Listing.countDocuments({ landlord: legacyOwner._id, organization: null }), 0);

      const repeatedPreview = runMigration();
      assert.match(repeatedPreview, /"usersNeedingPrimaryRoleBackfill":\s*0/);
      assert.match(repeatedPreview, /"existingOrganization":\s*true/);
      assert.match(repeatedPreview, /"listingsToAssociate":\s*0/);
    });
  } finally {
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    const fixtureOrganizations = await Organization.find({ owner: { $in: created.users } }).select("_id").lean();
    const organizationIds = [...new Set([...created.organizations, ...fixtureOrganizations.map((organization) => organization._id)].map(String))];
    await Promise.all([
      User.deleteMany({ _id: { $in: created.users } }),
      Listing.deleteMany({ _id: { $in: created.listings } }),
      AuditRecord.deleteMany({ organization: { $in: organizationIds }, action: "identity_migration.organization_backfilled" }),
      Organization.deleteMany({ _id: { $in: organizationIds } }),
      Membership.deleteMany({ $or: [{ organization: { $in: organizationIds } }, { user: { $in: created.users } }] }),
      Mandate.deleteMany({ _id: { $in: created.mandates } }),
      Subscription.deleteMany({ _id: { $in: created.subscriptions } })
    ]);
    await mongoose.disconnect();
  }
  assert.ok(databaseName, "staging database was validated before any connection");
});
