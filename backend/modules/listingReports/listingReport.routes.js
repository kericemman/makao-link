const express = require("express");
const router = express.Router();

const {
  createListingReport,
  getAdminListingReports,
  updateListingReportStatus
} = require("./listingReport.controller");
const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");

router.post("/", createListingReport);
router.get("/admin", protect, requireRole("admin"), getAdminListingReports);
router.patch("/admin/:id/status", protect, requireRole("admin"), updateListingReportStatus);

module.exports = router;
