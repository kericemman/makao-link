const test = require("node:test");
const assert = require("node:assert/strict");
const {
  PUBLIC_LISTING_FILTER,
  SAFE_LISTING_FIELDS,
  createPublicListingTools,
  formatListing,
  normalizeSearchArguments,
  tools
} = require("./publicListingTools");

const searchArgs = {
  search: null,
  purpose: "rent",
  type: null,
  county: "Nairobi",
  town: null,
  minPrice: 10000,
  maxPrice: 30000,
  bedrooms: 2,
  bathrooms: null,
  guests: null
};

test("tool schemas are strict and expose only read-only allowlisted functions", () => {
  assert.deepEqual(tools.map(({ name }) => name), [
    "search_public_listings",
    "get_public_listing_details",
    "get_live_search_metadata",
    "get_conversation_context"
  ]);
  for (const tool of tools) {
    assert.equal(tool.strict, true);
    assert.equal(tool.parameters.additionalProperties, false);
    assert.deepEqual(tool.parameters.required, Object.keys(tool.parameters.properties));
  }
});

test("public listing search uses publication guards, bounded results, and a safe projection", async () => {
  const calls = {};
  const query = {
    select(fields) { calls.fields = fields; return this; },
    sort(value) { calls.sort = value; return this; },
    skip(value) { calls.skip = value; return this; },
    limit(value) { calls.limit = value; return this; },
    lean: async () => [{ _id: "listing-1", title: "Two bedroom", description: "Bright home", landlord: "private" }]
  };
  const ListingModel = {
    find(filter) { calls.filter = filter; return query; },
    countDocuments: async () => 8
  };
  const result = await createPublicListingTools({ ListingModel }).execute("search_public_listings", searchArgs);

  assert.deepEqual(calls.filter, {
    ...PUBLIC_LISTING_FILTER,
    purpose: "rent",
    county: /^Nairobi$/i,
    bedrooms: { $gte: 2 },
    price: { $gte: 10000, $lte: 30000 }
  });
  assert.equal(calls.fields, SAFE_LISTING_FIELDS);
  assert.equal(calls.limit, 5);
  assert.equal(result.total, 8);
  assert.equal(result.listings[0].landlord, undefined);
});

test("detail lookup can return only public records and never serializes landlord contact data", async () => {
  let filter;
  const ListingModel = {
    findOne(value) {
      filter = value;
      return { select() { return this; }, lean: async () => ({ _id: "abc", title: "Home", landlord: { phone: "private" }, contactPhone: "private" }) };
    }
  };
  const toolsForTurn = createPublicListingTools({ ListingModel });
  const result = await toolsForTurn.execute("get_public_listing_details", { listingId: "507f1f77bcf86cd799439011" });
  assert.deepEqual(filter, { _id: "507f1f77bcf86cd799439011", ...PUBLIC_LISTING_FILTER });
  assert.equal(result.listing.landlord, undefined);
  assert.equal(result.listing.contactPhone, undefined);
  await assert.rejects(toolsForTurn.execute("get_public_listing_details", { listingId: "not-an-id" }), /Invalid listing ID/);
});

test("live metadata is derived from available inventory and context is minimized", async () => {
  const ListingModel = {
    distinct: async (field) => field === "county" ? ["nairobi"] : ["Nairobi CBD", "Westlands"]
  };
  const conversation = { workflow: { intent: "property_search", search: { county: "Nairobi" } } };
  const toolService = createPublicListingTools({
    ListingModel,
    conversation,
    recentMessages: [{ direction: "inbound", text: "Looking for a home. ID: 12345678" }]
  });
  const metadata = await toolService.execute("get_live_search_metadata", {});
  const context = await toolService.execute("get_conversation_context", {});
  assert.deepEqual(metadata.counties, ["nairobi"]);
  assert.deepEqual(metadata.towns, ["Nairobi CBD", "Westlands"]);
  assert.equal("countyTownReference" in metadata, false);
  assert.equal(context.intent, "property_search");
  assert.equal(context.recentMessages[0].text.includes("12345678"), false);
});

test("tool inputs reject unknown fields and out-of-bounds filters", () => {
  assert.throws(() => normalizeSearchArguments({ ...searchArgs, $where: "1" }), /Unsupported/);
  assert.throws(() => normalizeSearchArguments({ ...searchArgs, minPrice: -1 }), /minimum price/);
  assert.throws(() => normalizeSearchArguments({ ...searchArgs, bedrooms: 1.5 }), /bedrooms/);
  assert.throws(() => normalizeSearchArguments({ ...searchArgs, guests: 0 }), /guests/);
  assert.deepEqual(formatListing({ _id: "id", description: "password is secret" }).description, "[REDACTED]");
});

test("empty searches broaden town and budget and label those alternatives", async () => {
  const filters = [];
  let count = 0;
  const ListingModel = {
    find(filter) {
      filters.push(filter);
      return { select() { return this; }, sort() { return this; }, skip() { return this; }, limit() { return this; }, lean: async () => count ? [{ _id: "alternative", title: "Nearby home", price: 11500, purpose: "rent" }] : [] };
    },
    countDocuments: async () => (++count === 1 ? 0 : 1)
  };
  const result = await createPublicListingTools({ ListingModel }).execute("search_public_listings", { ...searchArgs, town: "Westlands" });
  assert.equal(result.match, "alternatives");
  assert.deepEqual(result.broadenedBy, ["town", "budget"]);
  assert.equal(result.listings[0].priceLabel, "per month");
  assert.equal(filters[1].town, undefined);
  assert.deepEqual(filters[1].price, { $gte: 8500, $lte: 34500 });
});
