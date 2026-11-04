const express = require("express");
const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");
const controller = require("./propertyRequest.controller");
const agentMarketplace = require("./agentMarketplace.controller");

const router = express.Router();
router.use(protect, requireRole("user", "tenant"));
router.post("/", controller.createRequest);
router.get("/", controller.listMyRequests);
router.get("/:id/agent-proposals", agentMarketplace.listCustomerProposals);
router.patch("/:id/agent-proposals/:proposalId", agentMarketplace.respondToProposal);
router.get("/:id", controller.getMyRequest);
router.post("/:id/matches", controller.matchMyRequest);
router.post("/:id/close", controller.closeMyRequest);
module.exports = router;
