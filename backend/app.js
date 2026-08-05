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

const app = express();
const isProduction = process.env.NODE_ENV === "production";
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
      "http://127.0.0.1:5176"
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
app.use(generalApiLimiter);

/**
 * IMPORTANT:
 * Paystack webhook must receive raw body BEFORE express.json()
 */
app.use(
  "/api/payments/paystack-webhook",
  express.raw({ type: "application/json" })
);

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
app.use("/", seoRoutes);

app.use(errorHandler);

module.exports = app;
