const express = require("express")
const router = express.Router()

const auth = require("../../middleware/auth.middleware")
const role = require("../../middleware/role.middleware")

const {
  createContact,
  getContacts,
  markAsRead,
  deleteContact
} = require("./contact.controller")


// Public
router.post("/", createContact)


// Admin
router.get("/", auth, role("admin"), getContacts)

router.put("/:id/read", auth, role("admin"), markAsRead)

router.delete("/:id", auth, role("admin"), deleteContact)

module.exports = router