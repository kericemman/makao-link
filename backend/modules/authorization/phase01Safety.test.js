const test = require("node:test");
const assert = require("node:assert/strict");
const { safeDatabaseName } = require("../../scripts/migrateIdentityOrganizations");
const { permissionsForRole } = require("../organizations/organization.controller");
const { permissionsFromLegacyMember } = require("../organizations/legacyWorkspace.service");

test("identity migration refuses production and unmarked targets before connecting", () => {
  const uri = "mongodb://renda_staging_user:dummy@localhost/renda_staging";
  const stagingEnv = { MONGO_URI_STAGING: uri, RENDA_IDENTITY_MIGRATION_TARGET: "staging", MONGO_STAGING_ALLOWED_HOSTS: "localhost", MONGO_STAGING_DB_USER: "renda_staging_user" };
  const productionUri = "mongodb://renda_staging_user:dummy@localhost/renda_prod";
  assert.throws(() => safeDatabaseName(productionUri, { ...stagingEnv, MONGO_URI_STAGING: productionUri }), /Refusing to connect/);
  assert.throws(() => safeDatabaseName(uri, { ...stagingEnv, NODE_ENV: "production" }), /restricted/);
  assert.throws(() => safeDatabaseName(uri, {}), /restricted/);
  assert.throws(() => safeDatabaseName(uri, { ...stagingEnv, MONGO_URI: uri }), /restricted/);
  assert.throws(() => safeDatabaseName("http://localhost/renda_staging", { ...stagingEnv, MONGO_URI_STAGING: "http://localhost/renda_staging" }), /MONGO_URI/);
  const missingDatabase = "mongodb://renda_staging_user:dummy@localhost/";
  assert.throws(() => safeDatabaseName(missingDatabase, { ...stagingEnv, MONGO_URI_STAGING: missingDatabase }), /explicit staging database name/);
  assert.throws(() => safeDatabaseName(uri, { ...stagingEnv, MONGO_STAGING_ALLOWED_HOSTS: "prod.example.net" }), /host must exactly match/);
  assert.throws(() => safeDatabaseName(uri, { ...stagingEnv, MONGO_STAGING_DB_USER: "production_user" }), /staging-only/);
  assert.throws(() => safeDatabaseName("mongodb://production_user:dummy@localhost/renda_staging", { ...stagingEnv, MONGO_URI_STAGING: "mongodb://production_user:dummy@localhost/renda_staging" }), /staging-only/);
  assert.equal(safeDatabaseName(uri, stagingEnv), "renda_staging");
});

test("organization custom permissions cannot exceed the selected role", () => {
  assert.deepEqual(permissionsForRole("viewer", ["listings:read", "members:manage", "deals:manage"]), ["listings:read"]);
  assert.equal(permissionsForRole("admin", ["members:manage"]).includes("members:manage"), true);
});

test("empty legacy permission arrays retain historical role defaults", () => {
  assert.ok(permissionsFromLegacyMember({ teamRole: "agent", teamPermissions: [] }).includes("reports:read"));
  assert.ok(permissionsFromLegacyMember({ teamRole: "manager", teamPermissions: [] }).includes("members:manage"));
  assert.deepEqual(permissionsFromLegacyMember({ teamRole: "viewer", teamPermissions: ["listings"] }), ["listings:read"]);
});
