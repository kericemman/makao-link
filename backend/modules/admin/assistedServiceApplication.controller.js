const PartnerApplication = require("../services/partnerApplication.model");
const { recordAdminActivity } = require("./adminActivity.service");

const categories = new Set(["movers", "cleaning", "handyman", "furniture", "internet"]);
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const validateAssistedServiceApplication = (body = {}) => {
  const application = {
    companyName: String(body.companyName || "").trim(),
    contactPerson: String(body.contactPerson || "").trim(),
    email: String(body.email || "").trim().toLowerCase(),
    phone: String(body.phone || "").trim(),
    category: String(body.category || ""),
    description: String(body.description || "").trim(),
    location: String(body.location || "").trim(),
    website: String(body.website || "").trim()
  };
  if (!application.companyName || application.companyName.length > 160 || !application.contactPerson || application.contactPerson.length > 120 || !validEmail(application.email) || !application.phone || application.phone.length > 32 || !categories.has(application.category) || !application.description || application.description.length > 4000 || !application.location || application.location.length > 200) {
    return { error: "Enter valid company, contact, service and location details." };
  }
  if (application.website) {
    try { if (new URL(application.website).protocol !== "https:") throw new Error(); }
    catch { return { error: "Website must be a valid HTTPS URL." }; }
  }
  return { application };
};

exports.createAssistedServiceApplication = async (req, res, next) => {
  try {
    const validation = validateAssistedServiceApplication(req.body);
    if (validation.error) return res.status(400).json({ success: false, message: validation.error });
    const application = await PartnerApplication.create({
      ...validation.application,
      intakeSource: "admin_assisted", createdByAdmin: req.user._id, paymentStatus: "pending", status: "pending_review"
    });
    await recordAdminActivity({
      eventType: "assisted_service_application_created",
      description: "Admin-assisted service provider application created",
      details: `${application.companyName} · ${application.category}`,
      path: `/admin/services/applications/${application._id}`,
      actor: req.user._id,
      actorName: req.user.name,
      entityType: "service_application",
      entityId: String(application._id)
    });
    res.status(201).json({ success: true, message: "Provider application created. Payment and admin review are still required before publication.", application });
  } catch (error) { next(error); }
};

exports.validateAssistedServiceApplication = validateAssistedServiceApplication;
