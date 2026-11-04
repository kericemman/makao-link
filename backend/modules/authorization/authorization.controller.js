const mongoose = require("mongoose");
const User = require("../users/user.model");
const { effectiveRoles, canGrantRoles } = require("./authorization.service");
const { recordAuthorizationChange } = require("./audit.service");
const { withAuthorizationTransaction } = require("./transaction.service");

exports.updateUserRoles = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.userId)) return res.status(404).json({ message: "User not found." });
    const roles = req.body.roles;
    if (!canGrantRoles(req.user, roles)) {
      return res.status(400).json({ message: "Roles must be a non-empty list of supported non-admin roles." });
    }
    const user = await withAuthorizationTransaction(async (session) => {
      const target = await User.findById(req.params.userId).session(session);
      if (!target) return null;
      const previousRoles = effectiveRoles(target);
      target.roles = [...new Set([...roles, target.role])];
      await target.save({ session });
      await recordAuthorizationChange(req, { action: "user.roles_updated", resourceType: "user", resourceId: target._id, changes: { previousRoles, roles: effectiveRoles(target) }, session });
      return target;
    });
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ success: true, user: { _id: user._id, role: user.role, roles: effectiveRoles(user) } });
  } catch (error) { next(error); }
};
