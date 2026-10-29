

const express = require("express");
const router = express.Router();

const {
  getListingMeta,
  getPublicListings,
  getListingById,
  getMyListingById,
  createListing,
  importListingsCsv,
  getMyListings,
  groupMyPortfolioListings,
  updateListing,
  deleteListing,
  updateListingAvailability,
  markListingTaken,
  markListingAvailable,
  getFeaturedListings,
  getRecentListings,
  getNearbyListings
  
} = require("./listings.controller");

const { protect } = require("../../middleware/auth.middleware");
const landlordWorkspace = require("../../middleware/landlordWorkspace.middleware");
const upload = require("../../middleware/upload.middleware");

// public
router.get("/meta", getListingMeta);
router.get("/recent", getRecentListings);
router.get("/featured", getFeaturedListings);
router.get("/nearby", getNearbyListings);
router.get("/", getPublicListings);

// landlord
router.patch(
  "/landlord/portfolio/group",
  protect,
  landlordWorkspace("listings"),
  groupMyPortfolioListings
);
router.get("/landlord/my/all", protect, landlordWorkspace("listings"), getMyListings);
router.post("/landlord/import-csv", protect, landlordWorkspace("team"), importListingsCsv);
router.post(
  "/",
  protect,
  landlordWorkspace("listings"),
  upload.array("images", 10),
  createListing
);

router.get(
  "/landlord/my",
  protect,
  landlordWorkspace("listings"),
  getMyListings
);

router.get(
  "/landlord/:id",
  protect,
  landlordWorkspace("listings"),
  getMyListingById
);



router.put(
  "/:id",
  protect,
  landlordWorkspace("listings"),
  upload.array("images", 10),
  updateListing
);

router.patch(
  "/:id/availability",
  protect,
  landlordWorkspace("listings"),
  updateListingAvailability
);

router.delete(
  "/:id",
  protect,
  landlordWorkspace("listings"),
  deleteListing
);

router.patch("/:id/mark-taken", protect, landlordWorkspace("listings"), markListingTaken);
router.patch("/:id/mark-available", protect, landlordWorkspace("listings"), markListingAvailable);

router.get("/:id", getListingById);

module.exports = router;
