const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const helmet = require("helmet");
const { errorHandler } = require("./middleware/error.middleware");

const authRoutes = require("./modules/auth/auth.routes");
const paymentRoutes = require("./modules/payments/payment.routes");
const listingRoutes = require("./modules/listings/listings.routes");
const inquiryRoutes = require("./modules/inquiries/inquiry.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const dashboardRoutes = require("./modules/users/dashboard.routes");
const supportRoutes = require("./modules/support/support.route");
const serviceRoutes = require("./modules/services/service.routes");
const contactRoutes = require("./modules/contact/contact.route");
const userRoutes = require("./modules/users/user.routes");
const seoRoutes = require("./modules/seo/seo.routes");
const blogRoutes = require("./modules/blog/blog.route");

const app = express();


app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://rendahomes.com",
      "https://www.rendahomes.com",
      "www.rendahomes.com"
    ],
    credentials: true
  })
);

app.use(helmet());
app.use(morgan("dev"));

app.use("/api/payments/paystack-webhook", express.json());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Makao API running" });
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/users", userRoutes);
app.use("/api/blog", blogRoutes);
app.use("/", seoRoutes);


app.use(errorHandler);

module.exports = app;