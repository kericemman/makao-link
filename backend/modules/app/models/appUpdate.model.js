const mongoose = require("mongoose");

const appUpdateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Product Update", "News", "Announcement", "Maintenance"],
      default: "Product Update"
    },
    isPublished: { type: Boolean, default: true },
    publishedAt: { type: Date, default: null },
    emailNotifiedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AppUpdate", appUpdateSchema);
