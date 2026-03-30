const Subscription = require("./subscription.model");
const Listing = require("../listings/listings.model");
const plans = require("../payments/plan.config");

exports.createInitialSubscription = async (userId, plan) => {
  let status = "free";

  if (plan !== "normal") {
    status = "pending_payment";
  }

  return Subscription.create({
    user: userId,
    plan,
    status
  });
};

exports.canCreateListing = async (user) => {
  const subscription = await Subscription.findOne({ user: user._id });

  if (!subscription) {
    return { allowed: false, message: "Subscription not found" };
  }

  if (subscription.status === "pending_payment") {
    return { allowed: false, message: "Complete your payment to start listing properties" };
  }

  if (subscription.status === "grace") {
    return { allowed: false, message: "Your account is in grace period. Renew to add new listings." };
  }

  if (subscription.status === "expired" || subscription.status === "cancelled") {
    return { allowed: false, message: "Your subscription is inactive. Renew to continue listing." };
  }

  const planConfig = plans[subscription.plan];
  const activeCount = await Listing.countDocuments({
    landlord: user._id,
    isActive: true,
    availability: "available"
  });

  if (activeCount >= planConfig.listingLimit) {
    return {
      allowed: false,
      message: `You have reached your ${planConfig.name} plan limit. Upgrade to add more listings.`
    };
  }

  return { allowed: true, subscription };
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

exports.restoreListingsAfterRenewal = async (userId, plan) => {
  const planConfig = plans[plan];

  const listings = await Listing.find({
    landlord: userId,
    unlistReason: "expired_subscription"
  }).sort({ createdAt: -1 });

  const toRestore = listings.slice(0, planConfig.listingLimit);

  const ids = toRestore.map((item) => item._id);

  if (ids.length > 0) {
    await Listing.updateMany(
      { _id: { $in: ids } },
      {
        isActive: true,
        unlistReason: null
      }
    );
  }
};