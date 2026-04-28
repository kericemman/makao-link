const mongoose = require("mongoose");

const policyPageSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    isPublished: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PolicyPage", policyPageSchema);