const test = require("node:test");
const assert = require("node:assert/strict");
const upload = require("./upload.middleware");

const filterFile = (file) => new Promise((resolve) => {
  upload.fileFilter({}, file, (error, accepted) => resolve({ error, accepted }));
});

test("upload filter accepts image formats supported by listing storage", async () => {
  for (const [extension, mimetype] of [["jpg", "image/jpeg"], ["png", "image/png"], ["webp", "image/webp"], ["avif", "image/avif"]]) {
    const result = await filterFile({ fieldname: "images", originalname: `home.${extension}`, mimetype });
    assert.equal(result.error, null);
    assert.equal(result.accepted, true);
  }
});

test("unsupported listing image formats fail as a client error", async () => {
  const result = await filterFile({ fieldname: "images", originalname: "home.gif", mimetype: "image/gif" });
  assert.equal(result.accepted, false);
  assert.equal(result.error.statusCode, 400);
  assert.equal(result.error.code, "UNSUPPORTED_FILE_TYPE");
});

test("listing upload filter applies the per-request plan image cap", async () => {
  const req = { maxListingImages: 1 };
  const file = { fieldname: "images", originalname: "home.jpg", mimetype: "image/jpeg" };
  const first = await new Promise((resolve) => upload.fileFilter(req, file, (error, accepted) => resolve({ error, accepted })));
  assert.equal(first.accepted, true);

  const second = await new Promise((resolve) => upload.fileFilter(req, { ...file, originalname: "second.jpg" }, (error, accepted) => resolve({ error, accepted })));
  assert.equal(second.accepted, false);
  assert.equal(second.error.code, "LISTING_IMAGE_LIMIT");
  assert.equal(second.error.statusCode, 400);
});
