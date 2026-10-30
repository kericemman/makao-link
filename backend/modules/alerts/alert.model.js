const mongoose = require("mongoose");

const alertReplySchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    senderRole: {
      type: String,
      enum: ["user", "landlord", "admin"],
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

const alertSchema = new mongoose.Schema(
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
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    source: {
      type: String,
      enum: ["user_portal", "mobile_app", "whatsapp_assistant"],
      default: "user_portal",
      index: true
    },
    sourceKey: { type: String, select: false, default: undefined },
    replies: {
      type: [alertReplySchema],
      default: []
    },
    readByUser: {
      type: Boolean,
      default: true
    },
    readByLandlord: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

alertSchema.index(
  { source: 1, sourceKey: 1 },
  { unique: true, partialFilterExpression: { sourceKey: { $type: "string" } } }
);

module.exports = mongoose.model("AppAlert", alertSchema);
