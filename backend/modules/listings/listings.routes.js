

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
const listingAccess = require("../../middleware/listingAccess.middleware");
const listingImageLimit = require("../../middleware/listingImageLimit.middleware");
const upload = require("./listingUpload.middleware");

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
  listingImageLimit,
  upload,
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
  listingAccess("listings:read"),
  getMyListingById
);



router.put(
  "/:id",
  protect,
  listingAccess("listings:update"),
  listingImageLimit,
  upload,
  updateListing
);

router.patch(
  "/:id/availability",
  protect,
  listingAccess("listings:advertise"),
  updateListingAvailability
);

router.delete(
  "/:id",
  protect,
  listingAccess("listings:update"),
  deleteListing
);

router.patch("/:id/mark-taken", protect, listingAccess("listings:advertise"), markListingTaken);
router.patch("/:id/mark-available", protect, listingAccess("listings:advertise"), markListingAvailable);

router.get("/:id", getListingById);

module.exports = router;
