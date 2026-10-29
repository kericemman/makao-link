require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const cron = require("node-cron");
const purgeDeletedListings = require("./jobs/purgeDeletedListings");
const { processScheduledFreeDowngrades } = require("./modules/subscriptions/subscription.service");

const PORT = process.env.PORT || 5000;

connectDB();

cron.schedule("15 3 * * *", purgeDeletedListings);
cron.schedule("30 3 * * *", async () => {
  try {
    await processScheduledFreeDowngrades();
  } catch (error) {
    console.error("Scheduled subscription downgrade job failed:", error.message);
  }
});

const HOST = process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
