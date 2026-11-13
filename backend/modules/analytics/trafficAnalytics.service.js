const TrafficDaily = require("./trafficDaily.model");
const indexPromises = new WeakMap();

const MEDIUMS = new Set(["direct", "organic", "paid", "social", "referral", "messaging", "email"]);

const normalizeSource = (value) => {
  const source = String(value || "").trim().toLowerCase().replace(/^www\./, "").replace(/[^a-z0-9.-]/g, "").slice(0, 80);
  if (!source || ["direct", "none", "(direct)"].includes(source)) return "direct";
  if (/google\./.test(source) || source === "google") return "google";
  if (/bing\./.test(source) || source === "bing") return "bing";
  if (/facebook\.|fb\.|meta\./.test(source) || ["facebook", "fb", "meta"].includes(source)) return "facebook";
  if (/instagram\./.test(source) || source === "instagram") return "instagram";
  if (/tiktok\./.test(source) || source === "tiktok") return "tiktok";
  if (/linkedin\./.test(source) || source === "linkedin") return "linkedin";
  if (/whatsapp\./.test(source) || source === "whatsapp") return "whatsapp";
  if (["email", "newsletter"].includes(source)) return "email";
  return "referral";
};

const normalizeMedium = (value, source) => {
  const medium = String(value || "").trim().toLowerCase().replace(/[^a-z_-]/g, "").slice(0, 30);
  if (MEDIUMS.has(medium)) return medium;
  if (source === "direct") return "direct";
  if (["google", "bing"].includes(source)) return "organic";
  if (["facebook", "instagram", "tiktok", "linkedin"].includes(source)) return "social";
  if (source === "whatsapp") return "messaging";
  if (source === "email") return "email";
  return "referral";
};

const normalizePagePath = (value) => {
  if (typeof value !== "string" || value.length > 500 || !value.startsWith("/") || value.startsWith("//")) return null;
  const pathname = value.split(/[?#]/, 1)[0].replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
  if (pathname === "/") return "/";
  if (pathname === "/listings") return "/listings";
  if (/^\/(?:listings|properties)\/[a-f\d]{24}$/i.test(pathname)) return "/listings/:id";
  if (/^\/categories\/[a-z0-9-]{1,60}$/i.test(pathname)) return "/categories/:slug";
  if (pathname === "/services") return "/services";
  if (/^\/services\/[a-z0-9-]{1,60}$/i.test(pathname)) return "/services/:category";
  if (["/services/apply", "/services/apply/callback", "/services/apply/payment/callback"].includes(pathname)) return "/services/apply";
  if (pathname === "/blog") return "/blog";
  if (/^\/blog\/[a-z0-9-]{1,120}$/i.test(pathname)) return "/blog/:slug";
  if (["/list-your-property", "/about", "/faqs", "/pricing", "/support", "/privacy-policy", "/terms-of-service", "/sitemap"].includes(pathname)) return pathname;
  return "/other";
};

const dayKey = (date = new Date()) => date.toISOString().slice(0, 10);

const ensureIndexes = async (model) => {
  if (typeof model.createIndexes !== "function") return;
  if (!indexPromises.has(model)) indexPromises.set(model, model.createIndexes());
  try { await indexPromises.get(model); }
  catch (error) {
    indexPromises.delete(model);
    throw error;
  }
};

const recordPageView = async ({ path, source, medium, now = new Date(), model = TrafficDaily }) => {
  const normalizedPath = normalizePagePath(path);
  if (!normalizedPath) return { accepted: false };
  await ensureIndexes(model);
  const normalizedSource = normalizeSource(source);
  const normalizedMedium = normalizeMedium(medium, normalizedSource);
  await model.findOneAndUpdate(
    { day: dayKey(now), path: normalizedPath, source: normalizedSource, medium: normalizedMedium },
    { $inc: { views: 1 }, $setOnInsert: { day: dayKey(now), path: normalizedPath, source: normalizedSource, medium: normalizedMedium } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { accepted: true };
};

const getRangeStart = (range, now = new Date()) => {
  const days = range === "7d" ? 7 : 30;
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { day: dayKey(start), days };
};

module.exports = { dayKey, getRangeStart, normalizeMedium, normalizePagePath, normalizeSource, recordPageView };
