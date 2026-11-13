const { hasRole } = require("../modules/authorization/authorization.service");
const { isAdminManager, managerHasPermission, requiredAdminPermission } = require("../modules/admin/adminPermissions");

const hasAdminAccess = (req, roles) => {
  if (hasRole(req.user, ...roles)) return true;
  return roles.includes("admin") && isAdminManager(req.user) &&
    managerHasPermission(req.user, requiredAdminPermission(req));
};

const sendDenied = (res) => res.status(403).json({ message: "You do not have permission to access this resource" });

module.exports = { hasAdminAccess, sendDenied };
