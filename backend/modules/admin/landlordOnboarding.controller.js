const mongoose = require("mongoose");
const User = require("../users/user.model");
const Listing = require("../listings/listings.model");
const Subscription = require("../subscriptions/subscription.model");
const Followup = require("./landlordOnboardingFollowup.model");
const ContactInfo = require("../app/models/contactInfo.model");
const OnboardingMessage = require("./landlordOnboardingMessage.model");
const { buildWhatsAppUrl, buildWhatsAppSupportUrl, deriveOnboardingStage, retryFailedFollowup } = require("./landlordOnboarding.service");
const { sendManualLandlordEmail } = require("./landlordOnboardingContact.service");
const { recordAdminActivity } = require("./adminActivity.service");

exports.getLandlordOnboardingDetail = async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.userId)) return res.status(400).json({ success: false, message: "Invalid landlord ID." });
  try {
    const user = await User.findOne({
      _id: req.params.userId,
      $or: [{ role: "landlord" }, { roles: "landlord" }]
    }).select("name email phone role roles isEmailVerified createdAt onboardingSource").lean();
    if (!user) return res.status(404).json({ success: false, message: "Landlord account not found." });

    const [listingRows, subscription, followup, lastManualEmail] = await Promise.all([
      Listing.aggregate([
        { $match: { landlord: user._id } },
        { $group: {
          _id: "$landlord",
          total: { $sum: 1 },
          visible: { $sum: { $cond: [{ $ne: ["$isDeleted", true] }, 1, 0] } },
          deleted: { $sum: { $cond: [{ $eq: ["$isDeleted", true] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "pending"] }, { $ne: ["$isDeleted", true] }] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "rejected"] }, { $ne: ["$isDeleted", true] }] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "approved"] }, { $ne: ["$isDeleted", true] }] }, 1, 0] } }
        } }
      ]),
      Subscription.findOne({ user: user._id }).select("plan status currentPeriodEnd").lean(),
      Followup.findOne({ user: user._id, campaign: "signup_no_listing_v1" }).select("status attempts sentAt lastErrorCode").lean(),
      OnboardingMessage.findOne({ user: user._id, channel: "email" }).select("status sentAt createdAt errorCode").sort({ createdAt: -1 }).lean()
    ]);
    const listingCounts = listingRows[0] || { total: 0, visible: 0, deleted: 0, pending: 0, rejected: 0, approved: 0 };
    const stage = deriveOnboardingStage({ user, subscription, listingCounts });

    res.json({
      success: true,
      landlord: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        createdAt: user.createdAt,
        emailVerified: user.isEmailVerified,
        source: user.onboardingSource || "direct"
      },
      stage,
      listingCounts,
      subscription: subscription ? { plan: subscription.plan, status: subscription.status, currentPeriodEnd: subscription.currentPeriodEnd } : null,
      automatedFollowup: followup ? {
        status: followup.status,
        attempts: followup.attempts,
        sentAt: followup.sentAt,
        lastErrorCode: followup.lastErrorCode
      } : null,
      lastManualEmail: lastManualEmail ? {
        status: lastManualEmail.status,
        sentAt: lastManualEmail.sentAt,
        createdAt: lastManualEmail.createdAt,
        errorCode: lastManualEmail.errorCode
      } : null,
      emailConfigured: Boolean(process.env.RESEND_API_KEY),
      whatsappUrl: buildWhatsAppUrl(user.phone)
    });
  } catch (error) { next(error); }
};

exports.sendManualLandlordOnboardingEmail = async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.userId)) return res.status(400).json({ success: false, message: "Invalid landlord ID." });
  try {
    const result = await sendManualLandlordEmail({
      userId: req.params.userId,
      actorId: req.user._id,
      requestId: req.body?.requestId,
      subject: req.body?.subject,
      message: req.body?.message
    });
    if (result.status === "invalid_message") return res.status(400).json({ success: false, message: "Add a subject and message. Subject is limited to 160 characters and message to 4,000." });
    if (result.status === "email_not_configured") return res.status(503).json({ success: false, message: "Email delivery is not configured on this server." });
    if (result.status === "landlord_not_found") return res.status(404).json({ success: false, message: "Landlord account or email was not found." });
    if (result.status === "delivery_unknown") return res.status(409).json({ success: false, message: "A previous email has an unconfirmed delivery outcome. Check the email provider before sending another to avoid duplicates." });
    if (result.status === "sent" && result.alreadyProcessed) return res.json({ success: true, alreadySent: true, message: "This email request was already sent; it was not sent again." });
    if (result.status === "sent") {
      await recordAdminActivity({
        eventType: "landlord_onboarding_manual_email",
        description: "Manual landlord onboarding email sent",
        details: `Sent by ${req.user.name || req.user.email || "admin"}`,
        path: `/admin/onboarding/${req.params.userId}`,
        actor: req.user._id,
        actorName: req.user.name || req.user.email || "Admin",
        entityType: "landlord",
        entityId: req.params.userId,
        dedupeKey: `manual-onboarding-email:${req.body.requestId}`
      });
      return res.json({ success: true, message: "Email sent to the landlord." });
    }
    if (result.status === "failed") return res.status(502).json({ success: false, message: "The email provider rejected the message. You can prepare a new attempt." });
    return res.status(409).json({ success: false, message: "Delivery is still being confirmed or has an unknown outcome. Do not resend this message yet." });
  } catch (error) { next(error); }
};

exports.getLandlordOnboarding = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const filter = { $or: [{ role: "landlord" }, { roles: "landlord" }] };
    const [users, total] = await Promise.all([
      User.find(filter).select("name email role roles isEmailVerified createdAt onboardingSource subscription")
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter)
    ]);
    const ids = users.map((user) => user._id);
    const [listingRows, subscriptions, followups, contact] = await Promise.all([
      ids.length ? Listing.aggregate([
        { $match: { landlord: { $in: ids } } },
        { $group: {
          _id: "$landlord",
          total: { $sum: 1 },
          visible: { $sum: { $cond: [{ $ne: ["$isDeleted", true] }, 1, 0] } },
          deleted: { $sum: { $cond: [{ $eq: ["$isDeleted", true] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "pending"] }, { $ne: ["$isDeleted", true] }] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "rejected"] }, { $ne: ["$isDeleted", true] }] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "approved"] }, { $ne: ["$isDeleted", true] }] }, 1, 0] } }
        } }
      ]) : [],
      Subscription.find({ user: { $in: ids } }).select("user plan status").lean(),
      Followup.find({ user: { $in: ids }, campaign: "signup_no_listing_v1" }).select("user status attempts sentAt lastErrorCode").lean(),
      ContactInfo.findOne().select("whatsapp").lean()
    ]);
    const listingByUser = new Map(listingRows.map((row) => [String(row._id), row]));
    const subscriptionByUser = new Map(subscriptions.map((record) => [String(record.user), record]));
    const followupByUser = new Map(followups.map((record) => [String(record.user), record]));
    const whatsappUrl = buildWhatsAppSupportUrl(contact?.whatsapp);
    const delayHours = Math.min(168, Math.max(1, Number(process.env.LANDLORD_ONBOARDING_FOLLOWUP_DELAY_HOURS) || 24));
    const records = users.map((user) => {
      const listingCounts = listingByUser.get(String(user._id)) || { total: 0, visible: 0, deleted: 0, pending: 0, rejected: 0, approved: 0 };
      const subscription = subscriptionByUser.get(String(user._id)) || null;
      const stage = deriveOnboardingStage({ user, subscription, listingCounts });
      const followup = followupByUser.get(String(user._id)) || null;
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        emailVerified: user.isEmailVerified,
        source: user.onboardingSource || "direct",
        stage,
        subscription: subscription ? { plan: subscription.plan, status: subscription.status } : null,
        listingCounts,
        followup: followup ? {
          status: followup.status,
          attempts: followup.attempts,
          sentAt: followup.sentAt,
          lastErrorCode: followup.lastErrorCode
        } : null,
        eligibleForFollowup: stage === "no_listing" && user.onboardingSource !== "admin"
          && new Date(user.createdAt).getTime() <= Date.now() - delayHours * 60 * 60 * 1000
      };
    });
    const stageCounts = records.reduce((counts, record) => {
      counts[record.stage] = (counts[record.stage] || 0) + 1;
      return counts;
    }, {});
    res.json({
      success: true,
      records,
      stageCounts,
      whatsappUrl,
      followup: {
        enabled: process.env.LANDLORD_ONBOARDING_FOLLOWUP_ENABLED === "true",
        delayHours,
        emailConfigured: Boolean(process.env.RESEND_API_KEY),
        channel: "email"
      },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) { next(error); }
};

exports.retryLandlordFollowup = async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.userId)) return res.status(400).json({ success: false, message: "Invalid landlord ID." });
  try {
    const result = await retryFailedFollowup({ userId: req.params.userId, actorId: req.user._id });
    if (result.status === "not_retryable") return res.status(409).json({ success: false, message: "Only a confirmed failed delivery can be retried. Unknown delivery outcomes are not resent automatically." });
    if (["disabled", "email_not_configured"].includes(result.status)) return res.status(503).json({ success: false, message: "Follow-up email delivery is not enabled or configured." });
    if (result.status !== "sent") return res.status(502).json({ success: false, message: `Follow-up delivery status: ${result.status}.` });
    res.json({ success: true, message: "Follow-up email sent." });
  } catch (error) { next(error); }
};
