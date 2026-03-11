require("dotenv").config();
const express = require("express");
const router = express.Router();

const authRoutes = require("../modules/auth/auth.routes");
const propertyRoutes = require("../modules/properties/property.routes");
const inquiryRoutes = require("../modules/inquiries/inquiry.routes");
const paymentRoutes = require("../modules/payments/payment.routes");
const adminRoutes = require("../modules/admin/admin.routes");
const userRoutes = require("../modules/users/user.routes");
const dashboardRoutes = require("../modules/users/dashboard.routes");
const partnerRoutes = require("../modules/partners/partner.routes");
const settingsRoutes = require("../modules/settings/setting.route");
const blogRoutes = require("../modules/blog/blog.route");
const contactRoutes = require("../modules/contact/contact.route")
const supportRoutes = require("../modules/support/ticket.route")











// register module routes
router.use("/auth", authRoutes);
router.use("/properties", propertyRoutes);
router.use("/inquiries", inquiryRoutes);
router.use("/payments", paymentRoutes);
router.use("/admin", adminRoutes);
router.use("/users", userRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/partners", partnerRoutes)
router.use("/settings", settingsRoutes)
router.use("/blogs", blogRoutes)
router.use("/contact", contactRoutes)
router.use("/support", supportRoutes)


module.exports = router;