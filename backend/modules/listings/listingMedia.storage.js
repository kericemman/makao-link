const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const PRIVATE_URL_TTL_SECONDS = 5 * 60;
const IMAGE_TYPES = new Map([
  [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"], [".jfif", "image/jpeg"], [".png", "image/png"],
  [".webp", "image/webp"], [".avif", "image/avif"]
]);
const clients = new Map();

const privateConfig = (env = process.env) => {
  const accountId = env.R2_ACCOUNT_ID;
  const endpoint = env.R2_PRIVATE_BUCKET_ENDPOINT || env.R2_S3_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  const bucket = env.R2_PRIVATE_BUCKET;
  const accessKeyId = env.R2_PRIVATE_BUCKET_ACCESS_KEY_ID || env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_PRIVATE_BUCKET_SECRET_ACCESS_KEY || env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !endpoint.startsWith("https://")) throw new Error("Private R2 listing storage is not configured with a secure endpoint.");
  return { endpoint, bucket, accessKeyId, secretAccessKey };
};

const publicConfig = (env = process.env) => {
  const accountId = env.R2_ACCOUNT_ID;
  const endpoint = env.R2_PUBLIC_BUCKET_ENDPOINT || env.R2_S3_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  const bucket = env.R2_PUBLIC_BUCKET;
  const accessKeyId = env.R2_PUBLIC_BUCKET_ACCESS_KEY_ID || env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_PUBLIC_BUCKET_SECRET_ACCESS_KEY || env.R2_SECRET_ACCESS_KEY;
  const publicUrl = String(env.R2_PUBLIC_URL || "").replace(/\/$/, "");
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !endpoint.startsWith("https://")) throw new Error("Public R2 listing storage is not configured with a secure endpoint.");
  try {
    if (new URL(publicUrl).protocol !== "https:") throw new Error();
  } catch {
    throw new Error("R2_PUBLIC_URL must be a valid HTTPS URL.");
  }
  return { endpoint, bucket, accessKeyId, secretAccessKey, publicUrl };
};

const getClient = (kind) => {
  if (!clients.has(kind)) {
    const config = kind === "private" ? privateConfig() : publicConfig();
    clients.set(kind, new S3Client({ region: "auto", endpoint: config.endpoint, credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } }));
  }
  return clients.get(kind);
};

const safeFileName = (name) => path.basename(String(name || "image")).replace(/[\r\n"\\]/g, "_").slice(0, 150);
const objectKeyFor = (ownerId, originalName) => {
  const extension = path.extname(originalName).toLowerCase();
  if (!IMAGE_TYPES.has(extension)) throw new Error("Unsupported listing image extension.");
  return `listing-staging/${String(ownerId)}/${crypto.randomUUID()}${extension}`;
};

const hasValidImageSignature = async (file) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (IMAGE_TYPES.get(extension) !== file.mimetype) return false;
  const handle = await fs.promises.open(file.path, "r");
  try {
    const header = Buffer.alloc(32);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    const bytes = header.subarray(0, bytesRead);
    if ([".jpg", ".jpeg", ".jfif"].includes(extension)) return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (extension === ".png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (extension === ".webp") return bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
    if (extension === ".avif") return bytes.subarray(4, 8).toString() === "ftyp" && ["avif", "avis"].includes(bytes.subarray(8, 12).toString());
    return false;
  } finally {
    await handle.close();
  }
};

const uploadListingImages = async (ownerId, files = []) => {
  if (!files.length) return { images: [], assets: [] };
  const { bucket } = privateConfig();
  const s3 = getClient("private");
  const created = [];
  const assets = [];
  try {
    for (const file of files) {
      if (!await hasValidImageSignature(file)) {
        const error = new Error("The listing image content does not match its file type.");
        error.statusCode = 400;
        error.code = "INVALID_IMAGE_CONTENT";
        throw error;
      }
      const key = objectKeyFor(ownerId, file.originalname);
      const originalName = safeFileName(file.originalname);
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fs.createReadStream(file.path),
        ContentLength: file.size,
        ContentType: file.mimetype,
        ContentDisposition: `inline; filename="${originalName}"`,
        CacheControl: "private, no-store",
        Metadata: { ownerid: String(ownerId), originalname: originalName }
      }));
      created.push(key);
      assets.push({ index: assets.length, stagingKey: key, originalName, contentType: file.mimetype, size: file.size, status: "staged", uploadedAt: new Date() });
    }
    return { images: assets.map(() => ""), assets };
  } catch (error) {
    await Promise.allSettled(created.map((Key) => s3.send(new DeleteObjectCommand({ Bucket: bucket, Key }))));
    throw error;
  }
};

const privateUrlFor = async (key) => {
  const { bucket } = privateConfig();
  return getSignedUrl(getClient("private"), new GetObjectCommand({ Bucket: bucket, Key: key, ResponseCacheControl: "private, no-store" }), { expiresIn: PRIVATE_URL_TTL_SECONDS });
};

const serializeListingImages = async (record, signPrivateUrl = privateUrlFor) => {
  if (typeof signPrivateUrl !== "function") signPrivateUrl = privateUrlFor;
  const listing = typeof record?.toObject === "function" ? record.toObject() : { ...record };
  const images = Array.isArray(listing.images) ? listing.images : [];
  const assets = Array.isArray(listing.imageAssets) ? listing.imageAssets : [];
  listing.images = await Promise.all(images.map((image, index) => {
    const asset = assets.find((item) => item.index === index && item.status === "staged" && item.stagingKey);
    return !image && asset ? signPrivateUrl(asset.stagingKey) : image;
  }));
  delete listing.imageAssets;
  return listing;
};

const promoteStagedImages = async (listingId, images = [], assets = []) => {
  const staged = assets.filter((asset) => asset?.status === "staged" && asset.stagingKey);
  if (!staged.length) return { images, assets, publicKeys: [] };
  const privateCfg = privateConfig();
  const publicCfg = publicConfig();
  const privateClient = getClient("private");
  const publicClient = getClient("public");
  const publicKeys = [];
  const promoted = new Map();
  try {
    for (const asset of staged) {
      const object = await privateClient.send(new GetObjectCommand({ Bucket: privateCfg.bucket, Key: asset.stagingKey }));
      const body = Buffer.from(await object.Body.transformToByteArray());
      const extension = path.extname(asset.originalName || asset.stagingKey).toLowerCase();
      const publicKey = `listings/${listingId}/${crypto.randomUUID()}${extension}`;
      await publicClient.send(new PutObjectCommand({
        Bucket: publicCfg.bucket,
        Key: publicKey,
        Body: body,
        ContentLength: body.length,
        ContentType: asset.contentType,
        ContentDisposition: `inline; filename="${safeFileName(asset.originalName)}"`,
        CacheControl: "public, max-age=31536000, immutable"
      }));
      publicKeys.push(publicKey);
      await publicClient.send(new HeadObjectCommand({ Bucket: publicCfg.bucket, Key: publicKey }));
      promoted.set(asset.index, { ...(typeof asset.toObject === "function" ? asset.toObject() : asset), status: "published", publicKey, publishedAt: new Date() });
    }
    const nextAssets = assets.map((asset) => promoted.get(asset.index) || asset);
    const nextImages = images.map((image, index) => {
      const asset = promoted.get(index);
      return asset ? `${publicCfg.publicUrl}/${asset.publicKey.split("/").map(encodeURIComponent).join("/")}` : image;
    });
    return { images: nextImages, assets: nextAssets, publicKeys, privateKeys: staged.map((asset) => asset.stagingKey) };
  } catch (error) {
    await Promise.allSettled(publicKeys.map((Key) => publicClient.send(new DeleteObjectCommand({ Bucket: publicCfg.bucket, Key }))));
    throw error;
  }
};

const deletePublicImages = async (keys = []) => {
  if (!keys.length) return;
  const { bucket } = publicConfig();
  const s3 = getClient("public");
  await Promise.allSettled(keys.map((Key) => s3.send(new DeleteObjectCommand({ Bucket: bucket, Key }))));
};

const deletePrivateImages = async (keys = []) => {
  if (!keys.length) return;
  const { bucket } = privateConfig();
  const s3 = getClient("private");
  await Promise.allSettled(keys.map((Key) => s3.send(new DeleteObjectCommand({ Bucket: bucket, Key }))));
};

module.exports = {
  PRIVATE_URL_TTL_SECONDS,
  deletePrivateImages,
  deletePublicImages,
  objectKeyFor,
  hasValidImageSignature,
  privateConfig,
  privateUrlFor,
  promoteStagedImages,
  publicConfig,
  safeFileName,
  serializeListingImages,
  uploadListingImages
};
