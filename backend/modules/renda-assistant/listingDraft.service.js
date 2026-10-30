const mongoose = require("mongoose");
const Draft = require("./listingDraft.model");
const Conversation = require("./conversation.model");
const User = require("../users/user.model");
const Listing = require("../listings/listings.model");
const { canCreateListing } = require("../subscriptions/subscription.service");
const { COUNTY_TOWNS, COUNTIES, LISTING_PURPOSES, LISTING_TYPES, RESIDENTIAL_TYPES, OFFICE_SIZE_UNITS } = require("../listings/listing.constants");
const { expiryFrom } = require("./rendaAssistant.service");

const DRAFT_FIELDS = new Set([
  "title", "description", "purpose", "maxGuests", "minNights", "checkInTime", "checkOutTime",
  "price", "county", "town", "area", "latitude", "longitude", "type", "bedrooms", "bathrooms",
  "kitchen", "size", "sizeUnit", "contactPhone", "amenities", "portfolioName", "portfolioCategory",
  "totalUnits", "availableUnits"
]);
const AMENITIES = new Set(["garden", "tarmacAccess", "nearSchools", "nearShoppingCentre", "nearHospital", "waterAvailable", "electricityAvailable"]);
const REQUIRED_BASE = ["title", "description", "purpose", "price", "county", "town", "type", "contactPhone"];

class ListingDraftAccessError extends Error {
  constructor(message, statusCode = 403, code = "LISTING_DRAFT_NOT_ALLOWED") {
    super(message);
    this.name = "ListingDraftAccessError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

const normalizeText = (value, name, maxLength) => {
  if (typeof value !== "string") throw new TypeError(`Invalid ${name}`);
  const result = value.trim();
  if (result.length > maxLength) throw new TypeError(`${name} is too long`);
  return result;
};

const normalizeNumber = (value, name, { min = 0, max = 1_000_000_000_000, integer = false } = {}) => {
  if (value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) {
    throw new TypeError(`Invalid ${name}`);
  }
  return number;
};

const normalizeListingDraftPatch = (patch, { plan = "normal" } = {}) => {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) throw new TypeError("Invalid listing draft fields");
  if (Object.keys(patch).some((key) => !DRAFT_FIELDS.has(key))) throw new TypeError("Unsupported listing draft field");
  const values = {};
  const textFields = {
    title: 180, description: 5000, town: 100, area: 120, contactPhone: 30,
    checkInTime: 5, checkOutTime: 5, portfolioName: 80, portfolioCategory: 60
  };
  for (const [key, maxLength] of Object.entries(textFields)) {
    if (Object.hasOwn(patch, key) && patch[key] !== null) values[key] = normalizeText(patch[key], key, maxLength);
  }

  if (Object.hasOwn(patch, "purpose") && patch.purpose !== null) {
    const purpose = patch.purpose === "bnb" || patch.purpose === "short_term" ? "short_stay" : patch.purpose;
    if (purpose !== "" && !LISTING_PURPOSES.includes(purpose)) throw new TypeError("Invalid listing purpose");
    values.purpose = purpose;
  }
  if (Object.hasOwn(patch, "type") && patch.type !== null) {
    const type = patch.type === "office-space" ? "office" : patch.type;
    if (type !== "" && !LISTING_TYPES.includes(type)) throw new TypeError("Invalid listing type");
    values.type = type;
  }
  if (Object.hasOwn(patch, "county") && patch.county !== null) {
    const county = String(patch.county).trim().toLowerCase().replace(/\s+county$/i, "");
    if (county !== "" && !COUNTIES.includes(county)) throw new TypeError("Invalid county");
    values.county = county;
  }
  if (Object.hasOwn(patch, "town") && patch.town !== null) {
    values.town = String(patch.town).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (values.town.length > 100) throw new TypeError("town is too long");
  }

  for (const key of ["price", "bedrooms", "bathrooms", "size", "latitude", "longitude"]) {
    if (Object.hasOwn(patch, key) && patch[key] !== null) {
      const limits = {
        price: { max: 1_000_000_000_000 }, bedrooms: { max: 100 }, bathrooms: { max: 100 },
        size: { max: 1_000_000_000 }, latitude: { min: -90, max: 90 }, longitude: { min: -180, max: 180 }
      };
      values[key] = normalizeNumber(patch[key], key, limits[key]);
    }
  }
  for (const key of ["maxGuests", "minNights", "totalUnits", "availableUnits"]) {
    if (Object.hasOwn(patch, key) && patch[key] !== null) {
      const limits = {
        maxGuests: { min: 1, max: 100, integer: true }, minNights: { min: 1, max: 365, integer: true },
        totalUnits: { min: 1, max: 5000, integer: true }, availableUnits: { min: 0, max: 5000, integer: true }
      };
      values[key] = normalizeNumber(patch[key], key, limits[key]);
    }
  }
  if (Object.hasOwn(patch, "sizeUnit") && patch.sizeUnit !== null) {
    if (patch.sizeUnit !== "" && !OFFICE_SIZE_UNITS.includes(patch.sizeUnit)) throw new TypeError("Invalid size unit");
    values.sizeUnit = patch.sizeUnit;
  }
  if (Object.hasOwn(patch, "kitchen") && patch.kitchen !== null) {
    if (typeof patch.kitchen !== "boolean") throw new TypeError("Invalid kitchen value");
    values.kitchen = patch.kitchen;
  }
  if (Object.hasOwn(patch, "amenities") && patch.amenities !== null) {
    if (typeof patch.amenities !== "object" || Array.isArray(patch.amenities) || Object.keys(patch.amenities).some((key) => !AMENITIES.has(key))) {
      throw new TypeError("Invalid listing amenities");
    }
    values.amenities = {};
    for (const [key, value] of Object.entries(patch.amenities)) {
      if (typeof value !== "boolean") throw new TypeError(`Invalid amenity: ${key}`);
      values.amenities[key] = value;
    }
  }

  if ((values.county || patch.county) && (values.town || patch.town)) {
    const county = values.county || String(patch.county).trim().toLowerCase().replace(/\s+county$/i, "");
    const town = values.town || String(patch.town).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!(COUNTY_TOWNS[county] || []).includes(town)) throw new TypeError("Town does not match the selected county");
  }
  const advanced = ["premium", "pro"].includes(plan);
  if (!advanced && ["portfolioName", "portfolioCategory", "totalUnits", "availableUnits"].some((key) => {
    const value = values[key];
    return value !== undefined && value !== "" && !(key === "totalUnits" && value === 1) && !(key === "availableUnits" && value === 1);
  })) {
    throw new ListingDraftAccessError("Building inventory requires an active Premium or Pro plan.", 403, "ADVANCED_PLAN_REQUIRED");
  }
  const total = values.totalUnits;
  const available = values.availableUnits;
  if (total !== undefined && available !== undefined && available > total) throw new TypeError("Available units cannot exceed total units");
  return values;
};

const getMissingListingFields = (fields = {}) => {
  const required = [...REQUIRED_BASE];
  if (RESIDENTIAL_TYPES.includes(fields.type)) required.push("bedrooms", "bathrooms");
  if (fields.type === "office") required.push("size");
  if (fields.purpose === "short_stay") required.push("maxGuests", "minNights");
  return [...new Set(required.filter((key) => fields[key] === null || fields[key] === undefined || fields[key] === ""))];
};

const resolveDraftOwner = async (conversation, UserModel) => {
  if (!conversation || conversation.accountLinkStatus !== "verified" || !conversation.linkedUser || conversation.serviceConsent !== "granted") {
    throw new ListingDraftAccessError("Link your landlord account and grant assistant consent before saving a property draft.");
  }
  const actor = await UserModel.findById(conversation.linkedUser).select("_id role landlordOwner teamRole teamStatus teamPermissions").lean();
  if (!actor) throw new ListingDraftAccessError("The linked landlord account could not be verified.");
  if (actor.role === "landlord") return { actor, owner: actor };
  if (actor.role === "landlord_staff" && actor.teamStatus === "active" && actor.landlordOwner && actor.teamRole !== "viewer" &&
      (!actor.teamPermissions?.length || actor.teamPermissions.includes("listings"))) {
    const owner = await UserModel.findById(actor.landlordOwner).select("_id role").lean();
    if (owner?.role === "landlord") return { actor, owner };
  }
  throw new ListingDraftAccessError("Use an active landlord account with property-listing permission to save a draft.");
};

const toPortalUrl = (draftId) => {
  const portal = String(process.env.LANDLORD_CLIENT_URL || "https://landlord.rendahomes.com").replace(/\/$/, "");
  const next = `/listings/new?draftId=${encodeURIComponent(String(draftId))}`;
  return `${portal}/login?next=${encodeURIComponent(next)}`;
};

const saveListingDraft = async ({ conversation, patch, now = new Date(), UserModel = User, DraftModel = Draft, canCreate = canCreateListing } = {}) => {
  const { actor, owner } = await resolveDraftOwner(conversation, UserModel);
  const eligibility = await canCreate(owner);
  if (!eligibility.allowed) throw new ListingDraftAccessError(eligibility.message, 403, eligibility.code || "LISTING_NOT_ALLOWED");
  const plan = eligibility.subscription?.plan || "normal";
  const existing = await DraftModel.findOne({ conversation: conversation._id, status: "collecting" }).lean();
  if (existing && String(existing.landlord) !== String(owner._id)) {
    throw new ListingDraftAccessError("This conversation already has a property draft being updated. Please retry.", 409, "DRAFT_CONFLICT");
  }
  const normalizedPatch = normalizeListingDraftPatch(patch, { plan });
  if (!Object.keys(normalizedPatch).length) throw new TypeError("Provide at least one property detail to save");
  const fields = normalizeListingDraftPatch({ ...(existing?.fields || {}), ...normalizedPatch }, { plan });

  const $set = Object.fromEntries(Object.entries(fields).map(([key, value]) => [`fields.${key}`, value]));
  try {
    const draft = await DraftModel.findOneAndUpdate(
      { conversation: conversation._id, landlord: owner._id, status: "collecting" },
      {
        $set: { ...$set, landlord: owner._id, createdBy: actor._id, expiresAt: expiryFrom(now) },
        $setOnInsert: { conversation: conversation._id, status: "collecting" },
        $inc: { revision: 1 }
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();
    const missingFields = getMissingListingFields(draft.fields);
    return {
      draftId: String(draft._id),
      revision: draft.revision,
      status: draft.status,
      fields: draft.fields,
      missingFields,
      portalUrl: toPortalUrl(draft._id),
      mediaInstruction: "Add property photos in the secure landlord portal before submitting."
    };
  } catch (error) {
    if (error?.code !== 11000) throw error;
    throw new ListingDraftAccessError("This conversation already has a property draft being updated. Please retry.", 409, "DRAFT_CONFLICT");
  }
};

const getOwnedListingDraft = async ({ draftId, landlordId, DraftModel = Draft } = {}) => {
  if (typeof draftId !== "string" || !/^[a-f\d]{24}$/i.test(draftId)) throw new ListingDraftAccessError("Listing draft not found.", 404);
  const draft = await DraftModel.findOne({ _id: draftId, landlord: landlordId, status: "collecting", expiresAt: { $gt: new Date() } }).lean();
  if (!draft) throw new ListingDraftAccessError("Listing draft not found.", 404);
  return { ...draft, missingFields: getMissingListingFields(draft.fields) };
};

const markListingDraftSubmitted = async ({ draftId, landlordId, actorId, listingId, DraftModel = Draft, ListingModel = Listing } = {}) => {
  if (!mongoose.isValidObjectId(draftId) || !mongoose.isValidObjectId(listingId)) throw new ListingDraftAccessError("The submitted listing could not be verified.", 404);
  const listing = await ListingModel.findOne({ _id: listingId, landlord: landlordId, createdBy: actorId, status: "pending" }).select("_id").lean();
  if (!listing) throw new ListingDraftAccessError("The submitted listing could not be verified.", 404);
  const draft = await DraftModel.findOneAndUpdate(
    { _id: draftId, landlord: landlordId, status: "collecting", expiresAt: { $gt: new Date() } },
    { $set: { status: "submitted", listing: listing._id } },
    { new: true }
  ).lean();
  if (!draft) {
    const existing = await DraftModel.findOne({ _id: draftId, landlord: landlordId, status: "submitted", listing: listing._id }).lean();
    if (existing) return { draftId: String(existing._id), listingId: String(listing._id), status: existing.status };
    throw new ListingDraftAccessError("Listing draft not found.", 404);
  }
  return { draftId: String(draft._id), listingId: String(listing._id), status: draft.status };
};

module.exports = {
  DRAFT_FIELDS,
  ListingDraftAccessError,
  getMissingListingFields,
  getOwnedListingDraft,
  markListingDraftSubmitted,
  normalizeListingDraftPatch,
  resolveDraftOwner,
  saveListingDraft,
  toPortalUrl
};
