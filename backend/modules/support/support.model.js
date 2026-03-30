const mongoose = require("mongoose");

const supportMessageSchema = new mongoose.Schema(
  {
    senderRole: {
      type: String,
      enum: ["landlord", "admin"],
      required: true
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

const supportTicketSchema = new mongoose.Schema(
  {
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    subject: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      enum: ["billing", "listing", "technical", "account", "other"],
      default: "other"
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open"
    },

    messages: [supportMessageSchema],

    lastReplyAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportTicket", supportTicketSchema);