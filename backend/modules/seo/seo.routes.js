const express = require("express");
const router = express.Router();
const Listing = require("../listings/listings.model");
const Blog = require("../blog/blog.model");

const staticPages = [
  { path: "", changefreq: "daily", priority: "1.0" },
  { path: "/listings", changefreq: "daily", priority: "0.95" },
  { path: "/categories/rentals", changefreq: "daily", priority: "0.9" },
  { path: "/categories/for-sale", changefreq: "daily", priority: "0.9" },
  { path: "/categories/apartments", changefreq: "daily", priority: "0.85" },
  { path: "/categories/bedsitters", changefreq: "daily", priority: "0.82" },
  { path: "/categories/student", changefreq: "weekly", priority: "0.78" },
  { path: "/categories/office", changefreq: "weekly", priority: "0.82" },
  { path: "/categories/family", changefreq: "weekly", priority: "0.8" },
  { path: "/categories/luxury", changefreq: "weekly", priority: "0.78" },
  { path: "/categories/maisonettes", changefreq: "weekly", priority: "0.78" },
  { path: "/categories/villas", changefreq: "weekly", priority: "0.75" },
  { path: "/services", changefreq: "weekly", priority: "0.76" },
  { path: "/services/movers", changefreq: "weekly", priority: "0.72" },
  { path: "/services/cleaning", changefreq: "weekly", priority: "0.72" },
  { path: "/services/handyman", changefreq: "weekly", priority: "0.72" },
  { path: "/services/furniture", changefreq: "weekly", priority: "0.7" },
  { path: "/services/internet", changefreq: "weekly", priority: "0.7" },
  { path: "/services/apply", changefreq: "monthly", priority: "0.55" },
  { path: "/about", changefreq: "monthly", priority: "0.62" },
  { path: "/list-your-property", changefreq: "weekly", priority: "0.86" },
  { path: "/pricing", changefreq: "monthly", priority: "0.7" },
  { path: "/faqs", changefreq: "monthly", priority: "0.62" },
  { path: "/support", changefreq: "monthly", priority: "0.58" },
  { path: "/blog", changefreq: "weekly", priority: "0.66" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.35" },
  { path: "/terms-of-service", changefreq: "yearly", priority: "0.35" },
  { path: "/sitemap", changefreq: "monthly", priority: "0.4" }
];

const normalizeBaseUrl = () =>
  (process.env.CLIENT_URL || "https://rendahomes.com").replace(/\/$/, "");

const escapeXml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const urlNode = ({ loc, lastmod, changefreq, priority, images = [] }) => `
  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${images
      .filter(Boolean)
      .slice(0, 10)
      .map(
        (image) => `
    <image:image>
      <image:loc>${escapeXml(image)}</image:loc>
    </image:image>`
      )
      .join("")}
  </url>`;

router.get("/sitemap.xml", async (req, res, next) => {
  try {
    const baseUrl = normalizeBaseUrl();
    const now = new Date().toISOString();

    const [listings, blogs] = await Promise.all([
      Listing.find({
        status: "approved",
        availability: "available",
        isActive: true,
        isDeleted: { $ne: true }
      })
        .select("_id updatedAt images")
        .sort({ updatedAt: -1 })
        .limit(45000)
        .lean(),
      Blog.find({ status: "published" })
        .select("slug updatedAt publishedAt")
        .sort({ publishedAt: -1, updatedAt: -1 })
        .limit(3000)
        .lean()
    ]);

    const urls = [
      ...staticPages.map((page) => ({
        loc: `${baseUrl}${page.path}`,
        lastmod: now,
        changefreq: page.changefreq,
        priority: page.priority
      })),
      ...blogs.map((blog) => ({
        loc: `${baseUrl}/blog/${blog.slug}`,
        lastmod: new Date(blog.updatedAt || blog.publishedAt || Date.now()).toISOString(),
        changefreq: "monthly",
        priority: "0.62"
      })),
      ...listings.map((listing) => ({
        loc: `${baseUrl}/listings/${listing._id}`,
        lastmod: new Date(listing.updatedAt || Date.now()).toISOString(),
        changefreq: "daily",
        priority: "0.92",
        images: listing.images || []
      }))
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(urlNode).join("")}
</urlset>`;

    res.type("application/xml");
    res.set("Cache-Control", "public, max-age=1800");
    res.send(xml);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
