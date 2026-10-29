const express = require("express");
const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");
const landlordWorkspace = require("../../middleware/landlordWorkspace.middleware");
const { getTeam, inviteTeamMember, updateTeamMember, assignListing, assignInquiry, recordDeal, getTeamReports } = require("./team.controller");

const router = express.Router();
router.get("/", protect, landlordWorkspace("team"), getTeam);
router.post("/", protect, requireRole("landlord"), inviteTeamMember);
router.patch("/:id", protect, requireRole("landlord"), updateTeamMember);
router.get("/reports", protect, landlordWorkspace("reports"), getTeamReports);
router.patch("/listings/:listingId/assign", protect, landlordWorkspace("team"), assignListing);
router.patch("/inquiries/:inquiryId/assign", protect, landlordWorkspace("team"), assignInquiry);
router.post("/deals", protect, landlordWorkspace("deals"), recordDeal);

module.exports = router;
