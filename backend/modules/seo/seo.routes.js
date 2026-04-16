const express = require("express");
const router = express.Router();
const Listing = require("../listings/listings.model");

router.get("/sitemap.xml", async (req, res, next) => {
  try {
    const baseUrl = process.env.CLIENT_URL || "https://www.rendahomes.com";

    const staticPages = [
      "",
      "/properties",
      "/pricing",
      "/services",
      "/support",
      "/faqs",
      "/login",
      "/faqs"
      
    ];

    const listings = await Listing.find({
      status: "approved",
      availability: "available",
      isActive: true
    }).select("_id updatedAt");

    const serviceCategories = [
      "movers",
      "cleaning",
      "handyman",
      "furniture",
      "internet"
    ];

    const urls = [
      ...staticPages.map((path) => ({
        loc: `${baseUrl}${path}`,
        lastmod: new Date().toISOString(),
        changefreq: "weekly",
        priority: path === "" ? "1.0" : "0.8"
      })),
      ...serviceCategories.map((category) => ({
        loc: `${baseUrl}/services/${category}`,
        lastmod: new Date().toISOString(),
        changefreq: "weekly",
        priority: "0.7"
      })),
      ...listings.map((listing) => ({
        loc: `${baseUrl}/listings/${listing._id}`,
        lastmod: listing.updatedAt ? new Date(listing.updatedAt).toISOString() : new Date().toISOString(),
        changefreq: "daily",
        priority: "0.9"
      }))
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("")}
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (error) {
    next(error);
  }
});

module.exports = router;