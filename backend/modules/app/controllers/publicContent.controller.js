const SupportCategory = require("../models/supportCategory.model");
const AppTicket = require("../models/appTicket.model");
const ContactInfo = require("../models/contactInfo.model");
const AppUpdate = require("../models/appUpdate.model");
const Subscriber = require("../models/subscriber.model");
const PolicyPage = require("../models/policyPage.model");
const HelpRequest = require("../models/helpRequest.model");
const { recordAdminActivity } = require("../../admin/adminActivity.service");
const sendEmail = require("../../../utils/sendEmail");
const { appSubscriptionConfirmedEmail } = require("../../../utils/emailTemplates");

exports.getSupportCategories = async (req, res) => {
  const categories = await SupportCategory.find({ isActive: true }).sort({ createdAt: -1 });
  res.json({ categories });
};

exports.createAppTicket = async (req, res) => {
  const { category, subject, message, source } = req.body;

  if (!category || !subject || !message) {
    return res.status(400).json({ message: "Category, subject and message are required" });
  }

  const ticket = await AppTicket.create({
    category,
    subject,
    message,
    source: source || "mobile_app",
    user: req.user?._id || null
  });

  await recordAdminActivity({
    eventType: "app_support_ticket",
    description: "Mobile support ticket received",
    details: `${subject} • ${req.user?.name || "Guest user"}`,
    path: "/admin/app/support-help?tab=tickets",
    actor: req.user?._id || null,
    actorName: req.user?.name || "Guest user",
    entityType: "app_ticket",
    entityId: String(ticket._id)
  });

  res.status(201).json({
    success: true,
    ticket
  });
};

exports.createHelpRequest = async (req, res) => {
  const {
    purpose,
    timeline,
    name,
    phone,
    email,
    location,
    monthlyBudget,
    purchaseBudget,
    propertyType,
    bedrooms,
    leaseTerm,
    financing,
    teamSize,
    officeSetup,
    businessType,
    message,
    source
  } = req.body;

  if (!purpose || !name || !phone) {
    return res.status(400).json({
      message: "Purpose, name and phone are required"
    });
  }

  const request = await HelpRequest.create({
    purpose,
    timeline,
    name,
    phone,
    email,
    location,
    monthlyBudget,
    purchaseBudget,
    propertyType,
    bedrooms,
    leaseTerm,
    financing,
    teamSize,
    officeSetup,
    businessType,
    message,
    source: source || "mobile_app"
  });

  await recordAdminActivity({
    eventType: "help_request",
    description: "Property help request received",
    details: `${name} • ${purpose} • ${location || "Location not specified"}`,
    path: "/admin/app/support-help?tab=requests",
    actorName: name,
    entityType: "help_request",
    entityId: String(request._id)
  });

  res.status(201).json({
    success: true,
    message: "Request submitted",
    request
  });
};

exports.getContactInfo = async (req, res) => {
  let contact = await ContactInfo.findOne();

  if (!contact) {
    contact = await ContactInfo.create({
      email: "support@rendahomes.com",
      phone: "",
      whatsapp: "",
      address: "Nairobi, Kenya"
    });
  }

  res.json({ contact });
};

exports.getUpdates = async (req, res) => {
  const updates = await AppUpdate.find({ isPublished: true }).sort({ publishedAt: -1 });
  res.json({ updates });
};

exports.subscribe = async (req, res) => {
  const { email } = req.body;
  const requestedSource = String(req.body.source || "mobile_app");
  const source = ["mobile_app", "website"].includes(requestedSource) ? requestedSource : null;

  if (!email || !source) {
    return res.status(400).json({ message: "A valid email and update audience are required" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existingSubscriber = await Subscriber.findOne({ email: normalizedEmail });

  const subscriber = await Subscriber.findOneAndUpdate(
    { email: normalizedEmail },
    { $set: { email: normalizedEmail, source, isActive: true }, $addToSet: { sources: source } },
    { new: true, upsert: true }
  );

  if (!existingSubscriber || existingSubscriber.isActive === false) {
    try {
      await sendEmail({
        to: subscriber.email,
        subject: "You’re subscribed to RendaHomes app updates",
        html: appSubscriptionConfirmedEmail({ source })
      });
    } catch (error) {
      console.error("Failed to send app subscription email:", error.message);
    }
  }

  res.status(201).json({ subscriber });
};

exports.getPolicyPage = async (req, res) => {
  const { slug } = req.params;

  const policy = await PolicyPage.findOne({ slug, isPublished: true });

  if (!policy) {
    return res.status(404).json({ message: "Policy not found" });
  }

  res.json({ policy });
};
