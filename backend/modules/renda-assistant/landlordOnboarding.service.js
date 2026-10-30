const plans = require("../payments/plan.config");

const publicPlanCatalog = (planConfig = plans) => {
  const entries = Object.entries(planConfig).map(([key, plan]) => {
    if (!plan || typeof plan.name !== "string" || !Number.isInteger(plan.price) || plan.price < 0 ||
        !Number.isInteger(plan.listingLimit) || plan.listingLimit < 1) {
      throw new TypeError(`Invalid public plan configuration: ${key}`);
    }
    return {
      key,
      name: plan.name,
      price: plan.price,
      currency: "KES",
      billingInterval: key === "normal" ? null : "monthly",
      listingLimit: plan.listingLimit
    };
  });

  const basic = entries.find((plan) => plan.key === "basic");
  if (!basic || basic.listingLimit !== 7) throw new TypeError("Basic plan must allow up to 7 active listings");
  return entries;
};

const getLandlordOnboardingOptions = ({ planConfig = plans, landlordBaseUrl, publicBaseUrl } = {}) => {
  const landlordBase = String(landlordBaseUrl || process.env.LANDLORD_CLIENT_URL || "https://landlord.rendahomes.com").replace(/\/$/, "");
  const publicBase = String(publicBaseUrl || process.env.CLIENT_URL || "https://rendahomes.com").replace(/\/$/, "");
  const catalog = publicPlanCatalog(planConfig);
  return {
    plans: catalog.map((plan) => ({
      ...plan,
      registrationUrl: `${landlordBase}/register?plan=${encodeURIComponent(plan.key)}`
    })),
    legal: {
      termsUrl: `${publicBase}/terms-of-service`,
      privacyUrl: `${publicBase}/privacy-policy`
    },
    payment: {
      provider: "Paystack",
      hostedCheckout: true,
      activation: "Payment status must be confirmed by RendaHomes before paid access is active."
    }
  };
};

module.exports = { getLandlordOnboardingOptions, publicPlanCatalog };
