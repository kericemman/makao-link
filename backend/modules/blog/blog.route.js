const express = require("express")
const router = express.Router()

const auth = require("../../middleware/auth.middleware")
const role = require("../../middleware/role.middleware")
const upload = require("../../middleware/upload.middleware")

const {
  createBlog,
  getAdminBlogs,
  updateBlog,
  deleteBlog,
  getBlogs,
  getBlog
} = require("./blog.controller")


// Admin
router.post("/", auth, role("admin"), upload.single("coverImage"),
  createBlog
);

router.get(
  "/admin",
  auth,
  role("admin"),
  getAdminBlogs
)

router.put(
  "/:id",
  auth,
  role("admin"),
  upload.single("coverImage"),
  updateBlog
)

router.delete(
  "/:id",
  auth,
  role("admin"),
  deleteBlog
)


// Public
router.get("/", getBlogs)

router.get("/:slug", getBlog)

module.exports = router