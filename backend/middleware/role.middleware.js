const { hasAdminAccess, sendDenied } = require("./adminAccess");

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !hasAdminAccess(req, roles)) {
      return sendDenied(res);
    }
    next();
  };
};

module.exports = requireRole;
