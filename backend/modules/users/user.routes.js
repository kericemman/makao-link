const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth.middleware");

const {
  updateProfile
} = require("./user.controller");

router.put("/profile", auth, updateProfile);

module.exports = router;