const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth.middleware");

const {
  register,
  login,
    forgotPassword,
    resetPassword, 
    getCurrentUser
} = require("./auth.controller");

router.post("/register", register);
router.post("/login", login);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:token", resetPassword);

router.get("/me", auth, getCurrentUser);

module.exports = router;