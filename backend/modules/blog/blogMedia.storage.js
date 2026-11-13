const crypto = require("crypto");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { publicConfig } = require("../listings/listingMedia.storage");

const IMAGE_TYPES = new Map([
  [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"], [".png", "image/png"],
  [".webp", "image/webp"], [".avif", "image/avif"]
]);
const clients = new Map();

const getImageExtension = (file) => {
  const extension = path.extname(String(file?.originalname || "")).toLowerCase();
  return IMAGE_TYPES.get(extension) === String(file?.mimetype || "").toLowerCase() ? extension : "";
};

const hasValidImageSignature = (file) => {
  if (!Buffer.isBuffer(file?.buffer) || !getImageExtension(file)) return false;
  const bytes = file.buffer;
  const extension = getImageExtension(file);
  if ([".jpg", ".jpeg"].includes(extension)) return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (extension === ".png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (extension === ".webp") return bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
  if (extension === ".avif") return bytes.subarray(4, 8).toString() === "ftyp" && ["avif", "avis"].includes(bytes.subarray(8, 12).toString());
  return false;
};

const getClient = (config) => {
  const key = `${config.endpoint}|${config.bucket}`;
  if (!clients.has(key)) {
    clients.set(key, new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey }
    }));
  }
  return clients.get(key);
};

const uploadBlogImage = async (file, { env = process.env, clientFactory = getClient, id = crypto.randomUUID() } = {}) => {
  const extension = getImageExtension(file);
  if (!extension || !hasValidImageSignature(file)) {
    const error = new Error("Choose a valid JPEG, PNG, WebP, or AVIF image.");
    error.statusCode = 400;
    error.code = "INVALID_IMAGE_CONTENT";
    throw error;
  }

  const config = publicConfig(env);
  const key = `blog-content/${id}${extension}`;
  await clientFactory(config).send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: file.buffer,
    ContentLength: file.size,
    ContentType: IMAGE_TYPES.get(extension),
    ContentDisposition: "inline",
    CacheControl: "public, max-age=31536000, immutable"
  }));

  return { url: `${config.publicUrl}/${key.split("/").map(encodeURIComponent).join("/")}` };
};

module.exports = { getImageExtension, hasValidImageSignature, uploadBlogImage };
