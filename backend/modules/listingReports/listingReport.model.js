const mongoose = require("mongoose");

const listingReportSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true
    },
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    reason: {
      type: String,
      enum: [
        "unavailable",
        "wrong_price",
        "wrong_location",
        "fake_photos",
        "landlord_unreachable",
        "agent_issue",
        "other"
      ],
      required: true,
      index: true
    },
    message: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1200
    },
    name: {
      type: String,
      default: "",
      trim: true
    },
    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      default: "",
      trim: true
    },
    status: {
      type: String,
      enum: ["new", "reviewing", "resolved", "dismissed"],
      default: "new",
      index: true
    },
    adminNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1200
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ListingReport", listingReportSchema);
