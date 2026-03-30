const plans = {
  normal: {
    name: "Normal",
    price: 0,
    listingLimit: 3,
    planCode: null
  },

  basic: {
    name: "Basic",
    price: 500,
    listingLimit: 5,
    planCode: process.env.PAYSTACK_BASIC_PLAN
  },

  premium: {
    name: "Premium",
    price: 1500,
    listingLimit: 15,
    planCode: process.env.PAYSTACK_PREMIUM_PLAN
  },

  pro: {
    name: "Pro",
    price: 2500,
    listingLimit: 100,
    planCode: process.env.PAYSTACK_PRO_PLAN
  }
};

module.exports = plans;