const redactWebhookToken = (url) => String(url || "")
  .replace(/(\/api\/webhooks\/whatchimp\/)[^/?]+/i, "$1[redacted]");

module.exports = { redactWebhookToken };
