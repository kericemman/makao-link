const FILE_FIELDS = ["documentFront", "documentBack", "selfiePhoto", "proofOfOwnership"];
const DOWNLOAD_LINK_TTL_SECONDS = 10 * 60;

const asPlainObject = (record) => (typeof record?.toObject === "function" ? record.toObject() : { ...record });

const toLandlordKyc = (record) => {
  if (!record) return null;
  const safeRecord = asPlainObject(record);
  for (const field of FILE_FIELDS) delete safeRecord[field];
  delete safeRecord.documentAssets;
  delete safeRecord.idNumber;
  return safeRecord;
};

const createAdminKycView = (record, cloudinary, now = Date.now()) => {
  const safeRecord = asPlainObject(record);
  const assets = safeRecord.documentAssets || {};
  const documentLinks = {};

  for (const field of FILE_FIELDS) {
    const asset = assets[field];
    if (asset?.publicId && asset?.format && asset?.resourceType) {
      try {
        documentLinks[field] = cloudinary.utils.private_download_url(asset.publicId, asset.format, {
          resource_type: asset.resourceType,
          type: "authenticated",
          expires_at: Math.floor(now / 1000) + DOWNLOAD_LINK_TTL_SECONDS
        });
      } catch {
        documentLinks[field] = "";
      }
    } else {
      // Existing records remain reviewable; their original Cloudinary access mode needs migration.
      documentLinks[field] = safeRecord[field] || "";
    }
    delete safeRecord[field];
  }

  delete safeRecord.documentAssets;
  safeRecord.documentLinks = documentLinks;
  return safeRecord;
};

const assetMetadataFromFile = (file) => {
  if (!file?.filename) return undefined;
  const extension = String(file.originalname || "").split(".").pop().toLowerCase();
  return {
    publicId: file.filename,
    resourceType: extension === "docx" ? "raw" : "image",
    format: extension
  };
};

module.exports = {
  FILE_FIELDS,
  DOWNLOAD_LINK_TTL_SECONDS,
  toLandlordKyc,
  createAdminKycView,
  assetMetadataFromFile
};
