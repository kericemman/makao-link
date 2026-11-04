const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");
const agentMarketplace = require("../propertyRequests/agentMarketplace.controller");
const agentApplications = require("./agentApplication.controller");
const uploadAgentApplicationDocuments = require("./agentApplicationUpload.middleware");
const { createRateLimiter } = require("../../middleware/security.middleware");
const {
  activateAgent,
  createAgent,
  createInstruction,
  getAgentById,
  getAgentOnboarded,
  getAgents,
  getInstructions,
  getMyAgentProfile,
  getMyOnboardedLandlords,
  resendAgentInvitation,
  suspendAgent,
  updateAgent
} = require("./agent.controller");

const agentApplicationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 6,
  message: "Too many agent applications from this connection. Please try again later."
});

router.post("/agents/applications", agentApplicationLimiter, uploadAgentApplicationDocuments, agentApplications.submitApplication);
router.get("/admin/agent-applications", protect, requireRole("admin"), agentApplications.listApplications);
router.get("/admin/agent-applications/:id/documents/:document", protect, requireRole("admin"), agentApplications.getApplicationDocumentLink);
router.patch("/admin/agent-applications/:id/review", protect, requireRole("admin"), agentApplications.reviewApplication);
router.post("/admin/agent-applications/:id/invite", protect, requireRole("admin"), agentApplications.resendInvitation);

router.post("/admin/agents", protect, requireRole("admin"), createAgent);
router.post("/admin/agents/:id/invite", protect, requireRole("admin"), resendAgentInvitation);
router.get("/admin/agents", protect, requireRole("admin"), getAgents);
router.get("/admin/agents/:id", protect, requireRole("admin"), getAgentById);
router.put("/admin/agents/:id", protect, requireRole("admin"), updateAgent);
router.put("/admin/agents/:id/suspend", protect, requireRole("admin"), suspendAgent);
router.put("/admin/agents/:id/activate", protect, requireRole("admin"), activateAgent);
router.get("/admin/agents/:id/onboarded", protect, requireRole("admin"), getAgentOnboarded);
router.post("/admin/agent-instructions", protect, requireRole("admin"), createInstruction);
router.get("/admin/agent-instructions", protect, requireRole("admin"), getInstructions);

router.get("/agents/me", protect, requireRole("agent"), getMyAgentProfile);
router.get("/agents/dashboard", protect, requireRole("agent"), getMyAgentProfile);
router.get("/agents/referral-links", protect, requireRole("agent"), getMyAgentProfile);
router.get("/agents/onboarded-landlords", protect, requireRole("agent"), getMyOnboardedLandlords);
router.get("/agents/instructions", protect, requireRole("agent"), getInstructions);
router.get("/agents/marketplace/requests", protect, agentMarketplace.listSharedRequests);
router.get("/agents/marketplace/requests/:requestId/listings", protect, agentMarketplace.listEligibleListings);
router.post("/agents/marketplace/requests/:requestId/proposals", protect, agentMarketplace.createProposal);
router.patch("/agents/marketplace/proposals/:proposalId/withdraw", protect, agentMarketplace.withdrawProposal);

module.exports = router;
