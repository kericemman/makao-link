const SupportCategory = require("../models/supportCategory.model");
const AppTicket = require("../models/appTicket.model");
const ContactInfo = require("../models/contactInfo.model");
const AppUpdate = require("../models/appUpdate.model");
const Subscriber = require("../models/subscriber.model");
const PolicyPage = require("../models/policyPage.model");

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

  res.status(201).json({ ticket });
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

  const subscriber = await Subscriber.findOneAndUpdate(
    { email: email.toLowerCase() },
    { email: email.toLowerCase(), source: source || "mobile_app", isActive: true },
    { new: true, upsert: true }
  );

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