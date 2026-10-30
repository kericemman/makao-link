const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const kycFields = new Set(["documentFront", "documentBack", "selfiePhoto", "proofOfOwnership"]);
const kycDocumentFields = new Set(["documentFront", "documentBack", "proofOfOwnership"]);

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const isWordDocument = kycDocumentFields.has(file.fieldname) && extension === ".docx";

    return {
      folder: kycFields.has(file.fieldname)
        ? "rendahomes/kyc"
        : file.fieldname === "avatar"
          ? "rendahomes/avatars"
          : "rendahomes/listings",
      resource_type: isWordDocument ? "raw" : "image",
      ...(kycFields.has(file.fieldname) ? { type: "authenticated" } : {}),
      allowed_formats: isWordDocument
        ? ["docx"]
        : ["jpg", "jpeg", "jfif", "png", "webp", "avif", ...(kycDocumentFields.has(file.fieldname) ? ["pdf"] : [])],
      ...(isWordDocument ? { public_id: () => `${crypto.randomUUID()}.docx` } : {})
    };
  }
});

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();
  const imageMimeByExtension = new Map([
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".jfif", "image/jpeg"],
    [".png", "image/png"],
    [".webp", "image/webp"],
    [".avif", "image/avif"]
  ]);
  const isMatchingImage = imageMimeByExtension.get(extension) === mimeType;
  const isPdf = kycDocumentFields.has(file.fieldname) && extension === ".pdf" && mimeType === "application/pdf";
  const isDocx = kycDocumentFields.has(file.fieldname)
    && extension === ".docx"
    && mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  if (isMatchingImage || isPdf || isDocx) {
    cb(null, true);
  } else {
    cb(new Error(kycDocumentFields.has(file.fieldname)
      ? "Use a supported image, PDF, or DOCX file for verification documents"
      : "Only supported image files are allowed"), false);
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
