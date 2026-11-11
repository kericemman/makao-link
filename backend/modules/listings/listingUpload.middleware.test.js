const test = require("node:test");
const assert = require("node:assert/strict");
const { MAX_TOTAL_UPLOAD_BYTES, getTotalUploadError } = require("./listingUpload.middleware");

test("listing upload aggregate cap permits compressed batches within 38 MiB", () => {
  assert.equal(getTotalUploadError([{ size: MAX_TOTAL_UPLOAD_BYTES - 1 }]), null);
  assert.equal(getTotalUploadError([{ size: 19 * 1024 * 1024 }, { size: 19 * 1024 * 1024 }]), null);
});

test("listing upload aggregate cap rejects oversized batches with an actionable 413", () => {
  const error = getTotalUploadError([{ size: MAX_TOTAL_UPLOAD_BYTES }, { size: 1 }]);
  assert.equal(error.statusCode, 413);
  assert.equal(error.code, "LISTING_UPLOAD_TOO_LARGE");
});
