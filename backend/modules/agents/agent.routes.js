const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");
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
  suspendAgent,
  updateAgent
} = require("./agent.controller");

router.post("/admin/agents", protect, requireRole("admin"), createAgent);
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

module.exports = router;
