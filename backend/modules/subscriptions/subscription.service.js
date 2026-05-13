const Subscription = require("./subscription.model");
const Listing = require("../listings/listings.model");
const plans = require("../payments/plan.config");

exports.createInitialSubscription = async (userId, selectedPlan = "normal") => {
  const plan = plans[selectedPlan] ? selectedPlan : "normal";

  return Subscription.create({
    user: userId,
    plan,
    status: plan === "normal" ? "free" : "pending_payment"
  });
};

exports.canCreateListing = async (user) => {
  const subscription = await Subscription.findOne({ user: user._id });

  if (!subscription) {
    return {
      allowed: false,
      code: "NO_SUBSCRIPTION",
      message: "Subscription not found"
    };
  }

  if (subscription.status === "pending_payment") {
    return {
      allowed: false,
      code: "PAYMENT_REQUIRED",
      message: "Complete payment to start listing properties"
    };
  }

  if (subscription.status === "grace") {
    return {
      allowed: false,
      code: "GRACE_PERIOD",
      message: "Your account is in grace period. Renew to add new listings."
    };
  }

  if (["expired", "cancelled"].includes(subscription.status)) {
    return {
      allowed: false,
      code: "SUBSCRIPTION_INACTIVE",
      message: "Your subscription is inactive. Renew to continue listing."
    };
  }

  const planConfig = plans[subscription.plan];

  if (!planConfig) {
    return {
      allowed: false,
      code: "INVALID_PLAN",
      message: "Invalid subscription plan"
    };
  }

  const activeListings = await Listing.countDocuments({
    landlord: user._id,
    isActive: true,
    availability: "available"
  });

  if (activeListings >= planConfig.listingLimit) {
    return {
      allowed: false,
      code: "LIMIT_REACHED",
      message: `You have reached your ${planConfig.name} plan limit. Upgrade to add more listings.`
    };
  }

  return {
    allowed: true,
    subscription,
    usage: {
      used: activeListings,
      limit: planConfig.listingLimit,
      remaining: Math.max(planConfig.listingLimit - activeListings, 0)
    }
  };
};

exports.restoreListingsAfterRenewal = async (userId, plan) => {
  const planConfig = plans[plan];

  if (!planConfig) return;

  const listings = await Listing.find({
    landlord: userId,
    unlistReason: "expired_subscription"
  }).sort({ createdAt: -1 });

  const restoreIds = listings
    .slice(0, planConfig.listingLimit)
    .map((listing) => listing._id);

  if (!restoreIds.length) return;

  await Listing.updateMany(
    { _id: { $in: restoreIds } },
    {
      isActive: true,
      availability: "available",
      unlistReason: null
    }
  );
};

exports.markExpiredAndUnlist = async (subscription) => {
  subscription.status = "expired";
  await subscription.save();

  await Listing.updateMany(
    {
      landlord: subscription.user,
      isActive: true,
      availability: "available"
    },
    {
      isActive: false,
      unlistReason: "expired_subscription"
    }
  );
};