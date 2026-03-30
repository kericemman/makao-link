const express = require("express");
const router = express.Router();
const {
  createInquiry,
  getLandlordInquiries,
  updateInquiryStatus
} = require("./inquiry.controller");
const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");

// public
router.post("/", createInquiry);

// landlord
router.get("/landlord/my", protect, requireRole("landlord"), getLandlordInquiries);
router.put("/landlord/:id/status", protect, requireRole("landlord"), updateInquiryStatus);

module.exports = router;