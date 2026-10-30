class LegalAcceptanceRequiredError extends Error {
  constructor() {
    super("Please accept the Terms of Service and Privacy Policy to create an account.");
    this.name = "LegalAcceptanceRequiredError";
    this.statusCode = 400;
  }
}

const buildLegalAcceptance = ({ acceptedLegalPolicies, publicBaseUrl = process.env.CLIENT_URL, now = new Date() } = {}) => {
  if (acceptedLegalPolicies !== true) throw new LegalAcceptanceRequiredError();
  const baseUrl = String(publicBaseUrl || "https://rendahomes.com").replace(/\/$/, "");
  return {
    termsUrl: `${baseUrl}/terms-of-service`,
    privacyUrl: `${baseUrl}/privacy-policy`,
    acceptedAt: now
  };
};

module.exports = { LegalAcceptanceRequiredError, buildLegalAcceptance };
