const express = require("express");
const router = express.Router();

const {
  createContactMessage,
  getAdminContactMessages,
  getAdminContactMessageById,
  updateContactMessageStatus
} = require("./contact.controller");

const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");

// public
router.post("/", createContactMessage);

// admin
router.get("/admin", protect, requireRole("admin"), getAdminContactMessages);
router.get("/admin/:id", protect, requireRole("admin"), getAdminContactMessageById);
router.patch("/admin/:id", protect, requireRole("admin"), updateContactMessageStatus);

module.exports = router;