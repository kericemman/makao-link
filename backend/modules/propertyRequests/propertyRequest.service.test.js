const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizePropertyRequest, buildListingEligibilityFilter, buildAlternativeListingFilter, rankEligibleListings, MATCHING_VERSION } = require("./propertyRequest.service");

const baseRequest = () => normalizePropertyRequest({
  purpose: "rent", pricePeriod: "monthly", budgetMin: 10000, budgetMax: 45000,
  preferredLocations: [{ county: "Nairobi", town: "Westlands" }],
  propertyTypes: ["apartment"], minBedrooms: 2, consent: { matching: true, notifications: true }
});

test("property request requires explicit matching consent and rejects mass-assigned fields", () => {
  assert.throws(() => normalizePropertyRequest({ purpose: "rent", pricePeriod: "monthly", budgetMax: 45000 }), /Explicit consent/);
  assert.throws(() => normalizePropertyRequest({ ...{
    purpose: "rent", pricePeriod: "monthly", budgetMax: 45000, consent: { matching: true }
  }, customer: "attacker-id" }), /Unsupported property request field/);
  assert.throws(() => normalizePropertyRequest({ ...{
    purpose: "rent", pricePeriod: "monthly", budgetMax: 45000, consent: { matching: true }
  }, status: "matched" }), /Unsupported property request field/);
});

test("property request validates budget, supported purpose and matching period", () => {
  assert.throws(() => normalizePropertyRequest({ purpose: "rent", pricePeriod: "monthly", budgetMin: 50000, budgetMax: 45000, consent: { matching: true } }), /cannot exceed/);
  assert.throws(() => normalizePropertyRequest({ purpose: "sale", pricePeriod: "monthly", budgetMax: 45000, consent: { matching: true } }), /must be total/);
});

test("short-stay requests require a valid date interval and guest count", () => {
  const input = { purpose: "short_stay", pricePeriod: "nightly", budgetMax: 9000, consent: { matching: true } };
  assert.throws(() => normalizePropertyRequest(input), /require valid dates and guest count/);
  assert.doesNotThrow(() => normalizePropertyRequest({ ...input, stayStartDate: "2027-01-02", stayEndDate: "2027-01-03", guestCount: 2 }));
});

test("match eligibility cannot include unapproved, inactive, taken or deleted listings", () => {
  const filter = buildListingEligibilityFilter(baseRequest());
  assert.equal(filter.status, "approved");
  assert.equal(filter.isActive, true);
  assert.equal(filter.availability, "available");
  assert.deepEqual(filter.isDeleted, { $ne: true });
  assert.equal(filter.purpose, "rent");
  assert.deepEqual(filter.price, { $lte: 45000, $gte: 10000 });
  assert.deepEqual(filter.type, { $in: ["apartment"] });
  assert.deepEqual(filter.bedrooms, { $gte: 2 });
  assert.equal(filter.$or[0].county.test("nairobi"), true);
  assert.equal(filter.$or[0].town.test("WESTLANDS"), true);
});

test("location strings are regex escaped and short-stay guest constraints are enforced", () => {
  const request = normalizePropertyRequest({
    purpose: "short_stay", pricePeriod: "nightly", budgetMax: 10000,
    preferredLocations: [{ town: "West.*lands" }], stayStartDate: "2027-02-01", stayEndDate: "2027-02-03", guestCount: 3,
    consent: { matching: true }
  });
  const filter = buildListingEligibilityFilter(request);
  assert.equal(filter.$or[0].town.test("Westlands"), false);
  assert.equal(filter.$or[0].town.test("West.*lands"), true);
  assert.deepEqual(filter.maxGuests, { $gte: 3 });
});

test("exact eligible listings rank affordably and explain the matched criteria", () => {
  const request = baseRequest();
  const listings = [
    { _id: "higher", price: 40000, county: "Nairobi", town: "Westlands", type: "apartment", bedrooms: 2, bathrooms: 1, createdAt: "2026-01-01" },
    { _id: "lower", price: 25000, county: "nairobi", town: "WESTLANDS", type: "apartment", bedrooms: 3, bathrooms: 2, createdAt: "2025-01-01" }
  ];

  const ranked = rankEligibleListings(request, listings);

  assert.deepEqual(ranked.map((item) => item.listing._id), ["lower", "higher"]);
  assert.equal(ranked[0].score > ranked[1].score, true);
  assert.deepEqual(ranked[0].reasons, ["Within your budget", "Preferred area: Westlands", "Requested type: apartment", "At least 2 bedrooms"]);
  assert.equal(MATCHING_VERSION, 2);
});

test("preferred location order contributes to ranking without changing eligibility", () => {
  const request = normalizePropertyRequest({
    purpose: "rent", pricePeriod: "monthly", budgetMax: 50000,
    preferredLocations: [{ town: "Westlands" }, { town: "Kilimani" }],
    consent: { matching: true }
  });
  const ranked = rankEligibleListings(request, [
    { _id: "second", price: 25000, county: "Nairobi", town: "Kilimani", type: "apartment", createdAt: "2026-01-02" },
    { _id: "first", price: 25000, county: "Nairobi", town: "Westlands", type: "apartment", createdAt: "2026-01-01" }
  ]);

  assert.deepEqual(ranked.map((item) => item.listing._id), ["first", "second"]);
  assert.equal(ranked[0].reasons.includes("Preferred area: Westlands"), true);
});

test("alternative eligibility relaxes only town while preserving selected county and hard criteria", () => {
  const request = baseRequest();
  const filter = buildAlternativeListingFilter(request);

  assert.deepEqual(filter.price, { $lte: 45000, $gte: 10000 });
  assert.deepEqual(filter.type, { $in: ["apartment"] });
  assert.deepEqual(filter.bedrooms, { $gte: 2 });
  assert.equal(filter.status, "approved");
  assert.equal(filter.availability, "available");
  assert.equal(filter.$and[0].$or[0].county.test("NAIROBI"), true);
  assert.equal("town" in filter, false);
  assert.equal(filter.$and[1].$nor[0].$or[0].town.test("Westlands"), true);
});

test("alternative location matching is disabled when a county and town pair is unavailable", () => {
  const request = normalizePropertyRequest({
    purpose: "rent", pricePeriod: "monthly", budgetMax: 45000,
    preferredLocations: [{ town: "Westlands" }], consent: { matching: true }
  });
  assert.equal(buildAlternativeListingFilter(request), null);
});
