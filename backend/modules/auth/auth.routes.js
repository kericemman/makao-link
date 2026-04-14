const express = require("express");
const router = express.Router();
const {
  registerLandlord,
  loginLandlord,
  getMe,
  forgotPassword,
  resetPassword
} = require("./auth.controller");
const { protect } = require("../../middleware/auth.middleware");

router.post("/register", registerLandlord);
router.post("/login", loginLandlord);
router.get("/me", protect, getMe);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;