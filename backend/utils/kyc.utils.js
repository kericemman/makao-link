const Subscription = require("../modules/subscriptions/subscription.model");
const Kyc = require("../modules/kyc/kyc.model");

const paidPlans = ["basic", "premium", "pro"];

const getUserSubscription = async (userId) => {
  return Subscription.findOne({ user: userId });
};

const isPaidUser = async (userId) => {
  const subscription = await getUserSubscription(userId);

  if (!subscription) return false;
  return paidPlans.includes(subscription.plan) && subscription.status === "active";
};

const getUserKyc = async (userId) => {
  return Kyc.findOne({ landlord: userId });
};

module.exports = {
  paidPlans,
  getUserSubscription,
  isPaidUser,
  getUserKyc
};