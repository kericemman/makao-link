exports.errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";
  const message =
    isProduction && statusCode >= 500
      ? "Server error"
      : err.message || "Server error";

  res.status(statusCode).json({
    success: false,
    message
  });
};
