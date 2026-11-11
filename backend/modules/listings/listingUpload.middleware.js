const multer = require("multer");
const crypto = require("crypto");
const os = require("os");
const path = require("path");
const fs = require("fs");

const imageTypes = new Map([
  [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"], [".jfif", "image/jpeg"], [".png", "image/png"],
  [".webp", "image/webp"], [".avif", "image/avif"]
]);
const MAX_TOTAL_UPLOAD_BYTES = 38 * 1024 * 1024;
const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, os.tmpdir()),
  filename: (_req, file, callback) => callback(null, `renda-listing-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
});

const fileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (!imageTypes.has(extension) || imageTypes.get(extension) !== file.mimetype) {
    const error = new Error("Use a matching JPEG, PNG, WebP, or AVIF image file.");
    error.statusCode = 400;
    error.code = "UNSUPPORTED_FILE_TYPE";
    return callback(error, false);
  }
  if (Number(req.listingImageCount || 0) >= Number(req.maxListingImages || 15)) {
    const error = new Error(`Your plan allows up to ${req.maxListingImages || 15} images per listing.`);
    error.statusCode = 400;
    error.code = "LISTING_IMAGE_LIMIT";
    return callback(error, false);
  }
  req.listingImageCount = Number(req.listingImageCount || 0) + 1;
  callback(null, true);
};

const parser = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 30, fields: 60, parts: 100 },
  fileFilter
}).array("images", 30);

const getTotalUploadError = (files = []) => {
  const totalBytes = files.reduce((total, file) => total + Number(file.size || 0), 0);
  if (totalBytes <= MAX_TOTAL_UPLOAD_BYTES) return null;
  const error = new Error("The selected images are over the 38 MB total upload limit. Remove some images or select fewer images at a time.");
  error.statusCode = 413;
  error.code = "LISTING_UPLOAD_TOO_LARGE";
  return error;
};

module.exports = (req, res, next) => {
  parser(req, res, (error) => {
    if (error) return next(error);
    const cleanup = () => Promise.allSettled((req.files || []).map((file) => fs.promises.unlink(file.path)));
    const uploadError = getTotalUploadError(req.files || []);
    if (uploadError) {
      cleanup().finally(() => {
        next(uploadError);
      });
      return;
    }
    res.once("finish", cleanup);
    res.once("close", cleanup);
    next();
  });
};

module.exports.fileFilter = fileFilter;
module.exports.MAX_TOTAL_UPLOAD_BYTES = MAX_TOTAL_UPLOAD_BYTES;
module.exports.getTotalUploadError = getTotalUploadError;
