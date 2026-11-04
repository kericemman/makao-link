exports.errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";
  const uploadStatus = err.name === "MulterError"
    ? err.code === "LIMIT_FILE_SIZE" ? 413 : 400
    : null;
  const statusCode = err.statusCode || uploadStatus || err.status || 500;
  if (err.code === "ASSISTANT_RESPONSE_INCOMPLETE") {
    console.error("Renda Assistant response incomplete", { stage: err.stage, reason: err.reason });
  } else if (statusCode >= 500) console.error(err);

  const message =
    isProduction && statusCode >= 500
      ? "Server error"
      : err.message || "Server error";

  const response = {
    success: false,
    message
  };
  if (typeof err.code === "string") response.code = err.code;
  res.status(statusCode).json(response);
};
