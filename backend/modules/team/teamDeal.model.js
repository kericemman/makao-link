const mongoose = require("mongoose");

const teamDealSchema = new mongoose.Schema({
  landlord: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  outcome: { type: String, enum: ["rented", "sold"], required: true },
  units: { type: Number, min: 1, default: 1 },
  amount: { type: Number, min: 0, required: true },
  closedAt: { type: Date, default: Date.now },
  notes: { type: String, trim: true, maxlength: 1000, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("TeamDeal", teamDealSchema);
