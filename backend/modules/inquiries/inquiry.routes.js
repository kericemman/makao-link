const express = require("express");
const router = express.Router();
const {
  createInquiry,
  getLandlordInquiries,
  updateInquiryStatus
} = require("./inquiry.controller");
const { protect } = require("../../middleware/auth.middleware");
const landlordWorkspace = require("../../middleware/landlordWorkspace.middleware");

// public
router.post("/", createInquiry);

// landlord
router.get("/landlord/my", protect, landlordWorkspace("inquiries"), getLandlordInquiries);
router.put("/landlord/:id/status", protect, landlordWorkspace("inquiries"), updateInquiryStatus);

module.exports = router;
