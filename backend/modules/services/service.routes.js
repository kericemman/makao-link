const express = require("express");
const router = express.Router();

const {
  getServiceCategories,
  getPartnersByCategory,
  createPartnerApplication,
  initializePartnerApplicationPayment,
  getPartnerApplicationStatus
} = require("./service.controller");

const upload = require("../../middleware/upload.middleware");

// public categories and partners
router.get("/", getServiceCategories);
router.get("/category/:category", getPartnersByCategory);

// partner application
router.post("/apply", upload.single("logo"), createPartnerApplication);
router.post("/apply/:id/pay", initializePartnerApplicationPayment);
router.get("/apply/:id/status", getPartnerApplicationStatus);

module.exports = router;