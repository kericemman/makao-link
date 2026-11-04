const crypto = require("crypto");
const path = require("path");
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { validDocumentFile } = require("../agents/agentApplicationStorage.service");

const FILE_FIELDS = new Set(["documentFront", "documentBack", "selfiePhoto", "proofOfOwnership"]);
const SIGNED_URL_TTL_SECONDS = 5 * 60;
let client;

const getStorageConfig = (env = process.env) => {
  const endpoint = env.R2_PRIVATE_BUCKET_ENDPOINT || env.R2_S3_ENDPOINT || (env.R2_ACCOUNT_ID ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : "");
  const bucket = env.R2_PRIVATE_BUCKET;
  const accessKeyId = env.R2_PRIVATE_BUCKET_ACCESS_KEY_ID || env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_PRIVATE_BUCKET_SECRET_ACCESS_KEY || env.R2_SECRET_ACCESS_KEY;
  const missing = [!endpoint && "R2 private endpoint", !bucket && "R2_PRIVATE_BUCKET", !accessKeyId && "R2 private access key", !secretAccessKey && "R2 private secret key"].filter(Boolean);
  if (missing.length) throw new Error(`Private R2 storage is not configured: ${missing.join(", ")}`);
  return { endpoint, bucket, accessKeyId, secretAccessKey };
};

const getClient = () => {
  if (!client) {
    const config = getStorageConfig();
    client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey }
    });
  }
  return client;
};

const safeName = (name) => path.basename(String(name || "document")).replace(/[\r\n"\\]/g, "_").slice(0, 180);

const uploadKycDocuments = async (landlordId, filesByField = {}) => {
  const { bucket } = getStorageConfig();
  const s3 = getClient();
  const createdKeys = [];
  const assets = {};
  try {
    for (const field of FILE_FIELDS) {
      const file = filesByField[field]?.[0];
      if (!file) continue;
      if (!validDocumentFile(file)) {
        const error = new Error("The verification document content does not match its file type.");
        error.statusCode = 400;
        error.code = "INVALID_DOCUMENT_CONTENT";
        throw error;
      }
      const extension = path.extname(file.originalname).toLowerCase();
      const key = `kyc/${landlordId}/${field}/${crypto.randomUUID()}${extension}`;
      const originalName = safeName(file.originalname);
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
        ContentDisposition: `inline; filename="${originalName}"`,
        CacheControl: "private, no-store",
        Metadata: { landlordid: String(landlordId), documentfield: field }
      }));
      createdKeys.push(key);
      assets[field] = { key, originalName, contentType: file.mimetype, size: file.size, uploadedAt: new Date() };
    }
    return assets;
  } catch (error) {
    await Promise.allSettled(createdKeys.map((Key) => s3.send(new DeleteObjectCommand({ Bucket: bucket, Key }))));
    throw error;
  }
};

const deleteKycDocuments = async (assets = {}) => {
  const keys = Object.values(assets).map((asset) => asset?.key).filter(Boolean);
  if (!keys.length) return;
  const { bucket } = getStorageConfig();
  const s3 = getClient();
  await Promise.allSettled(keys.map((Key) => s3.send(new DeleteObjectCommand({ Bucket: bucket, Key }))));
};

const createKycDocumentViewUrl = async (asset) => {
  if (!asset?.key) throw new Error("KYC document is unavailable.");
  const { bucket } = getStorageConfig();
  return getSignedUrl(getClient(), new GetObjectCommand({
    Bucket: bucket,
    Key: asset.key,
    ResponseContentType: asset.contentType || "application/octet-stream",
    ResponseContentDisposition: `inline; filename="${safeName(asset.originalName)}"`,
    ResponseCacheControl: "private, no-store"
  }), { expiresIn: SIGNED_URL_TTL_SECONDS });
};

module.exports = { SIGNED_URL_TTL_SECONDS, createKycDocumentViewUrl, deleteKycDocuments, getStorageConfig, uploadKycDocuments };
