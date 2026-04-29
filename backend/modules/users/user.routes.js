// const express = require("express");
// const router = express.Router();

// const auth = require("../../middleware/auth.middleware");

// const {
//   updateProfile
// } = require("./user.controller");

// router.put("/profile", auth, updateProfile);

// module.exports = router;

const express = require("express");
const router = express.Router();

const {
  getProfile,
  updateProfile,
  changePassword
} = require("./user.controller");

const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");
const upload = require("../../middleware/upload.middleware");

router.get("/profile", protect, requireRole("landlord", "admin", "user"), getProfile);
router.patch(
  "/profile",
  protect,
  requireRole("landlord", "admin"),
  upload.single("avatar"),
  updateProfile
);
router.patch(
  "/change-password",
  protect,
  requireRole("landlord", "admin"),
  changePassword
);

module.exports = router;