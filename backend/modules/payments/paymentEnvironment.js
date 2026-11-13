const getPaystackEnvironment = (secretKey = process.env.PAYSTACK_SECRET_KEY) => {
  if (typeof secretKey !== "string") return "unknown";
  if (secretKey.startsWith("sk_live_")) return "live";
  if (secretKey.startsWith("sk_test_")) return "test";
  return "unknown";
};

const getReportablePaymentFilter = (extra = {}) => ({
  ...extra,
  status: "success",
  paymentEnvironment: "live"
});

module.exports = { getPaystackEnvironment, getReportablePaymentFilter };
