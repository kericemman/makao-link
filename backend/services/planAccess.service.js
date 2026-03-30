const Subscription = require("../modules/subscriptions/subscription.model");
const Property = require("../modules/properties/property.model");
const plans = require("../modules/payments/plan.config");

const getLandlordPlanAccess = async (userId) => {
  const subscription = await Subscription.findOne({ user: userId });

  let planKey = "normal";
  let status = "active";
  let currentPeriodStart = null;
  let currentPeriodEnd = null;
  let gracePeriodEnd = null;

  if (subscription) {
    planKey = subscription.plan || "normal";
    status = subscription.status || "active";
    currentPeriodStart = subscription.currentPeriodStart || null;
    currentPeriodEnd = subscription.currentPeriodEnd || null;
    gracePeriodEnd = subscription.gracePeriodEnd || null;
  }

  const plan = plans[planKey] || plans.normal;

  const usedListings = await Property.countDocuments({
    landlord: userId
  });

  const remainingListings = Math.max(plan.listingLimit - usedListings, 0);

  let canCreateProperty = false;
  let reason = null;
  let message = null;

  if (status === "expired") {
    canCreateProperty = false;
    reason = "subscription_expired";
    message = "Your subscription has expired. Renew your plan to continue adding properties.";
  } else if (status === "cancelled") {
    // If current paid period still exists in future, you may optionally allow access.
    // For now, treat cancelled as active until currentPeriodEnd if still valid.
    if (currentPeriodEnd && currentPeriodEnd > new Date()) {
      canCreateProperty = usedListings < plan.listingLimit;
      if (!canCreateProperty) {
        reason = "listing_limit_reached";
        message = "You have reached your current listing limit. Upgrade your plan to add more properties.";
      }
    } else {
      canCreateProperty = false;
      reason = "subscription_cancelled";
      message = "Your subscription has been cancelled. Renew your plan to continue adding properties.";
    }
  } else if (status === "grace") {
    if (usedListings < plan.listingLimit) {
      canCreateProperty = true;
    } else {
      canCreateProperty = false;
      reason = "grace_limit_reached";
      message = "You are in grace period and have reached your plan limit. Renew your subscription to keep growing.";
    }
  } else {
    if (usedListings < plan.listingLimit) {
      canCreateProperty = true;
    } else {
      canCreateProperty = false;
      reason = "listing_limit_reached";
      message = "You have reached your current listing limit. Upgrade your plan to add more properties.";
    }
  }

  const isOverdue = status === "grace";
  const isExpired = status === "expired";

  return {
    planKey,
    planName: plan.name,
    planPrice: plan.price,
    listingLimit: plan.listingLimit,
    status,
    usedListings,
    remainingListings,
    canCreateProperty,
    reason,
    message,
    isOverdue,
    isExpired,
    currentPeriodStart,
    currentPeriodEnd,
    gracePeriodEnd
  };
};

module.exports = {
  getLandlordPlanAccess
};