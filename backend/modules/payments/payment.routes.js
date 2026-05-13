const express = require("express");
const router = express.Router();

const {
  changeSubscriptionPlan,
  initializeSubscriptionPayment,
  verifyPaymentByReference,
  getMySubscription,
  paystackWebhook,
  runExpiryCheck
} = require("./payment.controller");

const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");

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
  requireRole("landlord"),
  getMySubscription
);

router.post(
  "/paystack-webhook",
  paystackWebhook
);

router.post(
  "/run-expiry-check",
  runExpiryCheck
);

module.exports = router;