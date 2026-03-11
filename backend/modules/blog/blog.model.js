const mongoose = require("mongoose")
const slugify = require("slugify")

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Blog title is required"],
    trim: true
  },

  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },

  excerpt: {
    type: String,
    trim: true
  },

  content: {
    type: String,
    required: [true, "Blog content is required"]
  },

  coverImage: {
    url: String,
    public_id: String
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Author is required"]
  },

  category: {
    type: String,
    enum: ["Property Tips", "Market News", "Tenant Guide", "Landlord Guide", "Relocation"],
    default: "Property Tips"
  },

  tags: [{
    type: String,
    trim: true
  }],

  status: {
    type: String,
    enum: ["draft", "published"],
    default: "draft"
  },

  publishedAt: Date,

  views: {
    type: Number,
    default: 0
  },

  metaTitle: String,

  metaDescription: String,

  featured: {
    type: Boolean,
    default: false
  }

}, { timestamps: true })

// Full-text search
blogSchema.index({
  title: "text",
  excerpt: "text",
  content: "text",
  tags: "text"
})

// Generate slug automatically
blogSchema.pre("save", function() {

  if (this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date()
  }

})

// Formatted date
blogSchema.virtual("formattedDate").get(function () {

  if (!this.publishedAt) return null

  return this.publishedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })

})

// Reading time
blogSchema.virtual("readingTime").get(function () {

  const wordsPerMinute = 200

  const wordCount =
    this.content?.replace(/<[^>]*>/g, "").split(/\s+/).length || 0

  return Math.ceil(wordCount / wordsPerMinute)

})

module.exports = mongoose.model("Blog", blogSchema)