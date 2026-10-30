const mongoose = require("mongoose");
const Listing = require("../../listings/listings.model");
const { COUNTIES, LISTING_TYPES, LISTING_PURPOSES } = require("../../listings/listing.constants");
const parsePublicListingQuery = require("../../listings/listing.filters");
const { normalizeWorkflow, redactSensitiveText } = require("../rendaAssistant.service");

const PUBLIC_LISTING_FILTER = Object.freeze({
  status: "approved",
  isActive: true,
  availability: "available",
  isDeleted: { $ne: true }
});
const SEARCH_LIMIT = 5;
const SAFE_LISTING_FIELDS = "title description price purpose type county town area bedrooms bathrooms size sizeUnit images amenities maxGuests minNights createdAt";
const AMENITY_FIELDS = ["garden", "tarmacAccess", "nearSchools", "nearShoppingCentre", "nearHospital", "waterAvailable", "electricityAvailable"];

const objectSchema = (properties) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false
});

const nullableText = { type: ["string", "null"] };
const nullableNumber = { type: ["number", "null"] };
const nullableInteger = { type: ["integer", "null"] };

const tools = [
  {
    type: "function",
    name: "search_public_listings",
    description: "Search currently approved, active, available public RendaHomes listings. Use this for listing discovery.",
    strict: true,
    parameters: objectSchema({
      search: nullableText,
      purpose: { type: ["string", "null"], enum: ["rent", "sale", "short_stay", null] },
      type: { type: ["string", "null"], enum: [...LISTING_TYPES, null] },
      county: nullableText,
      town: nullableText,
      minPrice: nullableNumber,
      maxPrice: nullableNumber,
      bedrooms: nullableInteger,
      bathrooms: nullableInteger,
      guests: nullableInteger
    })
  },
  {
    type: "function",
    name: "get_public_listing_details",
    description: "Fetch safe public details for one listing using its exact RendaHomes listing ID.",
    strict: true,
    parameters: objectSchema({ listingId: { type: "string" } })
  },
  {
    type: "function",
    name: "get_live_search_metadata",
    description: "Return counties and towns that currently have approved, active, available public listings.",
    strict: true,
    parameters: objectSchema({})
  },
  {
    type: "function",
    name: "get_conversation_context",
    description: "Return a minimal summary of this caller's current assistant search preferences and recent messages.",
    strict: true,
    parameters: objectSchema({})
  }
];

const responseSchema = {
  type: "object",
  properties: {
    reply: { type: "string" },
    listingIds: { type: "array", items: { type: "string" } },
    planKeys: { type: "array", items: { type: "string", enum: ["normal", "basic", "premium", "pro"] } },
    draftId: { type: ["string", "null"] },
    needsHumanSupport: { type: "boolean" }
  },
  required: ["reply", "listingIds", "planKeys", "draftId", "needsHumanSupport"],
  additionalProperties: false
};

const formatListing = (listing) => {
  if (!listing) return null;
  const source = typeof listing.toObject === "function" ? listing.toObject() : listing;
  return {
    _id: String(source._id),
    title: String(source.title || "").slice(0, 180),
    description: redactSensitiveText(source.description).slice(0, 900),
    price: source.price,
    priceLabel: source.purpose === "short_stay" ? "per night" : source.purpose === "rent" ? "per month" : "total price",
    purpose: source.purpose,
    type: source.type,
    county: source.county,
    town: source.town,
    area: String(source.area || "").slice(0, 120),
    bedrooms: source.bedrooms ?? null,
    bathrooms: source.bathrooms ?? null,
    size: source.size ?? null,
    sizeUnit: source.sizeUnit || null,
    images: Array.isArray(source.images) ? source.images.slice(0, 3) : [],
    amenities: Object.fromEntries(AMENITY_FIELDS.map((key) => [key, Boolean(source.amenities?.[key])])),
    maxGuests: source.maxGuests ?? null,
    minNights: source.minNights ?? null,
    createdAt: source.createdAt || null
  };
};

const searchListings = async (ListingModel, query) => {
  const { filter, page } = parsePublicListingQuery(query, { defaultLimit: SEARCH_LIMIT });
  const [listings, total] = await Promise.all([
    ListingModel.find(filter).select(SAFE_LISTING_FIELDS).sort({ createdAt: -1 }).skip((page - 1) * SEARCH_LIMIT).limit(SEARCH_LIMIT).lean(),
    ListingModel.countDocuments(filter)
  ]);
  return { listings: listings.map(formatListing), total, page, limit: SEARCH_LIMIT };
};

const toSearchCriteria = (values) => ({
  search: values.search || null,
  purpose: values.purpose || null,
  type: values.type || null,
  county: values.county || null,
  town: values.town || null,
  minPrice: values.minPrice ?? null,
  maxPrice: values.maxPrice ?? null,
  bedrooms: values.bedrooms ?? null,
  bathrooms: values.bathrooms ?? null,
  guests: values.guests ?? null
});

const assertNullableNumber = (value, name, max = 1_000_000_000_000) => {
  if (value !== null && (!Number.isFinite(value) || value < 0 || value > max)) throw new TypeError(`Invalid ${name}`);
};

const normalizeSearchArguments = (args) => {
  if (!args || typeof args !== "object" || Array.isArray(args)) throw new TypeError("Invalid listing search filters");
  const allowed = new Set(["search", "purpose", "type", "county", "town", "minPrice", "maxPrice", "bedrooms", "bathrooms", "guests"]);
  if (Object.keys(args).some((key) => !allowed.has(key))) throw new TypeError("Unsupported listing search filter");
  for (const key of allowed) if (!Object.hasOwn(args, key)) throw new TypeError(`Missing search filter: ${key}`);

  for (const key of ["search", "county", "town"]) {
    if (args[key] !== null && (typeof args[key] !== "string" || args[key].length > (key === "search" ? 120 : 100))) {
      throw new TypeError(`Invalid ${key}`);
    }
  }
  if (args.purpose !== null && !LISTING_PURPOSES.includes(args.purpose)) throw new TypeError("Invalid purpose");
  if (args.type !== null && !LISTING_TYPES.includes(args.type)) throw new TypeError("Invalid property type");
  assertNullableNumber(args.minPrice, "minimum price");
  assertNullableNumber(args.maxPrice, "maximum price");
  if (args.minPrice !== null && args.maxPrice !== null && args.maxPrice < args.minPrice) throw new TypeError("Invalid price range");
  for (const key of ["bedrooms", "bathrooms", "guests"]) {
    const value = args[key];
    if (value !== null && (!Number.isInteger(value) || value < (key === "guests" ? 1 : 0) || value > 100)) throw new TypeError(`Invalid ${key}`);
  }
  return args;
};

const createPublicListingTools = ({ conversation, recentMessages = [], ListingModel = Listing } = {}) => {
  const execute = async (name, rawArguments) => {
    const args = typeof rawArguments === "string" ? JSON.parse(rawArguments) : rawArguments;
    if (name === "search_public_listings") {
      const values = normalizeSearchArguments(args);
      const query = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== null && value !== ""));
      query.limit = SEARCH_LIMIT;
      const exact = await searchListings(ListingModel, query);
      if (exact.total > 0) return { ...exact, criteria: toSearchCriteria(values), match: "exact", broadenedBy: [] };

      const relaxed = { ...query };
      const broadenedBy = [];
      if (relaxed.town) {
        delete relaxed.town;
        broadenedBy.push("town");
      }
      if (relaxed.minPrice !== undefined || relaxed.maxPrice !== undefined) {
        const min = Number(relaxed.minPrice || 0);
        const max = Number(relaxed.maxPrice || min || 0);
        if (relaxed.minPrice !== undefined) relaxed.minPrice = Math.max(0, Math.floor(min * 0.85));
        if (relaxed.maxPrice !== undefined) relaxed.maxPrice = Math.ceil(max * 1.15);
        broadenedBy.push("budget");
      }
      if (broadenedBy.length) {
        const alternatives = await searchListings(ListingModel, relaxed);
        const alternativeCriteria = { ...values };
        if (relaxed.town === undefined) alternativeCriteria.town = null;
        if (relaxed.minPrice !== undefined) alternativeCriteria.minPrice = relaxed.minPrice;
        if (relaxed.maxPrice !== undefined) alternativeCriteria.maxPrice = relaxed.maxPrice;
        if (alternatives.total > 0) return { ...alternatives, criteria: toSearchCriteria(alternativeCriteria), match: "alternatives", broadenedBy };
      }
      return { ...exact, criteria: toSearchCriteria(values), match: "none", broadenedBy: [] };
    }

    if (name === "get_public_listing_details") {
      if (!args || Object.keys(args).length !== 1 || typeof args.listingId !== "string" || !mongoose.isValidObjectId(args.listingId)) {
        throw new TypeError("Invalid listing ID");
      }
      const listing = await ListingModel.findOne({ _id: args.listingId, ...PUBLIC_LISTING_FILTER })
        .select(SAFE_LISTING_FIELDS)
        .lean();
      return { listing: formatListing(listing) };
    }

    if (name === "get_live_search_metadata") {
      if (!args || Object.keys(args).length !== 0) throw new TypeError("Unexpected metadata arguments");
      const [availableCounties, availableTowns] = await Promise.all([
        ListingModel.distinct("county", PUBLIC_LISTING_FILTER),
        ListingModel.distinct("town", PUBLIC_LISTING_FILTER)
      ]);
      return {
        counties: COUNTIES.filter((county) => availableCounties.some((value) => String(value).toLowerCase() === county.toLowerCase())),
        towns: availableTowns.map((town) => String(town).slice(0, 100)).slice(0, 300),
        supportedPropertyTypes: LISTING_TYPES,
        supportedPurposes: LISTING_PURPOSES
      };
    }

    if (name === "get_conversation_context") {
      if (!args || Object.keys(args).length !== 0) throw new TypeError("Unexpected context arguments");
      const workflow = normalizeWorkflow(conversation?.workflow || {});
      return {
        intent: workflow.intent,
        searchPreferences: workflow.search,
        recentMessages: recentMessages.slice(-5).map((message) => ({
          direction: message.direction,
          text: redactSensitiveText(message.text).slice(0, 700)
        }))
      };
    }

    throw new TypeError("Tool is not allowed");
  };

  return { execute };
};

module.exports = {
  PUBLIC_LISTING_FILTER,
  SAFE_LISTING_FIELDS,
  SEARCH_LIMIT,
  createPublicListingTools,
  formatListing,
  responseSchema,
  tools,
  normalizeSearchArguments
};
