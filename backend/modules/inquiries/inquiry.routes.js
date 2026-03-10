const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth.middleware");

const {
  createInquiry,
  getMyInquiries,
} = require("./inquiry.controller");

router.post("/", createInquiry);

router.get("/my-inquiries", auth, getMyInquiries);

module.exports = router;