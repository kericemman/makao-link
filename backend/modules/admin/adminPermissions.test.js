const test = require("node:test");
const assert = require("node:assert/strict");
const {
  ADMIN_PERMISSION_KEYS,
  managerHasPermission,
  requiredAdminPermission
} = require("./adminPermissions");
const { hasAdminAccess } = require("../../middleware/adminAccess");
const { normalizePermissions } = require("./adminManager.controller");

test("admin permission catalogue accepts only known unique permissions", () => {
  assert.ok(ADMIN_PERMISSION_KEYS.includes("listings.review"));
  assert.ok(ADMIN_PERMISSION_KEYS.includes("traffic.read"));
  assert.deepEqual(normalizePermissions(["listings.review", "listings.review"]), ["listings.review"]);
  assert.equal(normalizePermissions(["admin"]), null);
  assert.equal(normalizePermissions("listings.read"), null);
});

test("manager permissions map only intended admin endpoints", () => {
  assert.equal(requiredAdminPermission({ method: "GET", originalUrl: "/api/admin/listings/pending" }), "listings.review");
  assert.equal(requiredAdminPermission({ method: "GET", originalUrl: "/api/admin/traffic" }), "traffic.read");
  assert.equal(requiredAdminPermission({ method: "PATCH", originalUrl: "/api/admin/listings/abc/approve" }), "listings.review");
  assert.equal(requiredAdminPermission({ method: "DELETE", originalUrl: "/api/admin/listings/abc/permanent" }), "listings.delete");
  assert.equal(requiredAdminPermission({ method: "PATCH", originalUrl: "/api/admin/listings/abc/trash" }), "listings.manage");
  assert.equal(requiredAdminPermission({ method: "PUT", originalUrl: "/api/settings" }), null);
  assert.equal(requiredAdminPermission({ method: "PUT", originalUrl: "/api/organizations/users/abc/roles" }), null);
  assert.equal(requiredAdminPermission({ method: "GET", originalUrl: "/api/admin/unknown" }), null);
});

test("manager access is permission-scoped and revocation is immediate", () => {
  const req = { method: "PATCH", originalUrl: "/api/admin/listings/abc/approve" };
  const manager = { role: "user", roles: ["admin_manager"], adminManagerStatus: "active", adminPermissions: ["listings.review"] };
  assert.equal(hasAdminAccess({ ...req, user: manager }, ["admin"]), true);
  assert.equal(hasAdminAccess({ ...req, user: { ...manager, adminPermissions: ["listings.read"] } }, ["admin"]), false);
  assert.equal(hasAdminAccess({ ...req, user: { ...manager, adminManagerStatus: "revoked" } }, ["admin"]), false);
  assert.equal(managerHasPermission({ ...manager, adminManagerStatus: "revoked" }, "listings.review"), false);
  assert.equal(hasAdminAccess({ ...req, user: { role: "admin", roles: ["admin"] } }, ["admin"]), true);
});

test("website traffic is visible only to managers with the traffic permission", () => {
  const req = { method: "GET", originalUrl: "/api/admin/traffic?range=30d" };
  const manager = { role: "user", roles: ["admin_manager"], adminManagerStatus: "active", adminPermissions: ["traffic.read"] };
  assert.equal(hasAdminAccess({ ...req, user: manager }, ["admin"]), true);
  assert.equal(hasAdminAccess({ ...req, user: { ...manager, adminPermissions: ["dashboard.read"] } }, ["admin"]), false);
});

test("only a super-admin can access unmapped privileged endpoints through the admin gate", () => {
  const req = { method: "POST", originalUrl: "/api/admin/managers" };
  const manager = { role: "admin_manager", roles: ["admin_manager"], adminManagerStatus: "active", adminPermissions: ["agents.manage"] };
  assert.equal(hasAdminAccess({ ...req, user: manager }, ["admin"]), false);
  assert.equal(hasAdminAccess({ ...req, user: { role: "admin", roles: ["admin"] } }, ["admin"]), true);
});
