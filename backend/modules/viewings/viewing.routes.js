const express = require("express");
const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");
const landlordWorkspace = require("../../middleware/landlordWorkspace.middleware");
const controller = require("./viewing.controller");

const router = express.Router();
router.post("/", protect, requireRole("user", "tenant"), controller.createViewing);
router.get("/me", protect, requireRole("user", "tenant"), controller.listMyViewings);
router.get("/advertiser", protect, landlordWorkspace("inquiries"), controller.listAdvertiserViewings);
router.get("/agent", protect, requireRole("agent"), controller.listAgentViewings);
router.get("/:id", protect, controller.getViewing);
router.post("/:id/confirm", protect, controller.transition("confirm"));
router.post("/:id/decline", protect, controller.transition("decline"));
router.post("/:id/reschedule", protect, controller.transition("propose_reschedule"));
router.post("/:id/cancel", protect, controller.transition("cancel"));
router.post("/:id/complete", protect, controller.transition("complete"));

module.exports = router;
