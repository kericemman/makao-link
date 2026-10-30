const { getLandlordOnboardingOptions } = require("../landlordOnboarding.service");

const landlordPlanTool = {
  type: "function",
  name: "get_landlord_plan_options",
  description: "Return current landlord plan prices, listing limits, secure registration URLs, and real terms/privacy URLs. Use this when a user asks how to list a property, choose a landlord plan, or begin landlord onboarding.",
  strict: true,
  parameters: {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: false
  }
};

const executeLandlordPlanTool = (name, args) => {
  if (name !== landlordPlanTool.name || !args || typeof args !== "object" || Array.isArray(args) || Object.keys(args).length) {
    throw new TypeError("Invalid landlord plan tool request");
  }
  return getLandlordOnboardingOptions();
};

module.exports = { executeLandlordPlanTool, landlordPlanTool };
