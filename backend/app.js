const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const helmet = require("helmet");
const { errorHandler } = require("./middleware/error.middleware");
const {
  authLimiter,
  generalApiLimiter,
  otpLimiter,
  rejectUnsafeKeys
} = require("./middleware/security.middleware");

const authRoutes = require("./modules/auth/auth.routes");
const paymentRoutes = require("./modules/payments/payment.routes");
const listingRoutes = require("./modules/listings/listings.routes");
const inquiryRoutes = require("./modules/inquiries/inquiry.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const dashboardRoutes = require("./modules/users/dashboard.routes");
const supportRoutes = require("./modules/support/support.route");
const serviceRoutes = require("./modules/services/service.routes");
const contactRoutes = require("./modules/contact/contact.route");
const alertRoutes = require("./modules/alerts/alert.routes");
const userRoutes = require("./modules/users/user.routes");
const seoRoutes = require("./modules/seo/seo.routes");
const blogRoutes = require("./modules/blog/blog.route");
const publicContentRoutes = require("./modules/app/routes/publicContent.routes");
const adminContentRoutes = require("./modules/app/routes/adminContent.routes");
const agentRoutes = require("./modules/agents/agent.routes");
const kycRoutes = require("./modules/kyc/kyc.routes");
const settingRoutes = require("./modules/settings/setting.route");
const listingReportRoutes = require("./modules/listingReports/listingReport.routes");
const landlordTeamRoutes = require("./modules/team/team.routes");
const stayBookingRoutes = require("./modules/stays/stayBooking.routes");
const rendaAssistantRoutes = require("./modules/renda-assistant/rendaAssistant.routes");
const organizationRoutes = require("./modules/organizations/organization.routes");
const propertyRequestRoutes = require("./modules/propertyRequests/propertyRequest.routes");
const viewingRoutes = require("./modules/viewings/viewing.routes");
const leadRoutes = require("./modules/leads/lead.routes");
const analyticsRoutes = require("./modules/analytics/analytics.routes");
const whatchimpWebhookRoutes = require("./modules/webhooks/whatchimpWebhook.routes");
const { redactWebhookToken } = require("./modules/webhooks/whatchimpWebhook.logging");

const app = express();
const isProduction = process.env.NODE_ENV === "production";
morgan.token("url", (req) => redactWebhookToken(req.originalUrl || req.url));
morgan.token("referrer", (req) => req.path.startsWith("/api/analytics/") ? "-" : (req.get("Referrer") || req.get("Referer") || "-"));
const devOrigins = isProduction
  ? []
  : [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
      "http://localhost:5175",
      "http://127.0.0.1:5175",
      "http://localhost:5176",
      "http://127.0.0.1:5176",
      "http://localhost:5177",
      "http://127.0.0.1:5177",
      "http://localhost:5178",
      "http://127.0.0.1:5178"
    ];

const allowedOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.CLIENT_URLS || "").split(","),
  ...devOrigins
]
  .map((origin) => origin && origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(morgan(isProduction ? "combined" : "dev"));
app.use((req, res, next) => {
  if (/^\/api\/webhooks\/whatchimp\/[^/]+$/.test(req.path)) return next();
  return generalApiLimiter(req, res, next);
});

/**
 * IMPORTANT:
 * Paystack webhook must receive raw body BEFORE express.json()
 */
app.use(
  "/api/payments/paystack-webhook",
  express.raw({ type: "application/json" })
);

// Keep raw bytes bounded for the token-authenticated, receive-only diagnostic handler.
app.use("/api/webhooks", whatchimpWebhookRoutes());

app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true, limit: "200kb" }));
app.use(rejectUnsafeKeys);

app.get("/", (req, res) => {
  res.json({ message: "Makao API running" });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth/verify-email", otpLimiter);
app.use("/api/auth/resend-email-otp", otpLimiter);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/stays", stayBookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/users", userRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/public", publicContentRoutes);
app.use("/api/admin/content", adminContentRoutes);
app.use("/api", agentRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/listing-reports", listingReportRoutes);
app.use("/api/landlord/team", landlordTeamRoutes);
app.use("/api/renda-assistant", rendaAssistantRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/property-requests", propertyRequestRoutes);
app.use("/api/viewings", viewingRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/", seoRoutes);

app.use(errorHandler);

module.exports = app;
