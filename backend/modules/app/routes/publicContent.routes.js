const express = require("express");
const router = express.Router();

const {
  getSupportCategories,
  createAppTicket,
  getContactInfo,
  getUpdates,
  subscribe,
  getPolicyPage,
  createHelpRequest
} = require("../controllers/publicContent.controller");

router.get("/support-categories", getSupportCategories);
router.post("/support-tickets", createAppTicket);
router.post("/help-requests", createHelpRequest);


router.get("/contact-info", getContactInfo);

router.get("/updates", getUpdates);
router.post("/subscribe", subscribe);

router.get("/policies/:slug", getPolicyPage);

module.exports = router;
