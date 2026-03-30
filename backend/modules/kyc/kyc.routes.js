const express = require("express");
const router = express.Router();

const { getMyKyc, submitKyc } = require("./kyc.controller");
const auth = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");
const upload = require("../../middleware/upload.middleware");

router.get("/me", auth, requireRole("landlord"), getMyKyc);

router.post(
  "/submit",
  auth,
  requireRole("landlord"),
  upload.fields([
    { name: "documentFront", maxCount: 1 },
    { name: "documentBack", maxCount: 1 },
    { name: "selfiePhoto", maxCount: 1 },
    { name: "proofOfOwnership", maxCount: 1 }
  ]),
  submitKyc
);

module.exports = router;