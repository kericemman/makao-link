const SupportCategory = require("../models/supportCategory.model");
const AppTicket = require("../models/appTicket.model");
const ContactInfo = require("../models/contactInfo.model");
const AppUpdate = require("../models/appUpdate.model");
const Subscriber = require("../models/subscriber.model");
const PolicyPage = require("../models/policyPage.model");
const HelpRequest = require("../models/helpRequest.model");
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
  const { email, source } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const normalizedEmail = email.toLowerCase();
  const existingSubscriber = await Subscriber.findOne({ email: normalizedEmail });

  const subscriber = await Subscriber.findOneAndUpdate(
    { email: normalizedEmail },
    { email: normalizedEmail, source: source || "mobile_app", isActive: true },
    { new: true, upsert: true }
  );

  if (!existingSubscriber || existingSubscriber.isActive === false) {
    try {
      await sendEmail({
        to: subscriber.email,
        subject: "You’re subscribed to RendaHomes app updates",
        html: appSubscriptionConfirmedEmail()
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
