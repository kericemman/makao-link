exports.errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";
  const uploadStatus = err.name === "MulterError"
    ? err.code === "LIMIT_FILE_SIZE" ? 413 : 400
    : null;
  const statusCode = err.statusCode || uploadStatus || err.status || 500;
  const isListingUploadRequest = req.path === "/api/listings"
    || /^\/api\/listings\/[^/]+$/.test(req.path || "")
    || req.path === "/api/admin/assisted-listing-drafts";
  if (err.code === "ASSISTANT_RESPONSE_INCOMPLETE") {
    console.error("Renda Assistant response incomplete", { stage: err.stage, reason: err.reason });
  } else if (statusCode >= 500) console.error(err);

  const uploadMessages = {
    LIMIT_FILE_SIZE: isListingUploadRequest
      ? "One image is larger than the 10 MB file limit. Select a smaller image or reduce the image size and try again."
      : "An uploaded file is larger than the 10 MB file limit. Choose a smaller file and try again.",
    LIMIT_FILE_COUNT: isListingUploadRequest
      ? "This upload contains too many images. Remove images and stay within your plan limit of 15 or 30 per listing."
      : "This upload contains too many files. Remove some files and try again.",
    LIMIT_UNEXPECTED_FILE: isListingUploadRequest
      ? "The upload contains an unsupported file field or too many images. Select JPEG, PNG, WebP, or AVIF images and stay within your plan limit."
      : "The upload contains an unexpected file. Check the form and try again.",
    ...(isListingUploadRequest ? {
      LISTING_UPLOAD_TOO_LARGE: "The selected images are over the 38 MB total upload limit. Remove some images or select fewer images at a time.",
      LISTING_IMAGE_LIMIT: err.message,
      UNSUPPORTED_FILE_TYPE: "One or more files are not supported. Use JPEG, PNG, WebP, or AVIF images.",
      INVALID_IMAGE_CONTENT: "An image's file contents do not match its file type. Re-export it as JPEG, PNG, WebP, or AVIF and upload it again."
    } : {})
  };
  const message = uploadMessages[err.code]
    || (isProduction && statusCode >= 500 ? "Server error" : err.message || "Server error");

  const response = {
    success: false,
    message
  };
  if (typeof err.code === "string") response.code = err.code;
  res.status(statusCode).json(response);
};
