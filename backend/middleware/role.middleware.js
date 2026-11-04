const { hasRole } = require("../modules/authorization/authorization.service");

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !hasRole(req.user, ...roles)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

module.exports = requireRole;
