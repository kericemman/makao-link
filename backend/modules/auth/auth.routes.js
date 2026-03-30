const express = require("express");
const router = express.Router();
const { registerLandlord, loginLandlord, getMe } = require("./auth.controller");
const { protect } = require("../../middleware/auth.middleware");

router.post("/register", registerLandlord);
router.post("/login", loginLandlord);
router.get("/me", protect, getMe);



module.exports = router;