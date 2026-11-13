const mongoose = require("mongoose");

const imageAssetSchema = new mongoose.Schema({
  index: { type: Number, required: true, min: 0 },
  stagingKey: { type: String, required: true, trim: true },
  originalName: { type: String, trim: true },
  contentType: { type: String, trim: true },
  size: { type: Number, min: 0 },
  status: { type: String, enum: ["staged"], default: "staged" },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const draftSchema = new mongoose.Schema({
  landlord: {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 32 },
    businessName: { type: String, trim: true, maxlength: 120, default: "" }
  },
  package: { type: String, enum: ["normal", "basic", "premium", "pro"], required: true },
  property: { type: mongoose.Schema.Types.Mixed, required: true },
  images: { type: [String], default: [], validate: [(value) => value.length <= 30, "Maximum 30 images allowed"] },
  imageAssets: { type: [imageAssetSchema], default: [], select: false },
  status: { type: String, enum: ["draft", "submitted", "approving", "approved", "rejected"], default: "draft", index: true },
  createdByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  reviewedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt: { type: Date, default: null },
  reviewClaimedAt: { type: Date, default: null },
  landlordUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdListing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", default: null },
  reviewNote: { type: String, trim: true, maxlength: 1000, default: "" },
  accountSetupEmailSentAt: { type: Date, default: null },
  lastPropertyEditedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  lastPropertyEditedAt: { type: Date, default: null }
}, { timestamps: true, collection: "admin_assisted_listing_drafts" });

draftSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.models.AdminAssistedListingDraft || mongoose.model("AdminAssistedListingDraft", draftSchema);
