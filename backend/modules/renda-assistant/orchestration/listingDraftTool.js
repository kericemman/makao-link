const { COUNTIES, LISTING_PURPOSES, LISTING_TYPES } = require("../../listings/listing.constants");
const { saveListingDraft } = require("../listingDraft.service");

const nullableText = { type: ["string", "null"] };
const nullableNumber = { type: ["number", "null"] };
const amenitiesSchema = {
  type: ["object", "null"],
  properties: {
    garden: { type: "boolean" },
    tarmacAccess: { type: "boolean" },
    nearSchools: { type: "boolean" },
    nearShoppingCentre: { type: "boolean" },
    nearHospital: { type: "boolean" },
    waterAvailable: { type: "boolean" },
    electricityAvailable: { type: "boolean" }
  },
  required: ["garden", "tarmacAccess", "nearSchools", "nearShoppingCentre", "nearHospital", "waterAvailable", "electricityAvailable"],
  additionalProperties: false
};

const listingDraftTool = {
  type: "function",
  name: "save_landlord_listing_draft",
  description: "Save user-provided property details as a private, resumable draft only. Use only after the user selected landlord listing and the account is verified. This never creates or publishes a listing; the landlord portal is required for photos and final submission.",
  strict: true,
  parameters: {
    type: "object",
    properties: {
      title: nullableText,
      description: nullableText,
      purpose: { type: ["string", "null"], enum: [...LISTING_PURPOSES, null] },
      maxGuests: nullableNumber,
      minNights: nullableNumber,
      checkInTime: nullableText,
      checkOutTime: nullableText,
      price: nullableNumber,
      county: { type: ["string", "null"], enum: [...COUNTIES, null] },
      town: nullableText,
      area: nullableText,
      latitude: nullableNumber,
      longitude: nullableNumber,
      type: { type: ["string", "null"], enum: [...LISTING_TYPES, null] },
      bedrooms: nullableNumber,
      bathrooms: nullableNumber,
      kitchen: { type: ["boolean", "null"] },
      size: nullableNumber,
      sizeUnit: { type: ["string", "null"], enum: ["sqft", null] },
      amenities: amenitiesSchema,
      portfolioName: nullableText,
      portfolioCategory: nullableText,
      totalUnits: nullableNumber,
      availableUnits: nullableNumber
    },
    required: [
      "title", "description", "purpose", "maxGuests", "minNights", "checkInTime", "checkOutTime",
      "price", "county", "town", "area", "latitude", "longitude", "type", "bedrooms", "bathrooms",
      "kitchen", "size", "sizeUnit", "amenities", "portfolioName", "portfolioCategory",
      "totalUnits", "availableUnits"
    ],
    additionalProperties: false
  }
};

const executeListingDraftTool = async ({ conversation, name, args }) => {
  if (name !== listingDraftTool.name) throw new TypeError("Unknown listing draft tool");
  if (!args || typeof args !== "object" || Array.isArray(args) || Object.keys(args).some((key) => !Object.hasOwn(listingDraftTool.parameters.properties, key))) {
    throw new TypeError("Invalid listing draft tool arguments");
  }
  if (conversation?.workflow?.intent !== "list_property") {
    return { saved: false, reason: "The user has not selected the property-listing flow." };
  }
  try {
    return { saved: true, ...(await saveListingDraft({ conversation, patch: args })) };
  } catch (error) {
    if (error?.statusCode) return { saved: false, reason: error.message, code: error.code || "LISTING_DRAFT_NOT_ALLOWED" };
    throw error;
  }
};

module.exports = { executeListingDraftTool, listingDraftTool };
