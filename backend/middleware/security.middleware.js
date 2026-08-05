const createRateLimiter = ({ windowMs, max, message }) => {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const record = hits.get(key) || { count: 0, resetAt: now + windowMs };

    if (record.resetAt <= now) {
      record.count = 0;
      record.resetAt = now + windowMs;
    }

    record.count += 1;
    hits.set(key, record);

    if (record.count > max) {
      res.set("Retry-After", String(Math.ceil((record.resetAt - now) / 1000)));
      return res.status(429).json({
        success: false,
        message
      });
    }

    next();
  };
};

const hasUnsafeKey = (value) => {
  if (!value || typeof value !== "object") return false;

  return Object.keys(value).some((key) => {
    if (key.startsWith("$") || key.includes(".")) return true;
    return hasUnsafeKey(value[key]);
  });
};

const rejectUnsafeKeys = (req, res, next) => {
  if (hasUnsafeKey(req.body) || hasUnsafeKey(req.query) || hasUnsafeKey(req.params)) {
    return res.status(400).json({
      success: false,
      message: "Invalid request payload"
    });
  }

  next();
};

const generalApiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: "Too many requests. Please try again shortly."
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: "Too many authentication attempts. Please try again shortly."
});

const otpLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: "Too many verification attempts. Please request a new code later."
});

module.exports = {
  authLimiter,
  generalApiLimiter,
  otpLimiter,
  rejectUnsafeKeys
};
