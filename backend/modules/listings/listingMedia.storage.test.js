const test = require("node:test");
const assert = require("node:assert/strict");
const os = require("os");
const path = require("path");
const fs = require("fs/promises");
const {
  hasValidImageSignature,
  objectKeyFor,
  privateConfig,
  publicConfig,
  safeFileName,
  serializeListingImages
} = require("./listingMedia.storage");

test("private R2 media requires a secure endpoint and prefers private credentials", () => {
  assert.deepEqual(privateConfig({
    R2_PRIVATE_BUCKET_ENDPOINT: "https://private.example.test",
    R2_PRIVATE_BUCKET: "private",
    R2_PRIVATE_BUCKET_ACCESS_KEY_ID: "private-id",
    R2_PRIVATE_BUCKET_SECRET_ACCESS_KEY: "private-secret",
    R2_S3_ENDPOINT: "https://shared.example.test",
    R2_ACCESS_KEY_ID: "shared-id",
    R2_SECRET_ACCESS_KEY: "shared-secret"
  }), {
    endpoint: "https://private.example.test",
    bucket: "private",
    accessKeyId: "private-id",
    secretAccessKey: "private-secret"
  });
  assert.throws(() => privateConfig({ R2_PRIVATE_BUCKET_ENDPOINT: "http://private", R2_PRIVATE_BUCKET: "private", R2_ACCESS_KEY_ID: "id", R2_SECRET_ACCESS_KEY: "secret" }), /secure endpoint/);
});

test("public R2 requires an HTTPS delivery URL", () => {
  const env = {
    R2_S3_ENDPOINT: "https://s3.example.test",
    R2_PUBLIC_BUCKET: "public",
    R2_ACCESS_KEY_ID: "id",
    R2_SECRET_ACCESS_KEY: "secret",
    R2_PUBLIC_URL: "https://media.example.test/"
  };
  assert.equal(publicConfig(env).publicUrl, "https://media.example.test");
  assert.throws(() => publicConfig({ ...env, R2_PUBLIC_URL: "http://media.example.test" }), /HTTPS URL/);
});

test("listing staging keys are scoped and never use client filenames", () => {
  const key = objectKeyFor("owner-123", "unsafe name.png");
  assert.match(key, /^listing-staging\/owner-123\/[a-f\d-]+\.png$/i);
  assert.equal(key.includes("unsafe"), false);
  assert.equal(safeFileName('a\r\n"name".jpg'), "a___name_.jpg");
});

test("listing image validation checks declared type against file signatures", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "renda-media-test-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, "photo.jpg");
  await fs.writeFile(filePath, Buffer.from([0xff, 0xd8, 0xff, 0x00]));
  assert.equal(await hasValidImageSignature({ path: filePath, originalname: "photo.jpg", mimetype: "image/jpeg" }), true);
  assert.equal(await hasValidImageSignature({ path: filePath, originalname: "photo.png", mimetype: "image/png" }), false);
});

test("landlord preview signs private staged images without exposing storage metadata", async () => {
  const listing = {
    _id: "listing-id",
    images: ["", "https://res.cloudinary.com/legacy.jpg"],
    imageAssets: [{ index: 0, stagingKey: "listing-staging/owner/key.jpg", status: "staged" }]
  };
  const serialized = await serializeListingImages(listing, async () => "https://private.example.test/signed-preview");
  assert.equal(serialized.images[0], "https://private.example.test/signed-preview");
  assert.equal(serialized.images[1], "https://res.cloudinary.com/legacy.jpg");
  assert.equal("imageAssets" in serialized, false);
  assert.equal(JSON.stringify(serialized).includes("listing-staging/owner/key.jpg"), false);
});

test("listing arrays can serialize with map without treating the index as a signer", async () => {
  const listings = [{ images: ["https://media.example.test/one.jpg"] }];
  const serialized = await Promise.all(listings.map(serializeListingImages));
  assert.equal(serialized[0].images[0], listings[0].images[0]);
});
