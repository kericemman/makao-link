const mongoose = require("mongoose");

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    source: {
      type: String,
      enum: ["mobile_app", "website"],
      default: "mobile_app"
    },
    sources: {
      type: [{ type: String, enum: ["mobile_app", "website"] }],
      default: []
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscriber", subscriberSchema);
