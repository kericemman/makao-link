const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180
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
      default: "",
      trim: true,
      maxlength: 300
    },

    content: {
      type: String,
      default: ""
    },

    coverImage: {
      type: String,
      default: ""
    },

    coverImageAlt: {
      type: String,
      trim: true,
      maxlength: 180,
      default: ""
    },

    category: { type: String, trim: true, maxlength: 60, default: "" },
    tags: { type: [String], default: [] },
    metaTitle: { type: String, trim: true, maxlength: 70, default: "" },
    metaDescription: { type: String, trim: true, maxlength: 170, default: "" },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    authorName: { type: String, trim: true, maxlength: 120, default: "" },
    authorImage: { type: String, trim: true, maxlength: 2048, default: "" },

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

blogSchema.index({ status: 1, publishedAt: -1 });

module.exports = mongoose.model("Blog", blogSchema);
