const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property"
  }
}, { timestamps: true });

module.exports = mongoose.model("Inquiry", inquirySchema);