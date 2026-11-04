const crypto = require("crypto");
const path = require("path");
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const DOCUMENT_FIELDS = ["identityFront", "identityBack", "professionalCredential"];
const DOWNLOAD_TTL_SECONDS = 5 * 60;
const MIME_EXTENSIONS = new Map([
  ["image/jpeg", new Set([".jpg", ".jpeg"])],
  ["image/png", new Set([".png"])],
  ["image/webp", new Set([".webp"])],
  ["application/pdf", new Set([".pdf"])],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", new Set([".docx"])]
]);

let client;

const getStorageConfig = (env = process.env) => {
  const accountId = env.R2_ACCOUNT_ID;
  const endpoint = env.R2_PRIVATE_BUCKET_ENDPOINT || env.R2_S3_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  const bucket = env.R2_PRIVATE_BUCKET;
  const accessKeyId = env.R2_PRIVATE_BUCKET_ACCESS_KEY_ID || env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_PRIVATE_BUCKET_SECRET_ACCESS_KEY || env.R2_SECRET_ACCESS_KEY;
  const missing = [!endpoint && "R2_PRIVATE_BUCKET_ENDPOINT", !bucket && "R2_PRIVATE_BUCKET", !accessKeyId && "R2 private access key", !secretAccessKey && "R2 private secret key"].filter(Boolean);
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

const validDocumentFile = (file) => {
  if (!file?.buffer || !file.mimetype || !file.originalname) return false;
  const ext = path.extname(file.originalname).toLowerCase();
  if (MIME_EXTENSIONS.get(file.mimetype)?.has(ext) !== true) return false;
  const bytes = file.buffer;
  if (file.mimetype === "application/pdf") return bytes.subarray(0, 5).toString() === "%PDF-";
  if (file.mimetype === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.mimetype === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (file.mimetype === "image/webp") return bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
  if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  return false;
};

const supportedDocumentType = (file) => {
  if (!file?.mimetype || !file?.originalname) return false;
  const ext = path.extname(file.originalname).toLowerCase();
  return MIME_EXTENSIONS.get(file.mimetype)?.has(ext) === true;
};

const objectKeyFor = (applicationId, field, originalName) => {
  if (!DOCUMENT_FIELDS.includes(field)) throw new Error("Unsupported agent application document field.");
  const ext = path.extname(originalName).toLowerCase();
  if (![...MIME_EXTENSIONS.values()].some((extensions) => extensions.has(ext))) throw new Error("Unsupported document extension.");
  return `agent-applications/${applicationId}/${field}/${crypto.randomUUID()}${ext}`;
};

const safeOriginalName = (name) => path.basename(String(name || "document")).replace(/[\r\n"\\]/g, "_").slice(0, 180);

const uploadAgentDocuments = async (applicationId, filesByField) => {
  const { bucket } = getStorageConfig();
  const s3 = getClient();
  const uploaded = [];
  const documents = {};
  try {
    for (const field of DOCUMENT_FIELDS) {
      const file = filesByField[field]?.[0];
      if (!file) continue;
      if (!validDocumentFile(file)) {
        const error = new Error("Use a matching PDF, DOCX, JPEG, PNG, or WebP file for each document.");
        error.statusCode = 400;
        throw error;
      }
      const key = objectKeyFor(applicationId, field, file.originalname);
      const originalName = safeOriginalName(file.originalname);
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
        ContentDisposition: `inline; filename="${originalName}"`,
        CacheControl: "private, no-store",
        Metadata: { applicationid: String(applicationId), documentfield: field }
      }));
      uploaded.push(key);
      documents[field] = { key, originalName, contentType: file.mimetype, size: file.size, uploadedAt: new Date() };
    }
    return documents;
  } catch (error) {
    await Promise.allSettled(uploaded.map((Key) => s3.send(new DeleteObjectCommand({ Bucket: bucket, Key }))));
    throw error;
  }
};

const deleteAgentDocuments = async (documents = {}) => {
  const { bucket } = getStorageConfig();
  const s3 = getClient();
  const keys = Object.values(documents).map((document) => document?.key).filter(Boolean);
  await Promise.allSettled(keys.map((Key) => s3.send(new DeleteObjectCommand({ Bucket: bucket, Key }))));
};

const createAgentDocumentViewUrl = async (document) => {
  if (!document?.key) throw new Error("Agent application document is unavailable.");
  const { bucket } = getStorageConfig();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: document.key,
    ResponseContentType: document.contentType || "application/octet-stream",
    ResponseContentDisposition: `inline; filename="${safeOriginalName(document.originalName)}"`,
    ResponseCacheControl: "private, no-store"
  });
  return getSignedUrl(getClient(), command, { expiresIn: DOWNLOAD_TTL_SECONDS });
};

module.exports = {
  DOCUMENT_FIELDS,
  DOWNLOAD_TTL_SECONDS,
  createAgentDocumentViewUrl,
  deleteAgentDocuments,
  getStorageConfig,
  objectKeyFor,
  safeOriginalName,
  supportedDocumentType,
  uploadAgentDocuments,
  validDocumentFile
};
