const test = require("node:test");
const assert = require("node:assert/strict");
const plans = require("./plan.config");
const { getPlanPricing, isPlanPaymentAmount } = require("./planPricing.service");

test("monthly landlord plan prices include 16 percent VAT", () => {
  assert.deepEqual(getPlanPricing(plans.basic), { baseAmount: 500, vatRate: 16, vatAmount: 80, totalAmount: 580 });
  assert.deepEqual(getPlanPricing(plans.premium), { baseAmount: 1500, vatRate: 16, vatAmount: 240, totalAmount: 1740 });
  assert.deepEqual(getPlanPricing(plans.pro), { baseAmount: 2500, vatRate: 16, vatAmount: 400, totalAmount: 2900 });
});

test("plan payment validation requires the VAT-inclusive KES total", () => {
  assert.equal(isPlanPaymentAmount(58000, "KES", plans.basic), true);
  assert.equal(isPlanPaymentAmount(50000, "KES", plans.basic), false);
  assert.equal(isPlanPaymentAmount(58000, "USD", plans.basic), false);
});
