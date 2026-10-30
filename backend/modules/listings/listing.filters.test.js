const test = require("node:test");
const assert = require("node:assert/strict");
const buildPublicListingQuery = require("./listing.filters");
const { parseRecentListingQuery } = buildPublicListingQuery;

test("public listing filters always include publication and deletion constraints", () => {
  const { filter } = buildPublicListingQuery({
    status: "approved",
    availability: "available",
    isActive: "true"
  });

  assert.deepEqual(filter, {
    status: "approved",
    isActive: true,
    availability: "available",
    isDeleted: { $ne: true }
  });
});

test("public clients cannot request unpublished, inactive, or unavailable listings", () => {
  for (const query of [
    { status: "pending" },
    { status: "rejected" },
    { availability: "taken" },
    { isActive: "false" }
  ]) {
    assert.throws(() => buildPublicListingQuery(query), { statusCode: 400 });
  }
});

test("unknown fields and operator-shaped values are rejected", () => {
  assert.throws(() => buildPublicListingQuery({ isDeleted: "false" }), { statusCode: 400 });
  assert.throws(() => buildPublicListingQuery({ landlord: "someone-else" }), { statusCode: 400 });
  assert.throws(() => buildPublicListingQuery({ town: ["Ruiru", "Thika"] }), { statusCode: 400 });
});

test("supported public filters remain available and county/town matching is case-insensitive", () => {
  const { filter, page, limit, sort, appliedFilters } = buildPublicListingQuery({
    purpose: "rent",
    type: "apartment",
    county: "Kiambu",
    town: "Ruiru",
    minPrice: "10000",
    maxPrice: "30000",
    bedrooms: "2",
    bathrooms: "1",
    search: "near school",
    page: "2",
    limit: "20",
    sort: "price-low"
  });

  assert.equal(filter.status, "approved");
  assert.equal(filter.isActive, true);
  assert.equal(filter.availability, "available");
  assert.equal(filter.purpose, "rent");
  assert.equal(filter.type, "apartment");
  assert.equal(filter.county.test("KIAMBU"), true);
  assert.equal(filter.town.test("RUIRU"), true);
  assert.deepEqual(filter.price, { $gte: 10000, $lte: 30000 });
  assert.deepEqual(filter.bedrooms, { $gte: 2 });
  assert.deepEqual(filter.bathrooms, { $gte: 1 });
  assert.equal(filter.$or[0].title.test("near school"), true);
  assert.equal(page, 2);
  assert.equal(limit, 20);
  assert.equal(sort, "price-low");
  assert.equal(appliedFilters.status, undefined);
});

test("search terms are escaped before being used as regular expressions", () => {
  const { filter } = buildPublicListingQuery({ search: "Ruiru (CBD)+" });
  assert.equal(filter.$or[0].title.test("Ruiru (CBD)+"), true);
  assert.equal(filter.$or[0].title.test("Ruiru CBD"), false);
});

test("pagination and numeric filters reject malformed or excessive values", () => {
  for (const query of [
    { page: "0" },
    { page: "10001" },
    { limit: "51" },
    { limit: "-1" },
    { minPrice: "NaN" },
    { minPrice: "200", maxPrice: "100" },
    { bedrooms: "1.5" },
    { guests: "101" }
  ]) {
    assert.throws(() => buildPublicListingQuery(query), { statusCode: 400 });
  }
});

test("supported curated categories retain their existing filters", () => {
  const { filter } = buildPublicListingQuery({ category: "student" });
  assert.equal(filter.purpose, "rent");
  assert.deepEqual(filter.price, { $lte: 20000 });
  assert.deepEqual(filter.type, { $in: ["studio", "bedsitter", "apartment"] });
  assert.deepEqual(filter.bedrooms, { $lte: 1 });
});

test("the existing recent sort alias and recent-listing limits remain supported safely", () => {
  assert.equal(buildPublicListingQuery({ sort: "recent" }).sort, "recent");
  assert.deepEqual(parseRecentListingQuery({}), { ids: [], limit: 6 });
  assert.deepEqual(parseRecentListingQuery({ limit: "10", ids: "507f1f77bcf86cd799439011" }), {
    ids: ["507f1f77bcf86cd799439011"],
    limit: 10
  });
  assert.throws(() => parseRecentListingQuery({ limit: "51" }), { statusCode: 400 });
  assert.throws(() => parseRecentListingQuery({ ids: Array(51).fill("507f1f77bcf86cd799439011").join(",") }), { statusCode: 400 });
  assert.throws(() => parseRecentListingQuery({ status: "pending" }), { statusCode: 400 });
});
