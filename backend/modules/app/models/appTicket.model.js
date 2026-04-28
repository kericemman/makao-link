const mongoose = require("mongoose");

const AppTicketSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportCategory",
      required: true
    },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    source: {
      type: String,
      enum: ["mobile_app", "website"],
      default: "mobile_app"
    },
    status: {
      type: String,
      enum: ["open", "reviewing", "resolved"],
      default: "open"
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AppTicket", AppTicketSchema);