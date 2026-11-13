const TrafficDaily = require("./trafficDaily.model");
const { getRangeStart, recordPageView } = require("./trafficAnalytics.service");

exports.recordPageView = async (req, res, next) => {
  try {
    const keys = Object.keys(req.body || {});
    if (keys.some((key) => !["path", "source", "medium"].includes(key))) {
      return res.status(400).json({ success: false, message: "Unsupported analytics fields." });
    }
    const result = await recordPageView(req.body || {});
    if (!result.accepted) return res.status(400).json({ success: false, message: "A valid page path is required." });
    res.status(202).json({ success: true });
  } catch (error) { next(error); }
};

exports.getTrafficSummary = async (req, res, next) => {
  try {
    const range = req.query.range === "7d" ? "7d" : "30d";
    const { day: startDay, days } = getRangeStart(range);
    const rows = await TrafficDaily.find({ day: { $gte: startDay } }).select("day path source medium views").lean();
    const daily = new Map();
    const sources = new Map();
    const pages = new Map();
    let totalViews = 0;
    for (const row of rows) {
      const views = Number(row.views) || 0;
      totalViews += views;
      daily.set(row.day, (daily.get(row.day) || 0) + views);
      const sourceKey = `${row.source}:${row.medium}`;
      sources.set(sourceKey, { source: row.source, medium: row.medium, views: (sources.get(sourceKey)?.views || 0) + views });
      pages.set(row.path, (pages.get(row.path) || 0) + views);
    }
    const dailyViews = Array.from({ length: days }, (_, index) => {
      const date = new Date(`${startDay}T00:00:00.000Z`);
      date.setUTCDate(date.getUTCDate() + index);
      const day = date.toISOString().slice(0, 10);
      return { day, views: daily.get(day) || 0 };
    });
    res.json({
      success: true,
      range,
      summary: { pageViews: totalViews },
      daily: dailyViews,
      sources: [...sources.values()].sort((a, b) => b.views - a.views),
      pages: [...pages.entries()].map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views).slice(0, 20)
    });
  } catch (error) { next(error); }
};
