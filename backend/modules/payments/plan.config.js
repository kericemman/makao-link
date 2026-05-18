module.exports = {
  normal: {
    name: "Normal",
    price: 0,
    listingLimit: 2,
    paystackPlanCode: null
  },

  basic: {
    name: "Basic",
    price: 500,
    listingLimit: 7,
    paystackPlanCode: process.env.PAYSTACK_BASIC_PLAN
  },

  premium: {
    name: "Premium",
    price: 1500,
    listingLimit: 15,
    paystackPlanCode: process.env.PAYSTACK_PREMIUM_PLAN
  },

  pro: {
    name: "Pro",
    price: 2500,
    listingLimit: 50,
    paystackPlanCode: process.env.PAYSTACK_PRO_PLAN
  }
};