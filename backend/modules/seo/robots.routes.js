const express = require("express");
const router = express.Router();

router.get("/robots.txt", (req, res) => {
  const baseUrl = process.env.CLIENT_URL || "https://www.rendahomes.com";

  res.type("text/plain");
  res.send(`User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`);
});

module.exports = router;