const Listing = require("../modules/listings/listings.model");
const User = require("../modules/users/user.model");
const Subscription = require("../modules/subscriptions/subscription.model");
const Organization = require("../modules/organizations/organization.model");
const OrganizationMembership = require("../modules/organizations/organizationMembership.model");
const { canAccessListing, hasRole } = require("../modules/authorization/authorization.service");

const listingAccess = (permission) => async (req, res, next) => {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!listing) return res.status(404).json({ message: "Listing not found." });
    if (!await canAccessListing({ user: req.user, listing, permission })) return res.status(403).json({ message: "You are not authorized for this property." });

    const ownerId = listing.landlord?._id || listing.landlord;
    const owner = String(ownerId) === String(req.user._id) ? req.user : await User.findById(ownerId).select("name email role roles");
    if (req.user.landlordOwner && String(req.user.landlordOwner) === String(ownerId)) {
      const legacySubscription = await Subscription.findOne({ user: ownerId });
      if (!legacySubscription || !["premium", "pro"].includes(legacySubscription.plan) || legacySubscription.status !== "active") {
        return res.status(403).json({ code: "ADVANCED_PLAN_REQUIRED", message: "An active Premium or Pro plan is required for company workspace access." });
      }
      req.landlordSubscription = legacySubscription;
    }
    if (listing.organization && !hasRole(req.user, "admin") && String(ownerId) !== String(req.user._id)) {
      const subscription = await Subscription.findOne({ user: ownerId });
      if (!subscription || !["premium", "pro"].includes(subscription.plan) || subscription.status !== "active") {
        return res.status(403).json({ code: "ADVANCED_PLAN_REQUIRED", message: "The organization workspace requires an active Premium or Pro plan." });
      }
      req.landlordSubscription = subscription;
    }
    req.authorizedListing = listing;
    req.landlordOwner = owner;
    req.landlordOwnerId = ownerId;
    if (listing.organization) {
      req.landlordOrganization = await Organization.findById(listing.organization);
      req.organizationMembership = await OrganizationMembership.findOne({ organization: listing.organization, user: req.user._id, status: "active" });
    }
    next();
  } catch (error) { next(error); }
};

module.exports = listingAccess;
