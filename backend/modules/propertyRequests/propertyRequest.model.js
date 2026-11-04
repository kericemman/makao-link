const mongoose = require("mongoose");
const { LISTING_TYPES } = require("../listings/listing.constants");

const propertyRequestSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  source: { type: String, enum: ["web", "mobile", "whatsapp", "agent", "admin"], required: true, default: "web" },
  purpose: { type: String, enum: ["rent", "sale", "short_stay"], required: true, index: true },
  preferredLocations: [{ county: { type: String, trim: true, maxlength: 100 }, town: { type: String, trim: true, maxlength: 100 } }],
  propertyTypes: [{ type: String, enum: LISTING_TYPES }],
  minBedrooms: { type: Number, min: 0, max: 100, default: null },
  minBathrooms: { type: Number, min: 0, max: 100, default: null },
  budgetMin: { type: Number, min: 0, max: 1_000_000_000_000, default: null },
  budgetMax: { type: Number, min: 0, max: 1_000_000_000_000, required: true },
  currency: { type: String, enum: ["KES"], default: "KES", required: true },
  pricePeriod: { type: String, enum: ["total", "monthly", "nightly"], required: true },
  moveInDate: { type: Date, default: null },
  stayStartDate: { type: Date, default: null },
  stayEndDate: { type: Date, default: null },
  guestCount: { type: Number, min: 1, max: 100, default: null },
  requirements: { type: String, trim: true, maxlength: 1200, default: "" },
  idempotencyKeyHash: { type: String, default: null, select: false },
  idempotencyPayloadHash: { type: String, default: null, select: false },
  lastMatchedAt: { type: Date, default: null },
  consent: {
    matching: { type: Boolean, required: true, default: false },
    notifications: { type: Boolean, default: false },
    agentSharing: { type: Boolean, default: false }
  },
  status: { type: String, enum: ["active", "matching", "matched", "viewing_in_progress", "closed", "cancelled", "expired"], default: "active", index: true },
  expiresAt: { type: Date, default: null, index: true }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { transform: (_document, value) => {
    delete value.idempotencyKeyHash;
    delete value.idempotencyPayloadHash;
    return value;
  } }
});

propertyRequestSchema.index({ customer: 1, status: 1, updatedAt: -1 });
propertyRequestSchema.index({ customer: 1, idempotencyKeyHash: 1 }, { unique: true, partialFilterExpression: { idempotencyKeyHash: { $type: "string" } } });
module.exports = mongoose.model("PropertyRequest", propertyRequestSchema);
