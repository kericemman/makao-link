const express = require("express");
const router = express.Router();

const {
  getSupportCategories,
  createSupportCategory,
  updateSupportCategory,
  deleteSupportCategory,

  getSupportTickets,
  updateSupportTicket,
  deleteSupportTicket,
  getHelpRequests,
  updateHelpRequest,
  deleteHelpRequest,

  getContactInfo,
  updateContactInfo,

  getUpdates,
  createUpdate,
  updateUpdate,
  deleteUpdate,

  getSubscribers,
  updateSubscriber,

  getPolicies,
  upsertPolicy,
  updatePolicy
} = require("../controllers/adminContent.controller");

const { protect, requireRole } = require("../../../middleware/auth.middleware");

router.use(protect);
router.use(requireRole("admin"));

router
  .route("/support-categories")
  .get(getSupportCategories)
  .post(createSupportCategory);

router
  .route("/support-categories/:id")
  .patch(updateSupportCategory)
  .delete(deleteSupportCategory);

router.get("/support-tickets", getSupportTickets);
router.patch("/support-tickets/:id", updateSupportTicket);
router.delete("/support-tickets/:id", deleteSupportTicket);

router.get("/help-requests", getHelpRequests);
router.patch("/help-requests/:id", updateHelpRequest);
router.delete("/help-requests/:id", deleteHelpRequest);

router.get("/contact-info", getContactInfo);
router.patch("/contact-info", updateContactInfo);

router
  .route("/updates")
  .get(getUpdates)
  .post(createUpdate);

router
  .route("/updates/:id")
  .patch(updateUpdate)
  .delete(deleteUpdate);

router.get("/subscribers", getSubscribers);
router.patch("/subscribers/:id", updateSubscriber);

router
  .route("/policies")
  .get(getPolicies)
  .post(upsertPolicy);

router.patch("/policies/:id", updatePolicy);

module.exports = router;
