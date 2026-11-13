const test = require("node:test");
const assert = require("node:assert/strict");
const { managerEmailConflict, normalizeOptionalManagerPhone } = require("./adminManager.controller");

test("admin manager phone remains optional and normalizes supplied Kenyan numbers", () => {
  assert.equal(normalizeOptionalManagerPhone(undefined), "");
  assert.equal(normalizeOptionalManagerPhone("  "), "");
  assert.equal(normalizeOptionalManagerPhone("+254 712 345 678"), "+254712345678");
  assert.throws(() => normalizeOptionalManagerPhone("0712345678"), /starting with \+254/);
});

test("new admin managers require a previously unused email; revoked managers can be reactivated", () => {
  assert.equal(managerEmailConflict(null), "");
  assert.match(managerEmailConflict({ role: "landlord", roles: ["landlord"] }), /already linked to a RendaHomes account/);
  assert.match(managerEmailConflict({ role: "admin", roles: ["admin"] }), /super admin/);
  assert.match(managerEmailConflict({ role: "admin_manager", adminManagerStatus: "active" }), /already an active admin manager/);
  assert.equal(managerEmailConflict({ role: "user", adminManagerStatus: "revoked" }), "");
});
