const express = require("express");
const router = express.Router();

const {
  getPublishedBlogs,
  getPublishedBlogBySlug,
  subscribeToNewsletter,
  getAdminBlogs,
  getAdminBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getNewsletterSubscribers
} = require("./blog.controller");

const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");
const upload = require("../../middleware/upload.middleware");

// public
router.get("/", getPublishedBlogs);
router.get("/:slug", getPublishedBlogBySlug);
router.post("/subscribe", subscribeToNewsletter);

// admin
router.get("/admin/all", protect, requireRole("admin"), getAdminBlogs);
router.get("/admin/subscribers", protect, requireRole("admin"), getNewsletterSubscribers);
router.get("/admin/:id", protect, requireRole("admin"), getAdminBlogById);
router.post("/admin", protect, requireRole("admin"), upload.single("coverImage"), createBlog);
router.patch("/admin/:id", protect, requireRole("admin"), upload.single("coverImage"), updateBlog);
router.delete("/admin/:id", protect, requireRole("admin"), deleteBlog);

module.exports = router;