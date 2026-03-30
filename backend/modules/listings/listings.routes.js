const express = require("express");
const router = express.Router();

const {
  getPublicListings,
  getListingById,
  createListing,
  getMyListings,
  updateListing,
  deleteListing,
  markListingTaken,
  markListingAvailable
} = require("./listings.controller");

const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");
const upload = require("../../middleware/upload.middleware");

// Public routes
router.get("/", getPublicListings);

// Landlord routes
router.get("/landlord/my/all", protect, requireRole("landlord"), getMyListings);
router.get("/:id", getListingById);
router.post("/", protect, requireRole("landlord"), upload.array("images", 5), createListing);
router.put("/:id", protect, requireRole("landlord"), upload.array("images", 5), updateListing);
router.delete("/:id", protect, requireRole("landlord"), deleteListing);
router.patch("/:id/mark-taken", protect, requireRole("landlord"), markListingTaken);
router.patch("/:id/mark-available", protect, requireRole("landlord"), markListingAvailable);

// Public single listing route last
router.get("/:id", getListingById);

module.exports = router;