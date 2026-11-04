const multer = require("multer");
const { supportedDocumentType } = require("../agents/agentApplicationStorage.service");

const fileFields = new Set(["documentFront", "documentBack", "selfiePhoto", "proofOfOwnership"]);

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 4, fields: 12, parts: 20 },
  fileFilter(_req, file, callback) {
    if (!fileFields.has(file.fieldname) || !supportedDocumentType(file)) {
      const error = new Error("Use a matching PDF, DOCX, JPEG, PNG, or WebP file for each verification document.");
      error.statusCode = 400;
      error.code = "UNSUPPORTED_FILE_TYPE";
      return callback(error, false);
    }
    callback(null, true);
  }
}).fields([
  { name: "documentFront", maxCount: 1 },
  { name: "documentBack", maxCount: 1 },
  { name: "selfiePhoto", maxCount: 1 },
  { name: "proofOfOwnership", maxCount: 1 }
]);
