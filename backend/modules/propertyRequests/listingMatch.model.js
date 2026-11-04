const mongoose = require("mongoose");

const listingMatchSchema = new mongoose.Schema({
  propertyRequest: { type: mongoose.Schema.Types.ObjectId, ref: "PropertyRequest", required: true },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
  matchingVersion: { type: Number, required: true },
  score: { type: Number, min: 0, max: 100, required: true },
  classification: { type: String, enum: ["exact", "alternative"], required: true },
  reasons: [{ type: String, maxlength: 100 }],
  invalidatedAt: { type: Date, default: null },
  generatedAt: { type: Date, default: Date.now, required: true }
}, { timestamps: true, versionKey: false });

listingMatchSchema.index({ propertyRequest: 1, listing: 1, matchingVersion: 1 }, { unique: true });
listingMatchSchema.index({ propertyRequest: 1, invalidatedAt: 1, score: -1 });
module.exports = mongoose.model("ListingMatch", listingMatchSchema);
