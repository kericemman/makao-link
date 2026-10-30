const express = require("express");
const router = express.Router();

const {
  changeSubscriptionPlan,
  initializeSubscriptionPayment,
  verifyPaymentByReference,
  getMySubscription,
  getPublicPlans,
  getWhatsAppListingAddon,
  initializeWhatsAppListingAddon,
  cancelWhatsAppListingAddon,
  paystackWebhook,
  runExpiryCheck
} = require("./payment.controller");

const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");
const landlordWorkspace = require("../../middleware/landlordWorkspace.middleware");

router.get("/plans", getPublicPlans);

router.patch(
  "/change-plan",
  protect,
  requireRole("landlord"),
  changeSubscriptionPlan
);

router.post(
  "/initialize-subscription",
  protect,
  requireRole("landlord"),
  initializeSubscriptionPayment
);

router.get(
  "/verify/:reference",
  protect,
  requireRole("landlord"),
  verifyPaymentByReference
);

router.get(
  "/subscription",
  protect,
  landlordWorkspace("reports"),
  getMySubscription
);

router.get(
  "/whatsapp-listing-addon",
  protect,
  requireRole("landlord"),
  getWhatsAppListingAddon
);

router.post(
  "/whatsapp-listing-addon/initialize",
  protect,
  requireRole("landlord"),
  initializeWhatsAppListingAddon
);

router.post(
  "/whatsapp-listing-addon/cancel",
  protect,
  requireRole("landlord"),
  cancelWhatsAppListingAddon
);

router.post("/paystack-webhook", paystackWebhook);

router.post("/run-expiry-check", protect, requireRole("admin"), runExpiryCheck);

module.exports = router;
