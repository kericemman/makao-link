const express = require("express");
const router = express.Router();

const {
  getMyKyc,
  submitKyc,
  getAdminKycs,
  getAdminKycById,
  reviewKyc
} = require("./kyc.controller");
const { protect } = require("../../middleware/auth.middleware");
const requireRole = require("../../middleware/role.middleware");
const upload = require("../../middleware/upload.middleware");

router.get("/me", protect, requireRole("landlord"), getMyKyc);

router.post(
  "/submit",
  protect,
  requireRole("landlord"),
  upload.fields([
    { name: "documentFront", maxCount: 1 },
    { name: "documentBack", maxCount: 1 },
    { name: "selfiePhoto", maxCount: 1 },
    { name: "proofOfOwnership", maxCount: 1 }
  ]),
  submitKyc
);

router.get("/admin", protect, requireRole("admin"), getAdminKycs);
router.get("/admin/:id", protect, requireRole("admin"), getAdminKycById);
router.patch("/admin/:id/review", protect, requireRole("admin"), reviewKyc);

module.exports = router;
