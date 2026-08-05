const express = require("express")
const router = express.Router()

const { protect } = require("../../middleware/auth.middleware")
const role = require("../../middleware/role.middleware")

const {
  getSettings,
  updateSettings
} = require("./setting.controller")


router.get("/", protect, role("admin"), getSettings)

router.put("/", protect, role("admin"), updateSettings)

module.exports = router
