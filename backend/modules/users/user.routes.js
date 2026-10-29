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
  changePassword,
  getWhatsAppUpdatePreference,
  updateWhatsAppUpdatePreference,
  getSavedListings,
  saveListing,
  removeSavedListing
} = require("./user.controller");

const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");
const upload = require("../../middleware/upload.middleware");
const protectSavedHomes = require("../../middleware/savedHomes.middleware");

router.get("/saved-listings", protectSavedHomes, getSavedListings);
router.put("/saved-listings/:listingId", protectSavedHomes, saveListing);
router.delete("/saved-listings/:listingId", protectSavedHomes, removeSavedListing);

router.get("/profile", protect, requireRole("landlord", "admin", "user"), getProfile);
router.patch(
  "/profile",
  protect,
  requireRole("landlord", "admin", "user"),
  upload.single("avatar"),
  updateProfile
);
router.get(
  "/whatsapp-updates",
  protect,
  requireRole("landlord"),
  getWhatsAppUpdatePreference
);
router.patch(
  "/whatsapp-updates",
  protect,
  requireRole("landlord"),
  updateWhatsAppUpdatePreference
);
router.patch(
  "/change-password",
  protect,
  requireRole("landlord", "admin"),
  changePassword
);

module.exports = router;
