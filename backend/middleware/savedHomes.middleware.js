const jwt = require("jsonwebtoken");
const User = require("../modules/users/user.model");
const { getSharedSessionToken } = require("../utils/sharedSession");

module.exports = async (req, res, next) => {
  let decoded;
  try {
    const bearerToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;
    const token = bearerToken || getSharedSessionToken(req);
    if (!token) return res.status(401).json({ message: "Sign in to save homes" });

    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Your session has expired. Sign in again to save homes" });
  }

  try {
    const user = await User.findById(decoded.id).select("-password");
    if (!user || !["user", "tenant", "agent"].includes(user.role)) {
      return res.status(403).json({ message: "Only user accounts can save homes" });
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
