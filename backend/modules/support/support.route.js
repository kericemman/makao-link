const express = require("express");
const router = express.Router();

const {
  createTicket,
  getMyTickets,
  getMyTicketById,
  replyToMyTicket,
  getAdminTickets,
  getAdminTicketById,
  replyAsAdmin,
  updateTicketStatus
} = require("./support.controller");

const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");

// landlord
router.post("/", protect, requireRole("landlord"), createTicket);
router.get("/my", protect, requireRole("landlord"), getMyTickets);
router.get("/my/:id", protect, requireRole("landlord"), getMyTicketById);
router.post("/my/:id/reply", protect, requireRole("landlord"), replyToMyTicket);

// admin
router.get("/admin", protect, requireRole("admin"), getAdminTickets);
router.get("/admin/:id", protect, requireRole("admin"), getAdminTicketById);
router.post("/admin/:id/reply", protect, requireRole("admin"), replyAsAdmin);
router.patch("/admin/:id/status", protect, requireRole("admin"), updateTicketStatus);

module.exports = router;