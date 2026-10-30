const test = require("node:test");
const assert = require("node:assert/strict");
const { buildLegalAcceptance } = require("./legalAcceptance.service");

test("legal acceptance must be explicit and records server-built live policy URLs", () => {
  const acceptedAt = new Date("2026-10-29T10:00:00Z");
  assert.throws(() => buildLegalAcceptance({ acceptedLegalPolicies: "true" }), { statusCode: 400 });
  assert.deepEqual(buildLegalAcceptance({
    acceptedLegalPolicies: true,
    publicBaseUrl: "https://rendahomes.example/",
    now: acceptedAt
  }), {
    termsUrl: "https://rendahomes.example/terms-of-service",
    privacyUrl: "https://rendahomes.example/privacy-policy",
    acceptedAt
  });
});
