const mongoose = require("mongoose");
const PropertyRequest = require("./propertyRequest.model");
const ListingMatch = require("./listingMatch.model");
const Listing = require("../listings/listings.model");
const { withAuthorizationTransaction } = require("../authorization/transaction.service");
const { LISTING_TYPES } = require("../listings/listing.constants");

const allowedFields = new Set([
  "purpose", "preferredLocations", "propertyTypes", "minBedrooms", "minBathrooms",
  "budgetMin", "budgetMax", "pricePeriod", "moveInDate", "stayStartDate",
  "stayEndDate", "guestCount", "requirements", "consent", "source"
]);
const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const finiteNumber = (value, field, { min = 0, max = 1_000_000_000_000, integer = false } = {}) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) throw fail(`${field} is outside the allowed range.`);
  return number;
};
const validDate = (value, field) => {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw fail(`${field} must be a valid date.`);
  return date;
};

const normalizePropertyRequest = (input = {}) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw fail("A request object is required.");
  const unknown = Object.keys(input).find((key) => !allowedFields.has(key));
  if (unknown) throw fail(`Unsupported property request field: ${unknown}`);
  const { purpose, pricePeriod } = input;
  if (!["rent", "sale", "short_stay"].includes(purpose)) throw fail("Choose rent, sale, or short stay.");
  const expectedPeriod = purpose === "rent" ? "monthly" : purpose === "sale" ? "total" : "nightly";
  if (pricePeriod !== expectedPeriod) throw fail(`Price period for ${purpose} must be ${expectedPeriod}.`);
  const budgetMax = finiteNumber(input.budgetMax, "budgetMax");
  if (budgetMax === null) throw fail("A maximum budget is required.");
  const budgetMin = finiteNumber(input.budgetMin, "budgetMin");
  if (budgetMin !== null && budgetMin > budgetMax) throw fail("Minimum budget cannot exceed maximum budget.");
  const propertyTypes = input.propertyTypes ?? [];
  if (!Array.isArray(propertyTypes) || propertyTypes.length > LISTING_TYPES.length || propertyTypes.some((type) => !LISTING_TYPES.includes(type))) throw fail("Choose valid property types.");
  const preferredLocations = input.preferredLocations ?? [];
  if (!Array.isArray(preferredLocations) || preferredLocations.length > 10) throw fail("Provide no more than 10 preferred locations.");
  const locations = preferredLocations.map((location) => {
    if (!location || typeof location !== "object" || Array.isArray(location) || Object.keys(location).some((key) => !["county", "town"].includes(key))) throw fail("Each location may contain only county and town.");
    const county = String(location.county || "").trim();
    const town = String(location.town || "").trim();
    if ((!county && !town) || county.length > 100 || town.length > 100) throw fail("Each preferred location needs a county or town, up to 100 characters.");
    return { ...(county ? { county } : {}), ...(town ? { town } : {}) };
  });
  const consent = input.consent;
  if (!consent || consent.matching !== true || Object.keys(consent).some((key) => !["matching", "notifications", "agentSharing"].includes(key)) || ["notifications", "agentSharing"].some((key) => consent[key] !== undefined && typeof consent[key] !== "boolean")) throw fail("Explicit consent to property matching is required.");
  const source = input.source || "web";
  if (!["web", "mobile", "whatsapp", "agent", "admin"].includes(source)) throw fail("Unsupported request source.");
  const moveInDate = validDate(input.moveInDate, "moveInDate");
  const stayStartDate = validDate(input.stayStartDate, "stayStartDate");
  const stayEndDate = validDate(input.stayEndDate, "stayEndDate");
  const guestCount = finiteNumber(input.guestCount, "guestCount", { min: 1, max: 100, integer: true });
  if (purpose === "short_stay" && (!stayStartDate || !stayEndDate || stayEndDate <= stayStartDate || guestCount === null)) throw fail("Short stays require valid dates and guest count.");
  return {
    purpose, preferredLocations: locations, propertyTypes: [...new Set(propertyTypes)],
    minBedrooms: finiteNumber(input.minBedrooms, "minBedrooms", { max: 100, integer: true }),
    minBathrooms: finiteNumber(input.minBathrooms, "minBathrooms", { max: 100, integer: true }),
    budgetMin, budgetMax, currency: "KES", pricePeriod, moveInDate, stayStartDate, stayEndDate, guestCount,
    requirements: String(input.requirements || "").trim().slice(0, 1200),
    consent: { matching: true, notifications: input.consent.notifications === true, agentSharing: input.consent.agentSharing === true },
    source
  };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const MATCHING_VERSION = 2;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const buildListingEligibilityFilter = (request) => {
  const filter = {
    status: "approved", isActive: true, availability: "available", isDeleted: { $ne: true },
    purpose: request.purpose,
    price: { $lte: request.budgetMax }
  };
  if (request.budgetMin !== null) filter.price.$gte = request.budgetMin;
  if (request.propertyTypes.length) filter.type = { $in: request.propertyTypes };
  if (request.minBedrooms !== null) filter.bedrooms = { $gte: request.minBedrooms };
  if (request.minBathrooms !== null) filter.bathrooms = { $gte: request.minBathrooms };
  if (request.purpose === "short_stay") filter.maxGuests = { $gte: request.guestCount };
  if (request.preferredLocations.length) {
    filter.$or = request.preferredLocations.map((location) => ({
      ...(location.county ? { county: new RegExp(`^${escapeRegex(location.county)}$`, "i") } : {}),
      ...(location.town ? { town: new RegExp(`^${escapeRegex(location.town)}$`, "i") } : {})
    }));
  }
  return filter;
};

const buildAlternativeListingFilter = (request) => {
  const flexibleLocations = request.preferredLocations.filter((location) => location.county && location.town);
  if (!flexibleLocations.length) return null;
  const requestValues = typeof request.toObject === "function" ? request.toObject() : request;
  const strictFilter = buildListingEligibilityFilter({ ...requestValues, preferredLocations: [] });
  const counties = [...new Set(flexibleLocations.map(({ county }) => county))];
  const exactLocationFilter = request.preferredLocations.map((location) => ({
    ...(location.county ? { county: new RegExp(`^${escapeRegex(location.county)}$`, "i") } : {}),
    ...(location.town ? { town: new RegExp(`^${escapeRegex(location.town)}$`, "i") } : {})
  }));
  return {
    ...strictFilter,
    $and: [
      { $or: counties.map((county) => ({ county: new RegExp(`^${escapeRegex(county)}$`, "i") })) },
      { $nor: [{ $or: exactLocationFilter }] }
    ]
  };
};

const rankEligibleListings = (request, listings) => {
  const budgetFloor = request.budgetMin ?? 0;
  const budgetRange = Math.max(1, request.budgetMax - budgetFloor);
  return listings.map((listing) => {
    const preferredLocationIndex = request.preferredLocations.findIndex((location) =>
      (!location.county || location.county.toLowerCase() === listing.county.toLowerCase()) &&
      (!location.town || location.town.toLowerCase() === listing.town.toLowerCase())
    );
    const hasPreferredLocations = request.preferredLocations.length > 0;
    const locationScore = hasPreferredLocations
      ? preferredLocationIndex < 0 ? 0 : Math.max(0, 100 - preferredLocationIndex * 10)
      : 60;
    const budgetScore = clamp((request.budgetMax - listing.price) / budgetRange, 0, 1) * 100;
    const typeScore = request.propertyTypes.length ? 100 : 60;
    const roomCriteria = [request.minBedrooms, request.minBathrooms].filter((value) => value !== null);
    const roomScore = roomCriteria.length ? 100 : 60;
    const score = Math.round(budgetScore * 0.5 + locationScore * 0.3 + typeScore * 0.1 + roomScore * 0.1);
    const reasons = ["Within your budget"];
    if (hasPreferredLocations && preferredLocationIndex >= 0) {
      const matchedLocation = request.preferredLocations[preferredLocationIndex];
      const locationLabel = matchedLocation.town || matchedLocation.county;
      if (locationLabel) reasons.push(`Preferred area: ${locationLabel}`);
    }
    if (request.propertyTypes.length) reasons.push(`Requested type: ${listing.type.replaceAll("_", " ")}`);
    if (request.minBedrooms !== null) reasons.push(`At least ${request.minBedrooms} bedrooms`);
    if (request.minBathrooms !== null) reasons.push(`At least ${request.minBathrooms} bathrooms`);
    return { listing, score, reasons, preferredLocationIndex };
  }).sort((a, b) =>
    b.score - a.score ||
    a.preferredLocationIndex - b.preferredLocationIndex ||
    a.listing.price - b.listing.price ||
    new Date(b.listing.createdAt || 0) - new Date(a.listing.createdAt || 0)
  );
};

const getOwnedRequest = (userId, requestId) => {
  if (!mongoose.isValidObjectId(requestId)) return null;
  return PropertyRequest.findOne({ _id: requestId, customer: userId });
};

const generateMatches = async (request) => {
  const listingProjection = "title description price purpose type county town area bedrooms bathrooms size sizeUnit images amenities availability maxGuests minNights";
  const exactListings = await Listing.find(buildListingEligibilityFilter(request))
    .select(listingProjection)
    .sort({ price: 1, createdAt: -1 }).limit(500).lean();
  const exactMatches = rankEligibleListings(request, exactListings).slice(0, 50)
    .map(({ listing, score, reasons }) => ({ listing, score, classification: "exact", reasons }));
  let ranked = exactMatches;
  if (!ranked.length) {
    const alternativeFilter = buildAlternativeListingFilter(request);
    if (alternativeFilter) {
      const alternativeListings = await Listing.find(alternativeFilter)
        .select(listingProjection)
        .sort({ price: 1, createdAt: -1 }).limit(500).lean();
      ranked = rankEligibleListings(request, alternativeListings).slice(0, 50).map(({ listing, score, reasons }) => ({
        listing,
        score,
        classification: "alternative",
        reasons: [`Different town in your selected county: ${listing.town}`, ...reasons]
      }));
    }
  }
  const generatedAt = new Date();
  await withAuthorizationTransaction(async (session) => {
    await ListingMatch.updateMany({ propertyRequest: request._id, invalidatedAt: null }, { $set: { invalidatedAt: generatedAt } }, { session });
    if (ranked.length) await ListingMatch.bulkWrite(ranked.map(({ listing, score, classification, reasons }) => ({
      updateOne: {
        filter: { propertyRequest: request._id, listing: listing._id, matchingVersion: MATCHING_VERSION },
        update: { $set: { score, classification, reasons, generatedAt, invalidatedAt: null } },
        upsert: true
      }
    })), { session });
    await PropertyRequest.updateOne({ _id: request._id, customer: request.customer }, { $set: { status: ranked.length ? "matched" : "active", lastMatchedAt: generatedAt } }, { session });
  });
  return ranked.map(({ listing, score, classification, reasons }) => ({ ...listing, match: { score, classification, reasons } }));
};

module.exports = { normalizePropertyRequest, buildListingEligibilityFilter, buildAlternativeListingFilter, rankEligibleListings, getOwnedRequest, generateMatches, MATCHING_VERSION };
