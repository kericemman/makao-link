const test = require("node:test");
const assert = require("node:assert/strict");
const {
  DOWNLOAD_LINK_TTL_SECONDS,
  toLandlordKyc,
  createAdminKycView,
  assetMetadataFromFile
} = require("./kycFiles.service");

test("landlord KYC responses omit document URLs, asset IDs, and identification number", () => {
  const safe = toLandlordKyc({
    _id: "kyc-id",
    fullName: "Test Landlord",
    idNumber: "private-id",
    documentFront: "https://cloudinary.example/front.jpg",
    selfiePhoto: "https://cloudinary.example/selfie.jpg",
    documentAssets: { documentFront: { publicId: "private/front" } },
    status: "pending"
  });

  assert.deepEqual(safe, { _id: "kyc-id", fullName: "Test Landlord", status: "pending" });
});

test("admin KYC view signs new authenticated Cloudinary assets with a short expiry", async () => {
  const calls = [];
  const cloudinary = {
    utils: {
      private_download_url: (...args) => {
        calls.push(args);
        return "https://cloudinary.example/temporary-download";
      }
    }
  };
  const now = 1_800_000_000_000;
  const view = await createAdminKycView({
    _id: "kyc-id",
    documentFront: "https://cloudinary.example/authenticated/front",
    documentAssets: {
      documentFront: { publicId: "rendahomes/kyc/front", format: "jpg", resourceType: "image" }
    }
  }, cloudinary, now);

  assert.equal(view.documentLinks.documentFront, "https://cloudinary.example/temporary-download");
  assert.equal(view.documentFront, undefined);
  assert.equal(view.documentAssets, undefined);
  assert.deepEqual(calls[0], ["rendahomes/kyc/front", "jpg", {
    resource_type: "image",
    type: "authenticated",
    expires_at: Math.floor(now / 1000) + DOWNLOAD_LINK_TTL_SECONDS
  }]);
});

test("legacy KYC links remain available to authorized reviewers without changing records", async () => {
  const cloudinary = { utils: { private_download_url: () => assert.fail("legacy asset should not be re-signed") } };
  const legacyUrl = "https://res.cloudinary.com/example/image/upload/legacy-front.jpg";
  const view = await createAdminKycView({ documentFront: legacyUrl }, cloudinary);
  assert.equal(view.documentLinks.documentFront, legacyUrl);
});

test("admin KYC view uses a short-lived private R2 URL and never returns its object key", async () => {
  const asset = { key: "kyc/private-object", originalName: "identity.pdf", contentType: "application/pdf" };
  const view = await createAdminKycView({
    documentFront: "r2-private:kyc/private-object",
    documentAssets: { documentFront: asset }
  }, { utils: {} }, Date.now(), async (value) => {
    assert.equal(value, asset);
    return "https://private-r2.example/signed";
  });
  assert.equal(view.documentLinks.documentFront, "https://private-r2.example/signed");
  assert.equal(JSON.stringify(view).includes("kyc/private-object"), false);
  assert.equal(view.documentFront, undefined);
  assert.equal(view.documentAssets, undefined);
});

test("Cloudinary upload metadata records the public ID and delivery resource format", () => {
  assert.deepEqual(assetMetadataFromFile({ filename: "rendahomes/kyc/id-front", originalname: "scan.PNG" }), {
    publicId: "rendahomes/kyc/id-front",
    resourceType: "image",
    format: "png"
  });
  assert.deepEqual(assetMetadataFromFile({ filename: "rendahomes/kyc/identity.docx", originalname: "identity.docx" }), {
    publicId: "rendahomes/kyc/identity.docx",
    resourceType: "raw",
    format: "docx"
  });
  assert.equal(assetMetadataFromFile({ path: "https://example.com/file.jpg" }), undefined);
  assert.deepEqual(assetMetadataFromFile({ r2Asset: { key: "kyc/key", contentType: "image/jpeg" } }), {
    key: "kyc/key", contentType: "image/jpeg"
  });
});
