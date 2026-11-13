const test = require("node:test");
const assert = require("node:assert/strict");
const { getRangeStart, normalizePagePath, normalizeSource, recordPageView } = require("./trafficAnalytics.service");
const TrafficDaily = require("./trafficDaily.model");

test("traffic paths are reduced to safe route families without query values or listing IDs", () => {
  assert.equal(normalizePagePath("/listings/6af482e09c58fdeb7b62bb24?search=Westlands"), "/listings/:id");
  assert.equal(normalizePagePath("/blog/my-article#comments"), "/blog/:slug");
  assert.equal(normalizePagePath("//evil.example/path"), null);
  assert.equal(normalizePagePath("/account/private"), "/other");
});

test("traffic source classification stores only broad source categories", () => {
  assert.equal(normalizeSource("https://www.google.co.ke/"), "google");
  assert.equal(normalizeSource("l.instagram.com"), "instagram");
  assert.equal(normalizeSource("private-campaign-identifier.example"), "referral");
  assert.deepEqual(getRangeStart("7d", new Date("2026-11-12T12:00:00Z")), { day: "2026-11-06", days: 7 });
});

test("page-view recording atomically increments a daily aggregate and stores no visitor identity", async () => {
  let captured;
  const fakeModel = { findOneAndUpdate: async (...args) => { captured = args; } };
  const result = await recordPageView({ path: "/listings/6af482e09c58fdeb7b62bb24", source: "google", medium: "organic", now: new Date("2026-11-12T22:00:00Z"), model: fakeModel });
  assert.deepEqual(result, { accepted: true });
  assert.deepEqual(captured[0], { day: "2026-11-12", path: "/listings/:id", source: "google", medium: "organic" });
  assert.deepEqual(captured[1].$inc, { views: 1 });
  assert.equal(captured[2].upsert, true);
  assert.equal(JSON.stringify(captured).includes("visitor"), false);
});

test("daily aggregate key is protected by a unique compound index", () => {
  const uniqueIndex = TrafficDaily.schema.indexes().find(([keys, options]) =>
    keys.day === 1 && keys.path === 1 && keys.source === 1 && keys.medium === 1 && options.unique === true
  );
  assert.ok(uniqueIndex);
});
