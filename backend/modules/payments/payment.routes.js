const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth.middleware");

const {
  initializePayment,
  verifyPayment
} = require("./payment.controller");

router.post("/initialize", auth, initializePayment);

router.post("/webhook", verifyPayment);

module.exports = router;