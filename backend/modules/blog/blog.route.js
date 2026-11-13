const express = require("express");
const router = express.Router();

const {
  getPublishedBlogs,
  getPublishedBlogBySlug,
  subscribeToNewsletter,
  getAdminBlogs,
  getAdminBlogById,
  uploadBlogInlineImage,
  createBlog,
  updateBlog,
  deleteBlog,
  getNewsletterSubscribers
} = require("./blog.controller");

const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");
const upload = require("../../middleware/upload.middleware");
const uploadInlineImage = require("./blogInlineImageUpload.middleware");

// admin
router.get("/admin/all", protect, requireRole("admin"), getAdminBlogs);
router.get("/admin/subscribers", protect, requireRole("admin"), getNewsletterSubscribers);
router.post("/admin/images", protect, requireRole("admin"), uploadInlineImage, uploadBlogInlineImage);
router.get("/admin/:id", protect, requireRole("admin"), getAdminBlogById);
router.post("/admin", protect, requireRole("admin"), upload.single("coverImage"), createBlog);
router.patch("/admin/:id", protect, requireRole("admin"), upload.single("coverImage"), updateBlog);
router.delete("/admin/:id", protect, requireRole("admin"), deleteBlog);

// public
router.get("/", getPublishedBlogs);
router.post("/subscribe", subscribeToNewsletter);
router.get("/:slug", getPublishedBlogBySlug);

module.exports = router;
