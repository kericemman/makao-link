const mongoose = require("mongoose")

const replySchema = new mongoose.Schema({

  sender: {
    type: String,
    enum: ["admin", "landlord"]
  },

  message: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

})

const ticketSchema = new mongoose.Schema({

  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  subject: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  category: {
    type: String,
    enum: [
      "payment",
      "listing",
      "account",
      "technical",
      "general"
    ],
    default: "general"
  },

  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },

  status: {
    type: String,
    enum: [
      "open",
      "in_progress",
      "resolved",
      "closed"
    ],
    default: "open"
  },

  replies: [replySchema]

}, { timestamps: true })

module.exports = mongoose.model("Ticket", ticketSchema)