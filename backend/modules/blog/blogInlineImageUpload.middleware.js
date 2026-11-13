const multer = require("multer");
const path = require("path");

const allowed = new Map([
  [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"], [".png", "image/png"],
  [".webp", "image/webp"], [".avif", "image/avif"]
]);

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 4, parts: 5 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowed.get(extension) !== file.mimetype.toLowerCase()) {
      const error = new Error("Use a matching JPEG, PNG, WebP, or AVIF image.");
      error.statusCode = 400;
      error.code = "UNSUPPORTED_FILE_TYPE";
      return callback(error, false);
    }
    callback(null, true);
  }
}).single("image");
