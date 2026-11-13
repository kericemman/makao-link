const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getPaystackEnvironment,
  getReportablePaymentFilter
} = require("./paymentEnvironment");

test("classifies Paystack live and test secret key prefixes without exposing keys", () => {
  assert.equal(getPaystackEnvironment("sk_live_example"), "live");
  assert.equal(getPaystackEnvironment("sk_test_example"), "test");
});

test("fails closed for missing or unrecognized Paystack keys", () => {
  assert.equal(getPaystackEnvironment(""), "unknown");
  assert.equal(getPaystackEnvironment(undefined), "unknown");
  assert.equal(getPaystackEnvironment("secret-value"), "unknown");
});

test("reporting filter only selects successful live transactions", () => {
  assert.deepEqual(getReportablePaymentFilter({ paidAt: { $exists: true } }), {
    paidAt: { $exists: true },
    status: "success",
    paymentEnvironment: "live"
  });
});
