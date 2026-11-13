const test = require("node:test");
const assert = require("node:assert/strict");
const { validateAssistedListingDraft, validateAssistedListingEdit } = require("./assistedListingDraft.controller");

const valid = {
  name: "Jane Landlord", email: "jane@example.test", phone: "+254712345678", package: "normal",
  title: "Two bedroom home", description: "A bright and well-kept home.", purpose: "rent", price: "25000",
  county: "nairobi", town: "westlands", type: "apartment", bedrooms: "2", bathrooms: "1", contactPhone: "+254712345678", googleMapsUrl: ""
};
const image = { originalname: "home.jpg" };

test("assisted draft validates landlord, listing and free package image cap", () => {
  const result = validateAssistedListingDraft(valid, Array.from({ length: 15 }, () => image));
  assert.deepEqual(result.issues, []);
  assert.equal(result.email, "jane@example.test");
  assert.equal(result.imageLimit, 15);
});

test("paid assisted package allows thirty images and rejects excess", () => {
  const result = validateAssistedListingDraft({ ...valid, package: "pro" }, Array.from({ length: 30 }, () => image));
  assert.deepEqual(result.issues, []);
  assert.equal(result.imageLimit, 30);
  assert.ok(validateAssistedListingDraft({ ...valid, package: "pro" }, Array.from({ length: 31 }, () => image)).issues.some((issue) => issue.includes("30 images")));
});

test("assisted draft rejects invalid email, package, maps link and missing images", () => {
  const result = validateAssistedListingDraft({ ...valid, email: "nope", package: "enterprise", googleMapsUrl: "http://evil.example" }, []);
  assert.ok(result.issues.some((issue) => issue.includes("email")));
  assert.ok(result.issues.some((issue) => issue.includes("package")));
  assert.ok(result.issues.some((issue) => issue.includes("Google Maps")));
  assert.ok(result.issues.some((issue) => issue.includes("image")));
});

test("BnB and office drafts enforce their specific required fields", () => {
  const bnb = validateAssistedListingDraft({ ...valid, purpose: "short_stay" }, [image]);
  assert.ok(bnb.issues.some((issue) => issue.includes("guest")));
  const office = validateAssistedListingDraft({ ...valid, type: "office", size: "", sizeUnit: "" }, [image]);
  assert.ok(office.issues.some((issue) => issue.includes("Office size")));
});

test("building-category inventory is restricted to Premium and Pro package drafts", () => {
  const premium = validateAssistedListingDraft({ ...valid, package: "premium", portfolioName: "River Park", portfolioCategory: "One bedroom", totalUnits: "24", availableUnits: "18" }, [image]);
  assert.deepEqual(premium.issues, []);
  const free = validateAssistedListingDraft({ ...valid, totalUnits: "24", availableUnits: "18", portfolioName: "River Park", portfolioCategory: "One bedroom" }, [image]);
  assert.ok(free.issues.some((issue) => issue.includes("Premium and Pro")));
});

test("approved assisted property can be edited without re-uploading its existing photos", () => {
  const edit = validateAssistedListingEdit({
    ...valid,
    amenities: JSON.stringify({ garden: true }),
    latitude: "-1.286389",
    longitude: "36.817223"
  }, [], { packageName: "normal", existingImageCount: 5 });
  assert.deepEqual(edit.issues, []);
  assert.equal(edit.imageLimit, 15);
  assert.equal(edit.amenities.garden, true);
});

test("approved assisted edit enforces package image limits and valid location/amenity fields", () => {
  const tooMany = validateAssistedListingEdit({ ...valid, amenities: "{}" }, Array.from({ length: 31 }, () => image), { packageName: "basic" });
  assert.ok(tooMany.issues.some((issue) => issue.includes("30 images")));
  const invalid = validateAssistedListingEdit({ ...valid, town: "mombasa", contactPhone: "0712345678", amenities: JSON.stringify({ admin: true }) }, [], { packageName: "normal", existingImageCount: 1 });
  assert.ok(invalid.issues.some((issue) => issue.includes("town")));
  assert.ok(invalid.issues.some((issue) => issue.includes("contact phone")));
  assert.ok(invalid.issues.some((issue) => issue.includes("Amenities")));
});
