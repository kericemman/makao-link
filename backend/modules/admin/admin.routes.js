const express = require("express");
const router = express.Router();
const {
  getPendingListings,
  approveListing,
  rejectListing,
  getAdminSummary,
  getLandlords,
  getAdminPayments,
  getListingHistory,
  getAdminInquiries
} = require("./admin.controller");
const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");

router.get("/summary", protect, requireRole("admin"), getAdminSummary);
router.get("/landlords", protect, requireRole("admin"), getLandlords);
router.get("/payments", protect, requireRole("admin"), getAdminPayments);
router.get("/listings/pending", protect, requireRole("admin"), getPendingListings);
router.patch("/listings/:id/approve", protect, requireRole("admin"), approveListing);
router.patch("/listings/:id/reject", protect, requireRole("admin"), rejectListing);
router.get("/listings/history", protect, requireRole("admin"), getListingHistory);
router.get("/inquiries", protect, requireRole("admin"), getAdminInquiries);

module.exports = router;