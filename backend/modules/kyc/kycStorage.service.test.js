const test = require("node:test");
const assert = require("node:assert/strict");
const { getStorageConfig } = require("./kycStorage.service");

test("KYC storage requires a private bucket and prefers dedicated private credentials", () => {
  assert.deepEqual(getStorageConfig({
    R2_ACCOUNT_ID: "account",
    R2_S3_ENDPOINT: "https://shared.example.test",
    R2_PRIVATE_BUCKET: "private-documents",
    R2_PRIVATE_BUCKET_ENDPOINT: "https://private.example.test",
    R2_PRIVATE_BUCKET_ACCESS_KEY_ID: "private-key",
    R2_PRIVATE_BUCKET_SECRET_ACCESS_KEY: "private-secret",
    R2_ACCESS_KEY_ID: "shared-key",
    R2_SECRET_ACCESS_KEY: "shared-secret"
  }), {
    endpoint: "https://private.example.test",
    bucket: "private-documents",
    accessKeyId: "private-key",
    secretAccessKey: "private-secret"
  });
});

test("KYC storage refuses an incomplete private-bucket configuration", () => {
  assert.throws(() => getStorageConfig({}), /Private R2 storage is not configured/);
});
