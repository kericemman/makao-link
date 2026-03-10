const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    price: {
      type: Number,
      required: true,
      index: true
    },

    propertyType: {
      type: String,
      enum: ["apartment", "bedsitter", "studio", "house", "villa"],
      required: true
    },

    bedrooms: {
      type: Number,
      default: 0,
      index: true
    },

    bathrooms: {
      type: Number,
      default: 1
    },

    city: {
      type: String,
      required: true,
      index: true
    },

    location: {
      type: String,
      required: true
    },

    amenities:{
        type: [String],
        enum: ["wifi", "parking", "security", "gym", "pool", "laundry", "elevator", "balcony", "furnished", "unfurnished", "tarraced", "duplex", "penthouse", "school", "hospital", "market", "public_transport"],
        default: []
    },

    images: [
      {
        url: String,
        public_id: String
      }
    ],

    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    isFeatured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Property", propertySchema);