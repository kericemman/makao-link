const express = require("express");
const { createWebhookController } = require("./whatchimpWebhook.controller");
const { createRateLimiter } = require("../../middleware/security.middleware");

const createWebhookRouter = (options) => {
  const router = express.Router();
  const readRawBody = express.raw({ type: () => true, limit: "64kb" });
  const webhookLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 600, message: "Webhook rate limit exceeded." });
  router.post("/whatchimp/:token", webhookLimiter, readRawBody, createWebhookController(options));
  return router;
};

module.exports = createWebhookRouter;
