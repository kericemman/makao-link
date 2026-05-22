const express = require("express");
const router = express.Router();
const {
  registerLandlord,
  loginLandlord,
  register,
  getMe,
  socialLogin,
  verifyEmail,
  resendEmailOtp,
  forgotPassword,
  resetPassword
} = require("./auth.controller");
const { protect } = require("../../middleware/auth.middleware");

router.post("/register", registerLandlord);
router.post("/login", loginLandlord);
router.get("/me", protect, getMe);


router.post("/user/register", register);

router.post("/social-login", socialLogin);
router.post("/verify-email", verifyEmail);
router.post("/resend-email-otp", resendEmailOtp);



router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;
