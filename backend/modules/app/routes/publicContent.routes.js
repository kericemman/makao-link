const express = require("express");
const router = express.Router();

const {
  getSupportCategories,
  getContactInfo,
  getUpdates,
  subscribe,
  getPolicyPage
} = require("../controllers/publicContent.controller");

router.get("/support-categories", getSupportCategories);


router.get("/contact-info", getContactInfo);

router.get("/updates", getUpdates);
router.post("/subscribe", subscribe);

router.get("/policies/:slug", getPolicyPage);

module.exports = router;