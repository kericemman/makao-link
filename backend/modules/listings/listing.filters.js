const { LISTING_TYPES, LISTING_PURPOSES } = require("./listing.constants");

const PUBLIC_QUERY_KEYS = new Set([
  "category",
  "status",
  "availability",
  "isActive",
  "purpose",
  "guests",
  "type",
  "county",
  "town",
  "minPrice",
  "maxPrice",
  "bedrooms",
  "bathrooms",
  "minSize",
  "maxSize",
  "search",
  "page",
  "limit",
  "sort"
]);

const CATEGORY_VALUES = new Set([
  "student",
  "office",
  "office-space",
  "family",
  "luxury",
  "maisonette",
  "bungalow",
  "villa",
  "studio",
  "townhouse"
]);

const SORT_VALUES = new Set(["latest", "recent", "price-low", "price-high", "popular"]);
const MAX_PAGE = 10000;
const MAX_LIMIT = 50;

const invalidQuery = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const readScalarQuery = (query = {}) => {
  const values = {};

  for (const [key, rawValue] of Object.entries(query)) {
    if (!PUBLIC_QUERY_KEYS.has(key)) {
      throw invalidQuery(`Unsupported listing query parameter: ${key}`);
    }

    if (Array.isArray(rawValue) || (rawValue !== null && typeof rawValue === "object")) {
      throw invalidQuery(`Listing query parameter '${key}' must be a single value`);
    }

    if (rawValue === undefined || rawValue === null) continue;
    values[key] = String(rawValue).trim();
  }

  return values;
};

const parseNumber = (value, name, { min = 0, max = Number.MAX_SAFE_INTEGER, integer = false } = {}) => {
  if (value === undefined || value === "") return undefined;
  if (!/^(?:\d+\.?\d*|\.\d+)$/.test(value)) {
    throw invalidQuery(`'${name}' must be a valid number`);
  }

  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) {
    throw invalidQuery(`'${name}' is outside the allowed range`);
  }

  return number;
};

const parseBoundedInteger = (value, name, fallback, max) => {
  if (value === undefined || value === "") return fallback;
  if (!/^\d+$/.test(value)) throw invalidQuery(`'${name}' must be a whole number`);

  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1 || number > max) {
    throw invalidQuery(`'${name}' must be between 1 and ${max}`);
  }
  return number;
};

const parsePublicListingQuery = (query = {}, { defaultPage = 1, defaultLimit = 12 } = {}) => {
  const values = readScalarQuery(query);

  // Legacy clients may send these safe values. They never control publication filters.
  if (values.status !== undefined && values.status !== "approved") {
    throw invalidQuery("Public listing searches only support approved listings");
  }
  if (values.availability !== undefined && values.availability !== "available") {
    throw invalidQuery("Public listing searches only support available listings");
  }
  if (values.isActive !== undefined && values.isActive !== "true") {
    throw invalidQuery("Public listing searches only support active listings");
  }

  const page = parseBoundedInteger(values.page, "page", defaultPage, MAX_PAGE);
  const limit = parseBoundedInteger(values.limit, "limit", defaultLimit, MAX_LIMIT);
  const sort = values.sort || "latest";
  if (!SORT_VALUES.has(sort)) throw invalidQuery("Unsupported listing sort order");

  const category = values.category;
  if (category && !CATEGORY_VALUES.has(category)) throw invalidQuery("Unsupported listing category");

  const purpose = values.purpose;
  if (purpose && !LISTING_PURPOSES.includes(purpose)) throw invalidQuery("Unsupported listing purpose");

  const type = values.type === "office-space" ? "office" : values.type;
  if (type && !LISTING_TYPES.includes(type)) throw invalidQuery("Unsupported property type");

  for (const key of ["county", "town", "search"]) {
    if (values[key] && values[key].length > (key === "search" ? 120 : 100)) {
      throw invalidQuery(`'${key}' is too long`);
    }
  }

  const guests = parseNumber(values.guests, "guests", { min: 1, max: 100, integer: true });
  const bedrooms = parseNumber(values.bedrooms, "bedrooms", { min: 0, max: 100, integer: true });
  const bathrooms = parseNumber(values.bathrooms, "bathrooms", { min: 0, max: 100, integer: true });
  const minPrice = parseNumber(values.minPrice, "minPrice", { max: 1_000_000_000_000 });
  const maxPrice = parseNumber(values.maxPrice, "maxPrice", { max: 1_000_000_000_000 });
  const minSize = parseNumber(values.minSize, "minSize", { max: 1_000_000_000 });
  const maxSize = parseNumber(values.maxSize, "maxSize", { max: 1_000_000_000 });

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw invalidQuery("'minPrice' cannot exceed 'maxPrice'");
  }
  if (minSize !== undefined && maxSize !== undefined && minSize > maxSize) {
    throw invalidQuery("'minSize' cannot exceed 'maxSize'");
  }

  const filter = {
    status: "approved",
    isActive: true,
    availability: "available",
    isDeleted: { $ne: true }
  };

  const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (purpose) filter.purpose = purpose;
  if (purpose === "short_stay" && guests !== undefined) filter.maxGuests = { $gte: guests };
  if (type) filter.type = type;
  if (values.county) filter.county = new RegExp(`^${escapeRegex(values.county)}$`, "i");
  if (values.town) filter.town = new RegExp(`^${escapeRegex(values.town)}$`, "i");
  if (bedrooms !== undefined) filter.bedrooms = { $gte: bedrooms };
  if (bathrooms !== undefined) filter.bathrooms = { $gte: bathrooms };
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }
  if (minSize !== undefined || maxSize !== undefined) {
    filter.size = {};
    if (minSize !== undefined) filter.size.$gte = minSize;
    if (maxSize !== undefined) filter.size.$lte = maxSize;
  }
  if (values.search) {
    const term = new RegExp(escapeRegex(values.search), "i");
    filter.$or = [
      { title: term },
      { description: term },
      { county: term },
      { town: term },
      { area: term },
      { type: term }
    ];
  }

  if (category === "student") {
    filter.purpose = "rent";
    filter.price = { $lte: 20000 };
    filter.type = { $in: ["studio", "bedsitter", "apartment"] };
    filter.bedrooms = { $lte: 1 };
  }
  if (category === "office" || category === "office-space") filter.type = "office";
  if (category === "family") {
    filter.purpose = "sale";
    filter.bedrooms = { $gte: 3 };
  }
  if (category === "luxury") {
    filter.purpose = "rent";
    filter.town = { $in: ["kilimani", "karen", "lavington"] };
    filter.type = { $in: ["apartment", "maisonette", "townhouse", "villa"] };
  }
  if (["maisonette", "bungalow", "villa", "studio", "townhouse"].includes(category)) {
    filter.type = category;
  }

  return { filter, page, limit, sort, appliedFilters: values };
};

const parseRecentListingQuery = (query = {}) => {
  const allowedKeys = new Set(["ids", "limit"]);
  for (const [key, value] of Object.entries(query)) {
    if (!allowedKeys.has(key) || Array.isArray(value) || (value !== null && typeof value === "object")) {
      throw invalidQuery(`Invalid recent listings query parameter: ${key}`);
    }
  }

  const limit = parseBoundedInteger(query.limit === undefined ? undefined : String(query.limit), "limit", 6, MAX_LIMIT);
  const ids = query.ids ? String(query.ids).split(",") : [];
  if (ids.length > MAX_LIMIT || ids.some((id) => !/^[a-f\d]{24}$/i.test(id))) {
    throw invalidQuery(`'ids' must contain no more than ${MAX_LIMIT} valid listing IDs`);
  }

  return { ids, limit };
};

module.exports = parsePublicListingQuery;
module.exports.MAX_PAGE = MAX_PAGE;
module.exports.MAX_LIMIT = MAX_LIMIT;
module.exports.parseRecentListingQuery = parseRecentListingQuery;
