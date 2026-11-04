const Subscription = require("../modules/subscriptions/subscription.model");

const listingImageLimit = async (req, _res, next) => {
  try {
    const ownerId = req.landlordOwnerId || req.landlordOwner?._id || req.user._id;
    const subscription = req.landlordSubscription || await Subscription.findOne({ user: ownerId }).select("plan status");
    req.maxListingImages = subscription?.plan !== "normal" && subscription?.status === "active" ? 30 : 15;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = listingImageLimit;
