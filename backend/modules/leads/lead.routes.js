const express = require("express");
const { protect } = require("../../middleware/auth.middleware");
const landlordWorkspace = require("../../middleware/landlordWorkspace.middleware");
const controller = require("./lead.controller");

const router = express.Router();
router.get("/", protect, landlordWorkspace("inquiries"), controller.listLeads);
router.get("/:id", protect, landlordWorkspace("inquiries"), controller.getLead);
router.patch("/:id/status", protect, landlordWorkspace("inquiries"), controller.updateLeadStatus);
router.post("/:id/assignments", protect, landlordWorkspace("team"), controller.assignLead);
module.exports = router;
