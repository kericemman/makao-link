const mongoose = require("mongoose");

const trafficDailySchema = new mongoose.Schema({
  day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  path: { type: String, required: true, maxlength: 40 },
  source: { type: String, required: true, enum: ["direct", "google", "bing", "facebook", "instagram", "tiktok", "linkedin", "whatsapp", "email", "referral", "other"] },
  medium: { type: String, required: true, enum: ["direct", "organic", "paid", "social", "referral", "messaging", "email", "other"] },
  views: { type: Number, required: true, min: 1, default: 0 }
}, { timestamps: true, collection: "traffic_daily" });

trafficDailySchema.index({ day: 1, path: 1, source: 1, medium: 1 }, { unique: true });
trafficDailySchema.index({ day: -1 });

module.exports = mongoose.models.TrafficDaily || mongoose.model("TrafficDaily", trafficDailySchema);
