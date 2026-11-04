import test from "node:test";
import assert from "node:assert/strict";
import { safeNextPath, safeRoleDestination, safeSignupDestination, userHasAnyRole } from "./navigation.js";

test("keeps an internal property request and its search criteria intact", () => {
  assert.equal(
    safeNextPath("/property-requests?purpose=rent&town=Westlands&maxPrice=45000"),
    "/property-requests?purpose=rent&town=Westlands&maxPrice=45000"
  );
});

test("rejects external, protocol-relative, backslash and malformed destinations", () => {
  for (const value of ["https://outside.example", "//outside.example", "/\\outside.example", "javascript:alert(1)", "not-a-path"]) {
    assert.equal(safeNextPath(value, "/fallback"), "/fallback");
  }
});

test("rejects destinations that exceed the URL bound", () => {
  assert.equal(safeNextPath(`/${"x".repeat(2048)}`, "/fallback"), "/fallback");
});

test("agent-only destinations survive sign-in only for an authorized agent role", () => {
  assert.equal(safeRoleDestination("/agent/marketplace", { role: "user" }, "/"), "/");
  assert.equal(safeRoleDestination("/agent/marketplace", { role: "user", roles: ["agent"] }, "/"), "/agent/marketplace");
  assert.equal(userHasAnyRole({ role: "user", roles: ["agent"] }, ["agent"]), true);
});

test("tenant signup does not retain an agent-only destination", () => {
  assert.equal(safeSignupDestination("/agent/marketplace"), "");
  assert.equal(safeSignupDestination("/property-requests?purpose=rent"), "/property-requests?purpose=rent");
});
