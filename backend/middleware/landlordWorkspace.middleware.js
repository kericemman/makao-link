const User = require("../modules/users/user.model");
const Subscription = require("../modules/subscriptions/subscription.model");

const ROLE_PERMISSIONS = {
  manager: ["listings", "inquiries", "team", "reports", "deals"],
  agent: ["listings", "inquiries", "reports", "deals"],
  viewer: ["listings", "inquiries", "reports"]
};

const landlordWorkspace = (permission) => async (req, res, next) => {
  try {
    if (req.user?.role === "landlord") {
      req.landlordOwner = req.user;
      req.landlordOwnerId = req.user._id;
      req.landlordTeamPermissions = ["listings", "inquiries", "team", "reports", "deals"];
      return next();
    }

    if (req.user?.role !== "landlord_staff" || req.user.teamStatus !== "active" || !req.user.landlordOwner) {
      return res.status(403).json({ message: "Active landlord workspace access is required." });
    }

    const owner = await User.findOne({ _id: req.user.landlordOwner, role: "landlord" }).select("name email role");
    if (!owner) return res.status(403).json({ message: "The company workspace is unavailable." });

    const subscription = await Subscription.findOne({ user: owner._id });
    if (!subscription || !["premium", "pro"].includes(subscription.plan) || subscription.status !== "active") {
      return res.status(403).json({ code: "ADVANCED_PLAN_REQUIRED", message: "An active Premium or Pro plan is required for company team access." });
    }

    const permissions = req.user.teamPermissions?.length
      ? req.user.teamPermissions
      : ROLE_PERMISSIONS[req.user.teamRole] || [];
    if (permission && !permissions.includes(permission)) {
      return res.status(403).json({ message: "Your company role does not allow this action." });
    }
    if (req.user.teamRole === "viewer" && req.method !== "GET") {
      return res.status(403).json({ message: "Viewer access is read-only." });
    }

    req.landlordOwner = owner;
    req.landlordOwnerId = owner._id;
    req.landlordSubscription = subscription;
    req.landlordTeamPermissions = permissions;
    next();
  } catch (error) {
    next(error);
  }
};

landlordWorkspace.rolePermissions = ROLE_PERMISSIONS;
module.exports = landlordWorkspace;
