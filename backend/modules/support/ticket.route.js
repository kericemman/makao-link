const express = require("express")
const router = express.Router()

const auth = require("../../middleware/auth.middleware")
const role = require("../../middleware/role.middleware")

const {
  createTicket,
  getMyTickets,
  getTickets,
  getTicket,
  replyTicket,
  closeTicket,
  updateTicketStatus
} = require("./ticket.controller")

// landlord
router.post("/", auth, createTicket)
router.get("/mine", auth, getMyTickets)

// admin
router.get("/", auth, role("admin"), getTickets)
router.get("/:id", auth, role("admin"), getTicket)

router.post(
    "/:id/reply",
    auth,
    role("admin"),
    replyTicket
  )

  router.post("/:id/reply", auth, role("admin"), replyTicket)

router.put("/:id/close", auth, role("admin"), closeTicket)
router.put(
    "/:id/status",
    auth,
    role("admin"),
    updateTicketStatus
  )

module.exports = router