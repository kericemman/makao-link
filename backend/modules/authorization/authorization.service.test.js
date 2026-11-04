const test = require("node:test");
const assert = require("node:assert/strict");
const { effectiveRoles, hasRole, isActiveMandate, canAccessListing, canGrantRoles } = require("./authorization.service");

test("legacy primary role is an effective role alongside explicit roles", () => {
  assert.deepEqual(effectiveRoles({ role: "user", roles: ["agent"] }), ["agent", "user"]);
  assert.equal(hasRole({ role: "user", roles: ["agent"] }, "agent"), true);
});

test("a missing or revoked mandate never authorizes a listing", async () => {
  const listing = { _id: "listing-1", landlord: "owner-1" };
  const MandateModel = { findOne: () => ({ lean: async () => ({ status: "revoked", startsAt: new Date(0), permissions: ["listings:update"] }) }) };
  assert.equal(await canAccessListing({ user: { _id: "agent-1", role: "agent" }, listing, permission: "listings:update", MembershipModel: { findOne: () => ({ lean: async () => null }) }, MandateModel }), false);
  assert.equal(isActiveMandate({ status: "revoked", startsAt: new Date(0) }), false);
});

test("listing ownership remains sufficient and is not inferred from another role", async () => {
  assert.equal(await canAccessListing({ user: { _id: "owner-1", role: "landlord" }, listing: { _id: "listing-1", landlord: "owner-1" }, permission: "listings:update" }), true);
  assert.equal(await canAccessListing({ user: { _id: "other-1", role: "tenant" }, listing: { _id: "listing-1", landlord: "owner-1" }, permission: "listings:update", MembershipModel: { findOne: () => ({ lean: async () => null }) }, MandateModel: { findOne: () => ({ lean: async () => null }) } }), false);
});

test("active, in-date mandates grant only their declared permission", async () => {
  const user = { _id: "agent-1", role: "agent" };
  const listing = { _id: "listing-1", landlord: "owner-1" };
  const MandateModel = { findOne: (query) => ({ lean: async () => query.permissions === "listings:update" ? ({ status: "active", startsAt: new Date(0), expiresAt: null }) : null }) };
  const args = { user, listing, permission: "listings:update", MembershipModel: { findOne: () => ({ lean: async () => null }) }, MandateModel };
  assert.equal(await canAccessListing(args), true);
  assert.equal(await canAccessListing({ ...args, permission: "listings:advertise" }), false);
});

test("organization members are restricted to active permission and branch scope", async () => {
  const user = { _id: "member-1", role: "user" };
  const listing = { _id: "listing-1", landlord: "owner-1", organization: "org-1", branch: "branch-1" };
  const MembershipModel = { findOne: (query) => ({ lean: async () => query.organization === "org-1" ? { role: "listing_editor", status: "active", scope: "branches", branchIds: ["branch-1"], permissions: ["listings:update"] } : null }) };
  const OrganizationModel = { findById: () => ({ select: () => ({ lean: async () => ({ status: "active" }) }) }) };
  const noMandate = { findOne: () => ({ lean: async () => null }) };
  assert.equal(await canAccessListing({ user, listing, permission: "listings:update", MembershipModel, MandateModel: noMandate, OrganizationModel }), true);
  assert.equal(await canAccessListing({ user, listing: { ...listing, organization: "other-org" }, permission: "listings:update", MembershipModel: { findOne: () => ({ lean: async () => null }) }, MandateModel: noMandate, OrganizationModel }), false);
});

test("company agents can access only properties explicitly assigned within their organization", async () => {
  const user = { _id: "agent-1", role: "user", roles: ["agent"] };
  const MembershipModel = { findOne: () => ({ lean: async () => ({ role: "agent", status: "active", scope: "organization", permissions: ["listings:update"] }) }) };
  const OrganizationModel = { findById: () => ({ select: () => ({ lean: async () => ({ status: "active" }) }) }) };
  const noMandate = { findOne: () => ({ lean: async () => null }) };
  const base = { _id: "listing-1", landlord: "owner-1", organization: "org-1", branch: null };
  assert.equal(await canAccessListing({ user, listing: { ...base, assignedAgent: "agent-1" }, permission: "listings:update", MembershipModel, MandateModel: noMandate, OrganizationModel }), true);
  assert.equal(await canAccessListing({ user, listing: { ...base, assignedAgent: "someone-else" }, permission: "listings:update", MembershipModel, MandateModel: noMandate, OrganizationModel }), false);
});

test("revoked organization membership and non-admin role escalation are denied", async () => {
  const user = { _id: "member-1", role: "agent", roles: ["agent"] };
  const listing = { _id: "listing-1", landlord: "owner-1", organization: "org-1" };
  const revokedMembership = { findOne: () => ({ lean: async () => ({ role: "agent", status: "revoked", scope: "organization", permissions: ["listings:read"] }) }) };
  const noMandate = { findOne: () => ({ lean: async () => null }) };
  const OrganizationModel = { findById: () => ({ select: () => ({ lean: async () => ({ status: "active" }) }) }) };
  assert.equal(await canAccessListing({ user, listing, permission: "listings:read", MembershipModel: revokedMembership, MandateModel: noMandate, OrganizationModel }), false);
  assert.equal(canGrantRoles(user, ["admin"]), false);
  assert.equal(canGrantRoles({ _id: "admin-1", role: "admin" }, ["agent", "tenant"]), true);
  assert.equal(canGrantRoles({ _id: "admin-1", role: "admin" }, ["admin"]), false);
});

test("revoking membership also invalidates an organization-wide mandate", async () => {
  const user = { _id: "agent-1", role: "agent" };
  const listing = { _id: "listing-1", landlord: "owner-1", organization: "org-1" };
  const MembershipModel = { findOne: () => ({ lean: async () => ({ role: "agent", status: "revoked", scope: "organization", permissions: ["listings:read"] }) }) };
  const MandateModel = { findOne: () => ({ lean: async () => ({ status: "active", scope: "organization", organization: "org-1", startsAt: new Date(0), expiresAt: null }) }) };
  const OrganizationModel = { findById: () => ({ select: () => ({ lean: async () => ({ status: "active" }) }) }) };
  assert.equal(await canAccessListing({ user, listing, permission: "listings:read", MembershipModel, MandateModel, OrganizationModel }), false);
});
