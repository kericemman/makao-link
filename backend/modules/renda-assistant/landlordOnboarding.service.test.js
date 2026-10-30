const test = require("node:test");
const assert = require("node:assert/strict");
const plans = require("../payments/plan.config");
const { getLandlordOnboardingOptions, publicPlanCatalog } = require("./landlordOnboarding.service");

test("public plan catalog is derived from backend config and never exposes Paystack plan codes", () => {
  const catalog = publicPlanCatalog(plans);
  assert.deepEqual(catalog.map(({ key }) => key), ["normal", "basic", "premium", "pro"]);
  assert.equal(catalog.find(({ key }) => key === "basic").listingLimit, 7);
  assert.equal(catalog.find(({ key }) => key === "basic").price, plans.basic.price);
  assert.equal("paystackPlanCode" in catalog[1], false);
});

test("assistant onboarding options use safe public signup and legal URLs", () => {
  const options = getLandlordOnboardingOptions({
    landlordBaseUrl: "https://landlord.example/",
    publicBaseUrl: "https://www.example/"
  });
  assert.equal(options.plans.find(({ key }) => key === "pro").registrationUrl, "https://landlord.example/register?plan=pro");
  assert.equal(options.legal.termsUrl, "https://www.example/terms-of-service");
  assert.equal(options.legal.privacyUrl, "https://www.example/privacy-policy");
  assert.equal(options.payment.hostedCheckout, true);
});

test("plan catalog fails closed if Basic is no longer configured for seven listings", () => {
  assert.throws(() => publicPlanCatalog({ ...plans, basic: { ...plans.basic, listingLimit: 5 } }), /up to 7/);
});
