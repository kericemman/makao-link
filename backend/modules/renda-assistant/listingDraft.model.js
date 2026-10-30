const mongoose = require("mongoose");
const { COUNTIES, LISTING_PURPOSES, LISTING_TYPES, OFFICE_SIZE_UNITS } = require("../listings/listing.constants");

const amenitiesSchema = new mongoose.Schema({
  garden: { type: Boolean, default: false },
  tarmacAccess: { type: Boolean, default: false },
  nearSchools: { type: Boolean, default: false },
  nearShoppingCentre: { type: Boolean, default: false },
  nearHospital: { type: Boolean, default: false },
  waterAvailable: { type: Boolean, default: true },
  electricityAvailable: { type: Boolean, default: true }
}, { _id: false, strict: "throw" });

const fieldsSchema = new mongoose.Schema({
  title: { type: String, trim: true, maxlength: 180, default: "" },
  description: { type: String, trim: true, maxlength: 5000, default: "" },
  purpose: { type: String, enum: [...LISTING_PURPOSES, ""], default: "" },
  maxGuests: { type: Number, min: 1, max: 100, default: null },
  minNights: { type: Number, min: 1, max: 365, default: null },
  checkInTime: { type: String, trim: true, maxlength: 5, default: "15:00" },
  checkOutTime: { type: String, trim: true, maxlength: 5, default: "10:00" },
  price: { type: Number, min: 0, max: 1000000000000, default: null },
  county: { type: String, enum: [...COUNTIES, ""], default: "" },
  town: { type: String, trim: true, maxlength: 100, default: "" },
  area: { type: String, trim: true, maxlength: 120, default: "" },
  latitude: { type: Number, min: -90, max: 90, default: null },
  longitude: { type: Number, min: -180, max: 180, default: null },
  type: { type: String, enum: [...LISTING_TYPES, ""], default: "" },
  bedrooms: { type: Number, min: 0, max: 100, default: null },
  bathrooms: { type: Number, min: 0, max: 100, default: null },
  kitchen: { type: Boolean, default: true },
  size: { type: Number, min: 0, max: 1000000000, default: null },
  sizeUnit: { type: String, enum: [...OFFICE_SIZE_UNITS, ""], default: "" },
  contactPhone: { type: String, trim: true, maxlength: 30, default: "" },
  amenities: { type: amenitiesSchema, default: () => ({}) },
  portfolioName: { type: String, trim: true, maxlength: 80, default: "" },
  portfolioCategory: { type: String, trim: true, maxlength: 60, default: "" },
  totalUnits: { type: Number, min: 1, max: 5000, default: 1 },
  availableUnits: { type: Number, min: 0, max: 5000, default: 1 }
}, { _id: false, strict: "throw" });

const listingDraftSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "RendaAssistantConversation", required: true, index: true },
  landlord: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fields: { type: fieldsSchema, default: () => ({}) },
  status: { type: String, enum: ["collecting", "submitted", "cancelled"], default: "collecting", index: true },
  revision: { type: Number, min: 0, default: 0 },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", default: null },
  expiresAt: { type: Date, required: true }
}, { timestamps: true, strict: "throw" });

listingDraftSchema.index({ conversation: 1 }, {
  unique: true,
  partialFilterExpression: { status: "collecting" }
});
listingDraftSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
listingDraftSchema.index({ landlord: 1, updatedAt: -1 });

module.exports = mongoose.model("RendaAssistantListingDraft", listingDraftSchema);
