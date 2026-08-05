const express = require("express");
const router = express.Router();

router.get("/robots.txt", (req, res) => {
  const baseUrl = (process.env.CLIENT_URL || "https://rendahomes.com").replace(/\/$/, "");

  res.type("text/plain");
  res.send(`User-agent: *
Allow: /

Disallow: /services/apply/callback
Disallow: /services/apply/payment/callback

Sitemap: ${baseUrl}/sitemap.xml`);
});

module.exports = router;
