const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth.middleware");
const role = require("../../middleware/role.middleware");

const {
  approveProperty,
  rejectProperty,
  suspendUser,
  approveKYC,
  getDashboardStats,
  getAllUsers, 
  activateUser,
  getPendingKYC, 
  getAdminActivity,
  getRevenueChart
} = require("./admin.controller");

router.get("/stats", auth, role("admin"), getDashboardStats);

router.get("/users", auth, role("admin"), getAllUsers);

router.put("/properties/:id/approve", auth, role("admin"), approveProperty);

router.put("/properties/:id/reject", auth, role("admin"), rejectProperty);

router.put("/users/:id/suspend", auth, role("admin"), suspendUser);

router.put("/users/:id/approve-kyc", auth, role("admin"), approveKYC);

router.put("/users/:id/activate", auth, role("admin"), activateUser)

router.get("/kyc", auth, role("admin"), getPendingKYC)

router.get("/activity", auth, role("admin"), getAdminActivity);

router.get("/charts/revenue", auth, role("admin"), getRevenueChart);

module.exports = router;



