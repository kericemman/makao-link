const mongoose = require("mongoose");

const partnerSchema = new mongoose.Schema(
{
  companyName: {
    type: String,
    required: true
  },

  contactPerson: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  serviceType: {
    type: String,
    enum: ["moving", "cleaning"],
    required: true
  },

  description: {
    type: String,
    required: true
  },

  logo: {
    url: String,
    public_id: String
  },

  documents: [
    {
      url: String,
      public_id: String
    }
  ],

  applicationFee: {
    type: Number,
    default: 5000
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending"
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  isPublished: {
    type: Boolean,
    default: false
  }
},
{
  timestamps: true
}
)

module.exports = mongoose.model("Partner", partnerSchema)