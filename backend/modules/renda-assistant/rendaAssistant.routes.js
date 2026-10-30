const express = require("express");
const { protect } = require("../../middleware/auth.middleware");
const landlordWorkspace = require("../../middleware/landlordWorkspace.middleware");
const { assistantMessageLimiter, assistantSessionLimiter } = require("../../middleware/security.middleware");
const {
  createConversation,
  getConsent,
  sendMessage,
  resetConversation
} = require("./mobileConversation.controller");
const webConversation = require("./webConversation.controller");
const {
  getMyListingDraft,
  markMyListingDraftSubmitted
} = require("./listingDraft.controller");

const router = express.Router();
const landlordRouter = express.Router();

router.get("/mobile/consent", getConsent);
router.post("/mobile/conversations", assistantSessionLimiter, createConversation);
router.post("/mobile/conversations/messages", assistantMessageLimiter, sendMessage);
router.delete("/mobile/conversations", resetConversation);

router.get("/web/consent", webConversation.getConsent);
router.get("/web/conversations", webConversation.getCurrentConversation);
router.post("/web/conversations", assistantSessionLimiter, webConversation.createConversation);
router.post("/web/conversations/messages", assistantMessageLimiter, webConversation.sendMessage);
router.delete("/web/conversations", webConversation.resetConversation);

landlordRouter.use(protect, landlordWorkspace("listings"));
landlordRouter.get("/listing-drafts/:draftId", getMyListingDraft);
landlordRouter.patch("/listing-drafts/:draftId/submitted", markMyListingDraftSubmitted);
router.use("/", landlordRouter);

module.exports = router;
