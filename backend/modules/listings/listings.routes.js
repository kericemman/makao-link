

const express = require("express");
const router = express.Router();

const {
  getListingMeta,
  getPublicListings,
  getListingById,
  getMyListingById,
  createListing,
  getMyListings,
  updateListing,
  deleteListing,
  updateListingAvailability,
  markListingTaken,
  markListingAvailable
  
} = require("./listings.controller");

const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");
const upload = require("../../middleware/upload.middleware");

// public
router.get("/meta", getListingMeta);
router.get("/", getPublicListings);
router.get("/:id", getListingById);

// landlord
router.get("/landlord/my/all", protect, requireRole("landlord"), getMyListings);
router.post(
  "/",
  protect,
  requireRole("landlord"),
  upload.array("images", 5),
  createListing
);

router.get(
  "/landlord/my",
  protect,
  requireRole("landlord"),
  getMyListings
);

router.get(
  "/landlord/:id",
  protect,
  requireRole("landlord"),
  getMyListingById
);

router.put(
  "/:id",
  protect,
  requireRole("landlord"),
  upload.array("images", 5),
  updateListing
);

router.patch(
  "/:id/availability",
  protect,
  requireRole("landlord"),
  updateListingAvailability
);

router.delete(
  "/:id",
  protect,
  requireRole("landlord"),
  deleteListing
);

router.patch("/:id/mark-taken", protect, requireRole("landlord"), markListingTaken);
router.patch("/:id/mark-available", protect, requireRole("landlord"), markListingAvailable);

module.exports = router;