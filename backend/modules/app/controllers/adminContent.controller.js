const SupportCategory = require("../models/supportCategory.model");
const AppTicket = require("../models/appTicket.model");
const ContactInfo = require("../models/contactInfo.model");
const AppUpdate = require("../models/appUpdate.model");
const Subscriber = require("../models/subscriber.model");
const PolicyPage = require("../models/policyPage.model");

/* SUPPORT CATEGORIES */
exports.getSupportCategories = async (req, res) => {
  const categories = await SupportCategory.find().sort({ createdAt: -1 });
  res.json({ categories });
};

exports.createSupportCategory = async (req, res) => {
  const category = await SupportCategory.create(req.body);
  res.status(201).json({ category });
};

exports.updateSupportCategory = async (req, res) => {
  const category = await SupportCategory.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  });

  if (!category) return res.status(404).json({ message: "Category not found" });

  res.json({ category });
};

exports.deleteSupportCategory = async (req, res) => {
  const category = await SupportCategory.findByIdAndDelete(req.params.id);

  if (!category) return res.status(404).json({ message: "Category not found" });

  res.json({ message: "Category deleted" });
};

/* SUPPORT TICKETS */
exports.getSupportTickets = async (req, res) => {
  const tickets = await SupportTicket.find()
    .populate("category", "title")
    .populate("user", "name email phone")
    .sort({ createdAt: -1 });

  res.json({ tickets });
};

exports.updateSupportTicket = async (req, res) => {
  const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  })
    .populate("category", "title")
    .populate("user", "name email phone");

  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  res.json({ ticket });
};

exports.deleteSupportTicket = async (req, res) => {
  const ticket = await SupportTicket.findByIdAndDelete(req.params.id);

  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  res.json({ message: "Ticket deleted" });
};

/* CONTACT INFO */
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

exports.updateContactInfo = async (req, res) => {
  let contact = await ContactInfo.findOne();

  if (!contact) {
    contact = await ContactInfo.create(req.body);
  } else {
    contact = await ContactInfo.findByIdAndUpdate(contact._id, req.body, {
      new: true
    });
  }

  res.json({ contact });
};

/* APP UPDATES */
exports.getUpdates = async (req, res) => {
  const updates = await AppUpdate.find().sort({ createdAt: -1 });
  res.json({ updates });
};

exports.createUpdate = async (req, res) => {
  const update = await AppUpdate.create(req.body);
  res.status(201).json({ update });
};

exports.updateUpdate = async (req, res) => {
  const update = await AppUpdate.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  });

  if (!update) return res.status(404).json({ message: "Update not found" });

  res.json({ update });
};

exports.deleteUpdate = async (req, res) => {
  const update = await AppUpdate.findByIdAndDelete(req.params.id);

  if (!update) return res.status(404).json({ message: "Update not found" });

  res.json({ message: "Update deleted" });
};

/* SUBSCRIBERS */
exports.getSubscribers = async (req, res) => {
  const subscribers = await Subscriber.find().sort({ createdAt: -1 });
  res.json({ subscribers });
};

exports.updateSubscriber = async (req, res) => {
  const subscriber = await Subscriber.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  });

  if (!subscriber) return res.status(404).json({ message: "Subscriber not found" });

  res.json({ subscriber });
};

/* POLICIES */
exports.getPolicies = async (req, res) => {
  const policies = await PolicyPage.find().sort({ createdAt: -1 });
  res.json({ policies });
};

exports.upsertPolicy = async (req, res) => {
  const { slug, title, body, isPublished } = req.body;

  if (!slug || !title || !body) {
    return res.status(400).json({ message: "Slug, title and body are required" });
  }

  const policy = await PolicyPage.findOneAndUpdate(
    { slug },
    { slug, title, body, isPublished },
    { new: true, upsert: true }
  );

  res.status(201).json({ policy });
};

exports.updatePolicy = async (req, res) => {
  const policy = await PolicyPage.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  });

  if (!policy) return res.status(404).json({ message: "Policy not found" });

  res.json({ policy });
};