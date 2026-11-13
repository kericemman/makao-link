const express = require("express");
const { createRateLimiter } = require("../../middleware/security.middleware");
const { recordPageView } = require("./trafficAnalytics.controller");

const router = express.Router();
const trafficLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 240, message: "Too many page-view events. Please try again shortly." });

router.post("/pageview", trafficLimiter, recordPageView);

module.exports = router;
