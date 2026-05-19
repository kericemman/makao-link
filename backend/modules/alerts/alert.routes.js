const express = require("express");
const router = express.Router();

const {
  createListingInquiry,
  getMyAlerts,
  getLandlordAlerts,
  replyToAlert,
  markAlertRead
} = require("./alert.controller");

const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");

router.use(protect);

router.post("/listing-inquiry", createListingInquiry);
router.get("/me", getMyAlerts);
router.get("/landlord", requireRole("landlord"), getLandlordAlerts);
router.post("/:inquiryId/reply", replyToAlert);
router.patch("/:inquiryId/read", markAlertRead);

module.exports = router;
