const express = require("express")
const router = express.Router()

const auth = require("../../middleware/auth.middleware")
const role = require("../../middleware/role.middleware")

const {
  getSettings,
  updateSettings
} = require("./setting.controller")


router.get("/", auth, role("admin"), getSettings)

router.put("/", auth, role("admin"), updateSettings)

module.exports = router