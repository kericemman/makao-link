const test = require("node:test");
const assert = require("node:assert/strict");
const { fileFilter } = require("./listingUpload.middleware");

const filter = (req, file) => new Promise((resolve, reject) => fileFilter(req, file, (error, accepted) => {
  if (error) reject(error);
  else resolve(accepted);
}));

test("listing image filter accepts matching supported image types", async () => {
  const req = { maxListingImages: 2 };
  assert.equal(await filter(req, { originalname: "photo.jpg", mimetype: "image/jpeg" }), true);
  assert.equal(req.listingImageCount, 1);
});

test("listing image filter rejects mismatched extensions and MIME types", async () => {
  await assert.rejects(filter({ maxListingImages: 2 }, { originalname: "photo.png", mimetype: "image/jpeg" }), (error) => error.code === "UNSUPPORTED_FILE_TYPE");
});

test("listing image filter enforces the plan-specific image limit", async () => {
  const req = { maxListingImages: 1 };
  await filter(req, { originalname: "one.jpg", mimetype: "image/jpeg" });
  await assert.rejects(filter(req, { originalname: "two.jpg", mimetype: "image/jpeg" }), (error) => error.code === "LISTING_IMAGE_LIMIT");
});
