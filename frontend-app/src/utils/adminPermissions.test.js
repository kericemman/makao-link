import test from "node:test";
import assert from "node:assert/strict";
import {
  canAccessAdminPath,
  getAdminHomePath,
  normalizeAdminPermissions
} from "./adminPermissions.js";

test("permission normalization safely rejects malformed values", () => {
  assert.deepEqual(normalizeAdminPermissions(["dashboard.read", 3, null]), ["dashboard.read"]);
  assert.deepEqual(normalizeAdminPermissions("dashboard.read"), []);
  assert.deepEqual(normalizeAdminPermissions({ includes: () => true }), []);
});

test("malformed manager permissions fail closed without crashing route checks", () => {
  const manager = {
    role: "admin_manager",
    roles: { admin: true },
    adminManagerStatus: "active",
    adminPermissions: { includes: () => true }
  };

  assert.equal(canAccessAdminPath(manager, "/admin/dashboard"), false);
  assert.equal(getAdminHomePath(manager), "/login");
});

test("valid manager permissions and super-admin access remain unchanged", () => {
  assert.equal(canAccessAdminPath({
    role: "admin_manager",
    adminManagerStatus: "active",
    adminPermissions: ["traffic.read"]
  }, "/admin/traffic"), true);

  assert.equal(canAccessAdminPath({ role: "admin" }, "/admin/managers"), true);
});
