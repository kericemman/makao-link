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
  getAdminInquiries,
  getServiceApplications,
  getServiceApplicationById,
  approveServiceApplication,
  rejectServiceApplication,
  getAllListings,
  getAdminSubscriptions,
  getRecentActivity
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


router.get("/service-applications", protect, requireRole("admin"), getServiceApplications);
router.get("/service-applications/:id", protect, requireRole("admin"), getServiceApplicationById);
router.patch("/service-applications/:id/approve", protect, requireRole("admin"), approveServiceApplication);
router.patch("/service-applications/:id/reject", protect, requireRole("admin"), rejectServiceApplication);
router.get("/activity", protect, requireRole("admin"), getRecentActivity);
router.get("/listings", protect, requireRole("admin"), getAllListings);
router.get("/subscriptions", protect, requireRole("admin"), getAdminSubscriptions);
module.exports = router;