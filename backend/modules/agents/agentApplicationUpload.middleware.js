const multer = require("multer");
const { supportedDocumentType } = require("./agentApplicationStorage.service");

const acceptedFields = new Set(["identityFront", "identityBack", "professionalCredential"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 3, fields: 10, parts: 14 },
  fileFilter(_req, file, callback) {
    if (!acceptedFields.has(file.fieldname)) {
      const error = new Error("Unsupported application document field.");
      error.statusCode = 400;
      return callback(error, false);
    }
    if (!supportedDocumentType(file)) {
      const error = new Error("Use a matching PDF, DOCX, JPEG, PNG, or WebP file.");
      error.statusCode = 400;
      return callback(error, false);
    }
    callback(null, true);
  }
}).fields([
  { name: "identityFront", maxCount: 1 },
  { name: "identityBack", maxCount: 1 },
  { name: "professionalCredential", maxCount: 1 }
]);

module.exports = upload;
