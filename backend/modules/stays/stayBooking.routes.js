const express = require("express");
const { protect } = require("../../middleware/auth.middleware");
const landlordWorkspace = require("../../middleware/landlordWorkspace.middleware");
const { createStayRequest, getLandlordStayRequests, updateStayRequestStatus } = require("./stayBooking.controller");

const router = express.Router();
router.post("/:listingId/requests", createStayRequest);
router.get("/landlord/requests", protect, landlordWorkspace("inquiries"), getLandlordStayRequests);
router.patch("/landlord/requests/:id/status", protect, landlordWorkspace("inquiries"), updateStayRequestStatus);

module.exports = router;
