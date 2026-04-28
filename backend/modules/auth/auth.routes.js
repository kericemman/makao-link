const express = require("express");
const router = express.Router();
const {
  registerLandlord,
  loginLandlord,
  register,
  login,
  me,
  getMe,
  forgotPassword,
  resetPassword
} = require("./auth.controller");
const { protect } = require("../../middleware/auth.middleware");

router.post("/register", registerLandlord);
router.post("/login", loginLandlord);
router.get("/me", protect, getMe);


router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);



router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;