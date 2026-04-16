const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },

    excerpt: {
      type: String,
      required: true,
      trim: true
    },

    content: {
      type: String,
      required: true
    },

    coverImage: {
      type: String,
      default: ""
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft"
    },

    publishedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", blogSchema);