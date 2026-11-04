const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getStorageConfig,
  objectKeyFor,
  safeOriginalName,
  validDocumentFile
} = require("./agentApplicationStorage.service");

test("private R2 configuration prefers private bucket credentials", () => {
  const config = getStorageConfig({
    R2_ACCOUNT_ID: "account",
    R2_PRIVATE_BUCKET_ENDPOINT: "https://private.example.test",
    R2_PRIVATE_BUCKET: "private-documents",
    R2_PRIVATE_BUCKET_ACCESS_KEY_ID: "private-key",
    R2_PRIVATE_BUCKET_SECRET_ACCESS_KEY: "private-secret",
    R2_ACCESS_KEY_ID: "public-key",
    R2_SECRET_ACCESS_KEY: "public-secret"
  });
  assert.deepEqual(config, {
    endpoint: "https://private.example.test",
    bucket: "private-documents",
    accessKeyId: "private-key",
    secretAccessKey: "private-secret"
  });
});

test("agent application objects use random, field-scoped private keys", () => {
  const first = objectKeyFor("app-id", "identityFront", "my-id.pdf");
  const second = objectKeyFor("app-id", "identityFront", "my-id.pdf");
  assert.match(first, /^agent-applications\/app-id\/identityFront\/[0-9a-f-]{36}\.pdf$/);
  assert.notEqual(first, second);
  assert.equal(first.includes("my-id"), false);
  assert.throws(() => objectKeyFor("app-id", "unknown", "file.pdf"), /Unsupported agent application document field/);
});

test("document validation requires a matching allowlisted MIME type and extension", () => {
  assert.equal(validDocumentFile({ buffer: Buffer.from("%PDF-1.7"), mimetype: "application/pdf", originalname: "proof.pdf" }), true);
  assert.equal(validDocumentFile({ buffer: Buffer.from("%PDF-1.7"), mimetype: "application/pdf", originalname: "proof.jpg" }), false);
  assert.equal(validDocumentFile({ buffer: Buffer.from("not a pdf"), mimetype: "application/pdf", originalname: "proof.pdf" }), false);
  assert.equal(validDocumentFile({ buffer: Buffer.from("x"), mimetype: "image/svg+xml", originalname: "proof.svg" }), false);
});

test("document display names are safe for content-disposition headers", () => {
  assert.equal(safeOriginalName('../../id\r\n".pdf'), "id___.pdf");
});
