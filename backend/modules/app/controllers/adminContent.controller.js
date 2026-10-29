const SupportCategory = require("../models/supportCategory.model");
const AppTicket = require("../models/appTicket.model");
const ContactInfo = require("../models/contactInfo.model");
const AppUpdate = require("../models/appUpdate.model");
const Subscriber = require("../models/subscriber.model");
const NewsletterSubscriber = require("../../blog/NewsletterSubscriber.model");
const PolicyPage = require("../models/policyPage.model");
const HelpRequest = require("../models/helpRequest.model");
const sendEmail = require("../../../utils/sendEmail");
const { appUpdatePublishedEmail } = require("../../../utils/emailTemplates");
const { recordAdminActivity } = require("../../admin/adminActivity.service");

const sendUpdateNotificationToSubscribers = async (update) => {
  const audience = update.emailAudience || "mobile_app";
  const includeWebsite = audience === "website" || audience === "all";
  const includeMobile = audience === "mobile_app" || audience === "all";
  const subscriberQueries = [];

  if (includeMobile) {
    subscriberQueries.push(Subscriber.find({ isActive: true, source: "mobile_app" }).select("email"));
  }
  if (includeWebsite) {
    subscriberQueries.push(Subscriber.find({ isActive: true, source: "website" }).select("email"));
    subscriberQueries.push(NewsletterSubscriber.find({ isActive: true }).select("email"));
  }

  const subscriberGroups = await Promise.all(subscriberQueries);
  const uniqueEmails = [...new Set(subscriberGroups.flat().map((subscriber) => subscriber.email?.toLowerCase()).filter(Boolean))];

  for (const email of uniqueEmails) {
    try {
      await sendEmail({
        to: email,
        subject: `New RendaHomes update: ${update.title}`,
        html: appUpdatePublishedEmail({
          title: update.title,
          body: update.body,
          category: update.category,
          audience
        })
      });
    } catch (error) {
      console.error(
        `Failed to send update email to ${email}:`,
        error.message
      );
    }
  }
};

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
  const tickets = await AppTicket.find()
    .populate("category", "title")
    .populate("user", "name email phone")
    .sort({ createdAt: -1 });

  res.json({ tickets });
};

exports.updateSupportTicket = async (req, res) => {
  const ticket = await AppTicket.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  })
    .populate("category", "title")
    .populate("user", "name email phone");

  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  res.json({ ticket });
};

exports.deleteSupportTicket = async (req, res) => {
  const ticket = await AppTicket.findByIdAndDelete(req.params.id);

  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  res.json({ message: "Ticket deleted" });
};

/* HELP REQUESTS */
exports.getHelpRequests = async (req, res) => {
  const requests = await HelpRequest.find().sort({ createdAt: -1 });
  res.json({ requests });
};

exports.updateHelpRequest = async (req, res) => {
  const request = await HelpRequest.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  });

  if (!request) return res.status(404).json({ message: "Help request not found" });

  res.json({ request });
};

exports.deleteHelpRequest = async (req, res) => {
  const request = await HelpRequest.findByIdAndDelete(req.params.id);

  if (!request) return res.status(404).json({ message: "Help request not found" });

  res.json({ message: "Help request deleted" });
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
  const update = await AppUpdate.create({
    ...req.body,
    publishedAt: req.body.isPublished === false ? null : new Date()
  });

  if (update.isPublished) {
    await sendUpdateNotificationToSubscribers(update);
    update.emailNotifiedAt = new Date();
    await update.save();
  }

  await recordAdminActivity({
    eventType: update.isPublished ? "app_update" : "app_update_draft",
    description: update.isPublished ? "Mobile app update published" : "Mobile app update draft created",
    details: update.title,
    path: "/admin/app/updates",
    actor: req.user._id,
    actorName: req.user.name,
    readBy: [req.user._id],
    entityType: "app_update",
    entityId: String(update._id),
    dedupeKey: `${update.isPublished ? "app_update" : "app_update_draft"}:${update._id}:${update.updatedAt.getTime()}`
  });

  res.status(201).json({ update });
};

exports.updateUpdate = async (req, res) => {
  const existingUpdate = await AppUpdate.findById(req.params.id);

  if (!existingUpdate) return res.status(404).json({ message: "Update not found" });

  const updatePayload = { ...req.body };
  const isPublishingNow =
    req.body.isPublished === true && existingUpdate.isPublished === false;

  if (isPublishingNow) {
    updatePayload.publishedAt = new Date();
  }

  const update = await AppUpdate.findByIdAndUpdate(req.params.id, updatePayload, {
    new: true
  });

  const shouldNotify =
    update.isPublished &&
    isPublishingNow &&
    !update.emailNotifiedAt;

  if (shouldNotify) {
    await sendUpdateNotificationToSubscribers(update);
    update.emailNotifiedAt = new Date();
    await update.save();
  }

  await recordAdminActivity({
    eventType: update.isPublished ? "app_update" : "app_update_draft",
    description: isPublishingNow ? "Mobile app update published" : "Mobile app update edited",
    details: update.title,
    path: "/admin/app/updates",
    actor: req.user._id,
    actorName: req.user.name,
    readBy: [req.user._id],
    entityType: "app_update",
    entityId: String(update._id),
    dedupeKey: `app_update_edit:${update._id}:${update.updatedAt.getTime()}`
  });

  res.json({ update });
};

exports.deleteUpdate = async (req, res) => {
  const update = await AppUpdate.findByIdAndDelete(req.params.id);

  if (!update) return res.status(404).json({ message: "Update not found" });

  res.json({ message: "Update deleted" });
};

/* SUBSCRIBERS */
exports.getSubscribers = async (req, res) => {
  const [appSubscribers, websiteNewsletterSubscribers] = await Promise.all([
    Subscriber.find().sort({ createdAt: -1 }),
    NewsletterSubscriber.find().sort({ createdAt: -1 })
  ]);
  const subscriberMap = new Map();

  const addSubscriber = (subscriber, source) => {
    const email = subscriber.email?.trim().toLowerCase();
    if (!email) return;

    const existing = subscriberMap.get(email) || {
      _id: email,
      email,
      sources: [],
      isActive: false,
      createdAt: subscriber.subscribedAt || subscriber.createdAt
    };
    if (!existing.sources.includes(source)) existing.sources.push(source);
    existing.isActive = existing.isActive || subscriber.isActive;
    const createdAt = subscriber.subscribedAt || subscriber.createdAt;
    if (createdAt && (!existing.createdAt || new Date(createdAt) < new Date(existing.createdAt))) {
      existing.createdAt = createdAt;
    }
    subscriberMap.set(email, existing);
  };

  appSubscribers.forEach((subscriber) => {
    addSubscriber(subscriber, subscriber.source === "website" ? "website" : "mobile_app");
  });
  websiteNewsletterSubscribers.forEach((subscriber) => addSubscriber(subscriber, "website"));

  const subscribers = [...subscriberMap.values()].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  res.json({ subscribers });
};

exports.updateSubscriberStatus = async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!email || typeof req.body.isActive !== "boolean") {
    return res.status(400).json({ message: "Email and subscriber status are required" });
  }

  const [appResult, websiteResult] = await Promise.all([
    Subscriber.updateMany({ email }, { $set: { isActive: req.body.isActive } }),
    NewsletterSubscriber.updateMany({ email }, { $set: { isActive: req.body.isActive } })
  ]);

  if (!appResult.matchedCount && !websiteResult.matchedCount) {
    return res.status(404).json({ message: "Subscriber not found" });
  }

  res.json({ success: true, email, isActive: req.body.isActive });
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
