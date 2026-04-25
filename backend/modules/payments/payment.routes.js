// const express = require("express");
// const router = express.Router();

// const paymentController = require("./payment.controller");
// const { protect } = require("../../middleware/auth.middleware");
// const requireRole = require("../../middleware/role.middleware");

// router.post(
//   "/initialize-subscription",
//   protect,
//   requireRole("landlord"),
//   paymentController.initializeSubscriptionPayment
// );

// router.get(
//   "/subscription",
//   protect,
//   requireRole("landlord"),
//   paymentController.getMySubscription
// );

// router.patch(
//   "/change-plan",
//   protect,
//   requireRole("landlord"),
//   changeSubscriptionPlan
// );

// router.post(
//   "/paystack-webhook",
//   paymentController.paystackWebhook
// );

// router.post(
//   "/run-expiry-check",
//   paymentController.runExpiryCheck
// );



// module.exports = router;

const express = require("express");
const router = express.Router();
const {
  initializeSubscriptionPayment,
  getMySubscription,
  paystackWebhook,
  runExpiryCheck,
  changeSubscriptionPlan,
  verifyPaymentByReference
} = require("./payment.controller");
const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");

router.post("/initialize-subscription", protect, requireRole("landlord"), initializeSubscriptionPayment);
router.get("/subscription", protect, requireRole("landlord"), getMySubscription);
router.patch("/change-plan", protect, requireRole("landlord"), changeSubscriptionPlan);
router.post("/paystack-webhook", paystackWebhook);
router.post("/run-expiry-check", runExpiryCheck);
router.get(
  "/verify/:reference",
  protect, requireRole("admin"), verifyPaymentByReference
);

module.exports = router;