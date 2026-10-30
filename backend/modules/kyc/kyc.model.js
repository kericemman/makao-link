const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema({
  publicId: { type: String, trim: true },
  resourceType: { type: String, enum: ["image", "raw"] },
  format: { type: String, trim: true }
}, { _id: false });

const kycSchema = new mongoose.Schema(
  {
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    idType: {
      type: String,
      enum: ["national_id", "passport", "drivers_license"],
      required: true
    },

    idNumber: {
      type: String,
      required: true,
      trim: true
    },

    fullName: {
      type: String,
      required: true,
      trim: true
    },

    documentFront: {
      type: String,
      required: true
    },

    documentBack: {
      type: String
    },

    selfiePhoto: {
      type: String,
      required: true
    },

    proofOfOwnership: {
      type: String
    },

    documentAssets: {
      documentFront: assetSchema,
      documentBack: assetSchema,
      selfiePhoto: assetSchema,
      proofOfOwnership: assetSchema
    },

    status: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "pending"
    },

    rejectionReason: {
      type: String,
      default: ""
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    reviewedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Kyc", kycSchema);
