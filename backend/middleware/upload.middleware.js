const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: ["documentFront", "documentBack", "selfiePhoto", "proofOfOwnership"].includes(file.fieldname)
      ? "rendahomes/kyc"
      : file.fieldname === "avatar"
        ? "rendahomes/avatars"
        : "rendahomes/listings",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "jfif", "png", "webp", "avif"]
  })
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/avif"
  ]);

  if (allowedMimeTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

module.exports = upload;
