const test = require("node:test");
const assert = require("node:assert/strict");
const { hashIdempotencyKey, hashRequestPayload } = require("./idempotency.service");

test("idempotency key hashes are stable and do not expose the submitted key", () => {
  const key = "baf4f675-e35e-4e07-8239-0aa0c1f2710e";
  const hash = hashIdempotencyKey(key);
  assert.equal(hash, hashIdempotencyKey(key));
  assert.notEqual(hash, key);
  assert.equal(hash.length, 64);
});

test("normalized payload fingerprints distinguish changed requirements", () => {
  assert.equal(hashRequestPayload({ purpose: "rent", budgetMax: 45000 }), hashRequestPayload({ purpose: "rent", budgetMax: 45000 }));
  assert.notEqual(hashRequestPayload({ purpose: "rent", budgetMax: 45000 }), hashRequestPayload({ purpose: "rent", budgetMax: 50000 }));
});
