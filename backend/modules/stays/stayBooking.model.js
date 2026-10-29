const mongoose = require("mongoose");

const stayBookingSchema = new mongoose.Schema({
  requestCode: { type: String, required: true, unique: true, index: true },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
  landlord: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  guestName: { type: String, required: true, trim: true, maxlength: 100 },
  guestEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
  guestPhone: { type: String, required: true, trim: true, maxlength: 30 },
  checkIn: { type: Date, required: true, index: true },
  checkOut: { type: Date, required: true, index: true },
  guests: { type: Number, required: true, min: 1 },
  message: { type: String, trim: true, maxlength: 1200, default: "" },
  status: { type: String, enum: ["requested", "confirmed", "declined", "cancelled", "completed"], default: "requested", index: true }
}, { timestamps: true });

stayBookingSchema.index({ listing: 1, status: 1, checkIn: 1, checkOut: 1 });
stayBookingSchema.index({ landlord: 1, createdAt: -1 });

module.exports = mongoose.model("StayBooking", stayBookingSchema);
