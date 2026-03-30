const express = require("express");
const router = express.Router();

const { getDashboardStats } = require("./dashboard.controller");
const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");

router.get("/stats", protect, requireRole("landlord"), getDashboardStats);

module.exports = router;