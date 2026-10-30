const mongoose = require("mongoose");
const Listing = require("../listings/listings.model");
const sendEmail = require("../../utils/sendEmail");
const {
  listingApprovedEmail,
  listingRejectedEmail,
  partnerApprovedEmail,
  partnerRejectedEmail
} = require("../../utils/emailTemplates");
const User = require("../users/user.model");
const Subscription = require("../subscriptions/subscription.model");
const Payment = require("../payments/payment.model");
const WhatsAppListingAddon = require("../payments/whatsappListingAddon.model");
const plans = require("../payments/plan.config");
const Inquiry = require("../inquiries/inquiry.model");
const SupportTicket = require("../support/support.model");
const PartnerApplication = require("../services/partnerApplication.model");
const ServicePartner = require("../services/servicePartner.model");
const ListingReport = require("../listingReports/listingReport.model");
const Kyc = require("../kyc/kyc.model");
const StayBooking = require("../stays/stayBooking.model");
const HelpRequest = require("../app/models/helpRequest.model");
const AppTicket = require("../app/models/appTicket.model");
const AppSubscriber = require("../app/models/subscriber.model");
const AppUpdate = require("../app/models/appUpdate.model");
const AdminActivity = require("./adminActivity.model");
const { recordAdminActivity } = require("./adminActivity.service");
const { queueStatusNotificationSafely } = require("../renda-assistant/notifications.service");

const LISTING_TRASH_RETENTION_DAYS = 30;

const purgeExpiredDeletedListings = async () => {
  await Listing.deleteMany({
    isDeleted: true,
    deleteExpiresAt: { $lte: new Date() }
  });
};


exports.getPendingListings = async (req, res, next) => {
  try {
    await purgeExpiredDeletedListings();

    const listings = await Listing.find({ status: "pending", isDeleted: { $ne: true } })
      .populate("landlord", "name email phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      listings
    });
  } catch (error) {
    next(error);
  }
};

exports.approveListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate("landlord");

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    listing.status = "approved";
    listing.isActive = true;
    listing.unlistReason = null;
    listing.verificationStatus = listing.verificationStatus === "verified" ? "verified" : "reviewed";
    listing.reviewedByAdmin = req.user._id;
    listing.reviewedAt = new Date();
    listing.availabilityCheckedAt = listing.availabilityCheckedAt || new Date();
    await listing.save();
    await queueStatusNotificationSafely({ userId: listing.landlord?._id, eventType: "listing_approved", entityId: listing._id, eventVersion: listing.reviewedAt.getTime() });
    await recordAdminActivity({
      eventType: "listing_approved",
      description: "Listing approved",
      details: `${listing.title} • ${listing.landlord?.name || "Landlord"}`,
      path: "/admin/listings",
      actor: req.user._id,
      actorName: req.user.name,
      readBy: [req.user._id],
      entityType: "listing",
      entityId: String(listing._id),
      dedupeKey: `listing_approved:${listing._id}:${listing.reviewedAt.getTime()}`
    });

    await sendEmail({
        to: listing.landlord.email,
        subject: "Listing Approved",
        html: listingApprovedEmail({
          name: listing.landlord.name,
          listingTitle: listing.title
        })
      });

    res.json({
      success: true,
      message: "Listing approved",
      listing
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate("landlord");

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    listing.status = "rejected";
    listing.isActive = false;
    listing.verificationStatus = "flagged";
    listing.reviewedByAdmin = req.user._id;
    listing.reviewedAt = new Date();
    await listing.save();
    await queueStatusNotificationSafely({ userId: listing.landlord?._id, eventType: "listing_rejected", entityId: listing._id, eventVersion: listing.reviewedAt.getTime() });
    await recordAdminActivity({
      eventType: "listing_rejected",
      description: "Listing rejected",
      details: `${listing.title} • ${listing.landlord?.name || "Landlord"}`,
      path: "/admin/listings",
      actor: req.user._id,
      actorName: req.user.name,
      readBy: [req.user._id],
      entityType: "listing",
      entityId: String(listing._id),
      dedupeKey: `listing_rejected:${listing._id}:${listing.reviewedAt.getTime()}`
    });

     await sendEmail({
        to: listing.landlord.email,
        subject: "Listing Rejected",
        html: listingRejectedEmail({
          name: listing.landlord.name,
          listingTitle: listing.title
        })
      });

    res.json({
      success: true,
      message: "Listing rejected",
      listing
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminSummary = async (req, res, next) => {
  try {
    const [
      pendingListings,
      approvedListings,
      rejectedListings,
      totalListings,
      landlords,
      totalInquiries,
      activeSubscriptions,
      pendingPayments,
      totalSupportTickets,
      openSupportTickets,
      pendingKycReviews,
      newListingReports,
      pendingServiceApplications,
      activeAgents,
      requestedStays,
      newHelpRequests,
      openAppSupportTickets,
      activeAppSubscribers,
      publishedAppUpdates,
      revenueAgg
    ] = await Promise.all([
      Listing.countDocuments({ status: "pending", isDeleted: { $ne: true } }),
      Listing.countDocuments({ status: "approved", isDeleted: { $ne: true } }),
      Listing.countDocuments({ status: "rejected", isDeleted: { $ne: true } }),
      Listing.countDocuments({ isDeleted: { $ne: true } }),
      User.countDocuments({ role: "landlord" }),
      Inquiry.countDocuments(),
      Subscription.countDocuments({ status: "active" }),
      Subscription.countDocuments({ status: "pending_payment" }),
      SupportTicket.countDocuments(),
      SupportTicket.countDocuments({ status: { $in: ["open", "in_progress"] } }),
      Kyc.countDocuments({ status: "pending" }),
      ListingReport.countDocuments({ status: { $in: ["new", "reviewing"] } }),
      PartnerApplication.countDocuments({ status: "pending_review" }),
      User.countDocuments({ role: "agent", agentStatus: "active" }),
      StayBooking.countDocuments({ status: "requested" }),
      HelpRequest.countDocuments({ status: "new" }),
      AppTicket.countDocuments({ status: { $in: ["open", "reviewing"] } }),
      AppSubscriber.countDocuments({ source: "mobile_app", isActive: true }),
      AppUpdate.countDocuments({ isPublished: true }),
      Payment.aggregate([
        {
          $match: {
            status: "success"
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" }
          }
        }
      ])
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;

    res.json({
      success: true,
      summary: {
        pendingListings,
        approvedListings,
        rejectedListings,
        totalListings,
        landlords,
        totalInquiries,
        totalRevenue,
        activeSubscriptions,
        pendingPayments,
        totalSupportTickets,
        openSupportTickets,
        pendingKycReviews,
        newListingReports,
        pendingServiceApplications,
        activeAgents,
        requestedStays,
        newHelpRequests,
        openAppSupportTickets,
        activeAppSubscribers,
        publishedAppUpdates
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminOverviewTrends = async (req, res, next) => {
  try {
    const rangeDays = { "7d": 7, "30d": 30, "90d": 90 };
    const range = rangeDays[req.query.range] ? req.query.range : "30d";
    const dayCount = rangeDays[range];
    const now = new Date();
    const dateKey = (date) => {
      const parts = new Intl.DateTimeFormat("en", {
        timeZone: "Africa/Nairobi",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).formatToParts(date);
      const part = (type) => parts.find((item) => item.type === type)?.value;
      return `${part("year")}-${part("month")}-${part("day")}`;
    };
    const todayKey = dateKey(now);
    const [year, month, day] = todayKey.split("-").map(Number);
    const firstDayUtc = Date.UTC(year, month - 1, day - (dayCount - 1));
    const keys = Array.from({ length: dayCount }, (_, index) => {
      const current = new Date(firstDayUtc + index * 86400000);
      return `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, "0")}-${String(current.getUTCDate()).padStart(2, "0")}`;
    });
    const startDate = new Date(firstDayUtc - 3 * 60 * 60 * 1000);
    const dateGroup = (field) => ({
      $dateToString: { format: "%Y-%m-%d", date: `$${field}`, timezone: "Africa/Nairobi" }
    });
    const countByDate = (Model, match, field = "createdAt") => Model.aggregate([
      { $match: { ...match, [field]: { $gte: startDate, $lte: now } } },
      { $group: { _id: dateGroup(field), count: { $sum: 1 } } }
    ]);

    const [landlords, listingsSubmitted, listingsApproved, inquiries, stayRequests, payments] = await Promise.all([
      countByDate(User, { role: "landlord" }),
      countByDate(Listing, { isDeleted: { $ne: true } }),
      countByDate(Listing, { status: "approved", isDeleted: { $ne: true } }, "reviewedAt"),
      countByDate(Inquiry, {}),
      countByDate(StayBooking, {}),
      Payment.aggregate([
        { $match: { status: "success", paidAt: { $gte: startDate, $lte: now } } },
        { $group: { _id: dateGroup("paidAt"), amount: { $sum: "$amount" } } }
      ])
    ]);

    const toCountMap = (rows) => new Map(rows.map((row) => [row._id, row.count]));
    const toAmountMap = (rows) => new Map(rows.map((row) => [row._id, row.amount]));
    const landlordMap = toCountMap(landlords);
    const submittedMap = toCountMap(listingsSubmitted);
    const approvedMap = toCountMap(listingsApproved);
    const inquiryMap = toCountMap(inquiries);
    const stayMap = toCountMap(stayRequests);
    const paymentMap = toAmountMap(payments);

    res.json({
      success: true,
      range,
      timezone: "Africa/Nairobi",
      trends: {
        activity: keys.map((date) => ({
          date,
          landlords: landlordMap.get(date) || 0,
          listingsSubmitted: submittedMap.get(date) || 0,
          listingsApproved: approvedMap.get(date) || 0,
          inquiries: inquiryMap.get(date) || 0,
          stayRequests: stayMap.get(date) || 0
        })),
        payments: keys.map((date) => ({ date, amount: paymentMap.get(date) || 0 }))
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminCommercialOverview = async (req, res, next) => {
  try {
    const now = new Date();
    const [totalLandlords, planRows, totalAgents, activeAgents, referralRows, paidReferralRows, paymentReferralRows, agents, addonStatuses, autoRenewingAddons, nonRenewingAddons] = await Promise.all([
      User.countDocuments({ role: "landlord" }),
      Subscription.aggregate([
        { $group: { _id: { plan: "$plan", status: "$status" }, count: { $sum: 1 } } }
      ]),
      User.countDocuments({ role: "agent" }),
      User.countDocuments({ role: "agent", agentStatus: "active" }),
      User.aggregate([
        { $match: { role: "landlord", onboardedByAgent: { $ne: null } } },
        { $group: { _id: "$onboardedByAgent", count: { $sum: 1 } } }
      ]),
      Subscription.aggregate([
        { $match: { status: { $in: ["active", "grace"] }, plan: { $ne: "normal" } } },
        { $lookup: { from: User.collection.name, localField: "user", foreignField: "_id", as: "landlord" } },
        { $unwind: "$landlord" },
        { $match: { "landlord.role": "landlord", "landlord.onboardedByAgent": { $ne: null } } },
        { $group: { _id: "$landlord.onboardedByAgent", count: { $sum: 1 } } }
      ]),
      Payment.aggregate([
        { $match: { status: "success" } },
        { $lookup: { from: User.collection.name, localField: "user", foreignField: "_id", as: "payer" } },
        { $unwind: "$payer" },
        { $match: { "payer.role": "landlord", "payer.onboardedByAgent": { $ne: null } } },
        { $group: { _id: "$payer.onboardedByAgent", amount: { $sum: "$amount" } } }
      ]),
      User.find({ role: "agent" }).select("name agentCode agentStatus commissionRate").lean(),
      WhatsAppListingAddon.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      WhatsAppListingAddon.countDocuments({
        status: "active",
        $or: [{ currentPeriodEnd: null }, { currentPeriodEnd: { $gt: now } }]
      }),
      WhatsAppListingAddon.countDocuments({
        status: "non_renewing",
        $or: [{ currentPeriodEnd: null }, { currentPeriodEnd: { $gt: now } }]
      })
    ]);

    const plansByKey = new Map();
    planRows.forEach(({ _id, count }) => {
      const value = plansByKey.get(_id.plan) || { total: 0, current: 0, pending: 0, grace: 0, inactive: 0 };
      value.total += count;
      if ((_id.plan === "normal" && _id.status === "free") || (_id.plan !== "normal" && _id.status === "active")) value.current += count;
      if (_id.status === "pending_payment") value.pending += count;
      if (_id.status === "grace") value.grace += count;
      if (["expired", "cancelled"].includes(_id.status)) value.inactive += count;
      plansByKey.set(_id.plan, value);
    });

    const referralCounts = new Map(referralRows.map((row) => [String(row._id), row.count]));
    const paidReferralCounts = new Map(paidReferralRows.map((row) => [String(row._id), row.count]));
    const referralRevenue = new Map(paymentReferralRows.map((row) => [String(row._id), row.amount]));
    const agentPerformance = agents.map((agent) => {
      const id = String(agent._id);
      const paymentRevenue = referralRevenue.get(id) || 0;
      const commissionEstimate = Math.round(paymentRevenue * ((agent.commissionRate || 0) / 100));
      return {
        id,
        name: agent.name,
        code: agent.agentCode,
        status: agent.agentStatus,
        referredLandlords: referralCounts.get(id) || 0,
        paidLandlords: paidReferralCounts.get(id) || 0,
        attributedPayments: paymentRevenue,
        estimatedCommission: commissionEstimate
      };
    }).sort((a, b) => b.referredLandlords - a.referredLandlords || b.attributedPayments - a.attributedPayments);

    const referredLandlords = referralRows.reduce((sum, row) => sum + row.count, 0);
    const paidLandlords = paidReferralRows.reduce((sum, row) => sum + row.count, 0);
    const attributedPayments = paymentReferralRows.reduce((sum, row) => sum + row.amount, 0);
    const estimatedCommission = agentPerformance.reduce((sum, agent) => sum + agent.estimatedCommission, 0);
    const addonStatusMap = new Map(addonStatuses.map(({ _id, count }) => [_id, count]));
    const addonMonthlyEstimate = autoRenewingAddons * 300;

    res.json({
      success: true,
      plans: {
        totalLandlords,
        subscriptionRecords: planRows.reduce((sum, row) => sum + row.count, 0),
        withoutSubscription: Math.max(0, totalLandlords - planRows.reduce((sum, row) => sum + row.count, 0)),
        distribution: ["normal", "basic", "premium", "pro"].map((plan) => ({ plan, ...(plansByKey.get(plan) || { total: 0, current: 0, pending: 0, grace: 0, inactive: 0 }) }))
      },
      referrals: {
        totalAgents,
        activeAgents,
        referredLandlords,
        paidLandlords,
        conversionRate: referredLandlords ? Math.round((paidLandlords / referredLandlords) * 100) : 0,
        attributedPayments,
        estimatedCommission,
        commissionBasis: "Estimate from successful subscription payments using current agent commission rates; no payout ledger is recorded.",
        topAgents: agentPerformance.slice(0, 5)
      },
      whatsappAddon: {
        monthlyPrice: 300,
        autoRenewing: autoRenewingAddons,
        nonRenewing: nonRenewingAddons,
        activeAccess: autoRenewingAddons + nonRenewingAddons,
        pendingPayment: addonStatusMap.get("pending_payment") || 0,
        pastDue: addonStatusMap.get("past_due") || 0,
        estimatedMonthlyRecurring: addonMonthlyEstimate,
        includedPremiumPro: (plansByKey.get("premium")?.current || 0) + (plansByKey.get("pro")?.current || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminNotifications = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
    const adminId = req.user._id;
    const [records, unreadCount] = await Promise.all([
      AdminActivity.find().sort({ createdAt: -1 }).limit(limit).lean(),
      AdminActivity.countDocuments({ readBy: { $ne: adminId } })
    ]);
    res.json({
      success: true,
      unreadCount,
      notifications: records.map((record) => ({
        ...record,
        read: record.readBy?.some((id) => String(id) === String(adminId)) || false
      }))
    });
  } catch (error) {
    next(error);
  }
};

exports.markAdminNotificationRead = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid notification id" });
    const notification = await AdminActivity.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: req.user._id } },
      { new: true }
    ).lean();
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    const unreadCount = await AdminActivity.countDocuments({ readBy: { $ne: req.user._id } });
    res.json({ success: true, unreadCount, notificationId: notification._id });
  } catch (error) {
    next(error);
  }
};

exports.markAllAdminNotificationsRead = async (req, res, next) => {
  try {
    await AdminActivity.updateMany(
      { readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );
    res.json({ success: true, unreadCount: 0 });
  } catch (error) {
    next(error);
  }
};

exports.getRecentActivity = async (req, res, next) => {
  try {
    const [recentListings, recentPayments, recentInquiries, recentSupport, recentReports, recentStays, recentHelpRequests, recentAppTickets, recentKycs, recentApplications, recentAgents, recentAppUpdates] = await Promise.all([
      Listing.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(5).populate("landlord", "name"),
      Payment.find({ status: "success" }).sort({ createdAt: -1 }).limit(5),
      Inquiry.find().sort({ createdAt: -1 }).limit(5),
      SupportTicket.find().sort({ updatedAt: -1 }).limit(5).populate("landlord", "name"),
      ListingReport.find({ status: { $in: ["new", "reviewing"] } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("listing", "title"),
      StayBooking.find().sort({ createdAt: -1 }).limit(5).populate("listing", "title").populate("landlord", "name"),
      HelpRequest.find().sort({ createdAt: -1 }).limit(5),
      AppTicket.find().sort({ createdAt: -1 }).limit(5).populate("user", "name"),
      Kyc.find({ status: "pending" }).sort({ createdAt: -1 }).limit(5).populate("landlord", "name"),
      PartnerApplication.find({ status: "pending_review" }).sort({ createdAt: -1 }).limit(5),
      User.find({ role: "agent" }).sort({ createdAt: -1 }).limit(5),
      AppUpdate.find().sort({ updatedAt: -1 }).limit(5)
    ]);

    const activities = [
      ...recentListings.map((item) => ({
        type: "listing_submission",
        description: "New listing submitted",
        details: `${item.title} by ${item.landlord?.name || "Unknown landlord"}`,
        path: "/admin/listings/pending",
        createdAt: item.createdAt,
        entityType: "listing",
        entityId: String(item._id)
      })),
      ...recentPayments.map((item) => ({
        type: "payment_received",
        description: "Payment received",
        details: `KES ${item.amount.toLocaleString()} • ${item.reference}`,
        path: "/admin/payments",
        createdAt: item.createdAt,
        entityType: "payment",
        entityId: String(item._id)
      })),
      ...recentInquiries.map((item) => ({
        type: "inquiry_sent",
        description: "New inquiry received",
        details: `${item.name} sent an inquiry`,
        path: `/admin/inquiries/${item._id}`,
        createdAt: item.createdAt,
        entityType: "inquiry",
        entityId: String(item._id)
      })),
      ...recentSupport.map((item) => ({
        type: "support_ticket",
        description: "Support ticket updated",
        details: `${item.subject} • ${item.landlord?.name || "Unknown landlord"}`,
        path: `/admin/support/${item._id}`,
        createdAt: item.updatedAt,
        entityType: "support_ticket",
        entityId: String(item._id)
      })),
      ...recentReports.map((item) => ({
        type: "listing_report",
        description: "Listing report received",
        details: `${item.listing?.title || "Listing"} • ${item.reason.replace(/_/g, " ")}`,
        path: "/admin/listings/reports",
        createdAt: item.createdAt,
        entityType: "listing_report",
        entityId: String(item._id)
      })),
      ...recentStays.map((item) => ({
        type: "stay_request",
        description: "Short-stay request received",
        details: `${item.listing?.title || "Property"} • ${item.guestName} • ${item.status}`,
        path: "/admin/stay-requests",
        createdAt: item.createdAt,
        entityType: "stay_request",
        entityId: String(item._id)
      })),
      ...recentHelpRequests.map((item) => ({
        type: "help_request",
        description: "Property help request received",
        details: `${item.name} • ${item.purpose} • ${item.location || "Location not specified"}`,
        path: "/admin/app/support-help?tab=requests",
        createdAt: item.createdAt,
        entityType: "help_request",
        entityId: String(item._id)
      })),
      ...recentAppTickets.map((item) => ({
        type: "app_support_ticket",
        description: "Mobile support ticket received",
        details: `${item.subject} • ${item.user?.name || "Guest user"}`,
        path: "/admin/app/support-help?tab=tickets",
        createdAt: item.createdAt,
        entityType: "app_ticket",
        entityId: String(item._id)
      })),
      ...recentKycs.map((item) => ({
        type: "kyc_submission",
        description: "Landlord verification submitted",
        details: `${item.fullName} • ${item.landlord?.name || "Landlord"}`,
        path: "/admin/kyc",
        createdAt: item.createdAt,
        entityType: "kyc",
        entityId: String(item._id)
      })),
      ...recentApplications.map((item) => ({
        type: "service_application",
        description: "Service provider application received",
        details: `${item.companyName} • ${item.category}`,
        path: `/admin/services/applications/${item._id}`,
        createdAt: item.createdAt,
        entityType: "service_application",
        entityId: String(item._id)
      })),
      ...recentAgents.map((item) => ({
        type: "agent_created",
        description: "Agent account created",
        details: `${item.name} • ${item.agentCode || item.email}`,
        path: "/admin/agents",
        createdAt: item.createdAt,
        entityType: "agent",
        entityId: String(item._id)
      })),
      ...recentAppUpdates.map((item) => ({
        type: "app_update",
        description: item.isPublished ? "Mobile app update published" : "Mobile app update edited",
        details: item.title,
        path: "/admin/app/updates",
        createdAt: item.updatedAt,
        entityType: "app_update",
        entityId: String(item._id)
      }))
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    const existingAdmins = await User.find({ role: "admin" }).select("_id").lean();
    const existingAdminIds = existingAdmins.map((admin) => admin._id);
    await Promise.all(activities.map((activity) => recordAdminActivity({
      eventType: activity.type,
      description: activity.description,
      details: activity.details,
      path: activity.path,
      readBy: existingAdminIds,
      entityType: activity.entityType,
      entityId: activity.entityId,
      dedupeKey: `${activity.type}:${activity.entityType}:${activity.entityId}`,
      occurredAt: activity.createdAt
    })));
    const records = await AdminActivity.find().sort({ createdAt: -1 }).limit(40).lean();

    res.json({
      success: true,
      activities: records.map((record) => ({
        id: String(record._id),
        type: record.eventType,
        description: record.description,
        details: record.details,
        path: record.path,
        actorName: record.actorName,
        createdAt: record.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminStayRequests = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status && ["requested", "confirmed", "declined", "cancelled", "completed"].includes(req.query.status)) {
      filter.status = req.query.status;
    }
    const requests = await StayBooking.find(filter)
      .populate("listing", "title images price purpose town county")
      .populate("landlord", "name email phone")
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();
    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

exports.getLandlords = async (req, res, next) => {
  try {
    const landlords = await User.find({ role: "landlord" })
      .populate("subscription")
      .sort({ createdAt: -1 });

    const enrichedLandlords = await Promise.all(
      landlords.map(async (landlord) => {
        const totalListings = await Listing.countDocuments({
          landlord: landlord._id
        });

        const activeListings = await Listing.countDocuments({
          landlord: landlord._id,
          isActive: true,
          availability: "available"
        });

        const subscription = landlord.subscription;
        const planConfig = subscription ? plans[subscription.plan] : null;

        return {
          _id: landlord._id,
          name: landlord.name,
          email: landlord.email,
          phone: landlord.phone,
          createdAt: landlord.createdAt,
          subscription: subscription
            ? {
                plan: subscription.plan,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd,
                gracePeriodEnd: subscription.gracePeriodEnd,
                listingLimit: planConfig?.listingLimit || 0
              }
            : null,
          stats: {
            totalListings,
            activeListings
          }
        };
      })
    );

    res.json({
      success: true,
      landlords: enrichedLandlords
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminPayments = async (req, res, next) => {
  try {
    const landlords = await User.find({ role: "landlord" })
      .populate("subscription")
      .sort({ createdAt: -1 });

    const records = await Promise.all(
      landlords.map(async (landlord) => {
        const latestPayment = await Payment.findOne({
          user: landlord._id
        }).sort({ createdAt: -1 });

        const totalPaidAgg = await Payment.aggregate([
          {
            $match: {
              user: landlord._id,
              status: "success"
            }
          },
          {
            $group: {
              _id: "$user",
              total: { $sum: "$amount" }
            }
          }
        ]);

        const totalPaid = totalPaidAgg[0]?.total || 0;

        const activeListings = await Listing.countDocuments({
          landlord: landlord._id,
          isActive: true,
          availability: "available"
        });

        const totalListings = await Listing.countDocuments({
          landlord: landlord._id
        });

        const subscription = landlord.subscription;
        const planConfig = subscription ? plans[subscription.plan] : null;

        return {
          _id: landlord._id,
          landlord: {
            _id: landlord._id,
            name: landlord.name,
            email: landlord.email,
            phone: landlord.phone
          },
          subscription: subscription
            ? {
                plan: subscription.plan,
                status: subscription.status,
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                gracePeriodEnd: subscription.gracePeriodEnd,
                listingLimit: planConfig?.listingLimit || 0
              }
            : null,
          activeListings,
          totalListings,
          totalPaid,
          latestPayment: latestPayment
            ? {
                reference: latestPayment.reference,
                amount: latestPayment.amount,
                currency: latestPayment.currency,
                plan: latestPayment.plan,
                status: latestPayment.status,
                paidAt: latestPayment.paidAt,
                createdAt: latestPayment.createdAt
              }
            : null
        };
      })
    );

    const totalRevenueAgg = await Payment.aggregate([
      {
        $match: {
          status: "success"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);

    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    res.json({
      success: true,
      totalRevenue,
      records
    });
  } catch (error) {
    next(error);
  }
};

exports.getListingHistory = async (req, res, next) => {
  try {
    const { status } = req.query;

    const filter = {
      status: { $in: ["approved", "rejected"] },
      isDeleted: { $ne: true }
    };

    if (status && ["approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const listings = await Listing.find(filter)
      .populate("landlord", "name email phone")
      .sort({ updatedAt: -1, createdAt: -1 });

    const formattedListings = listings.map((listing) => ({
      _id: listing._id,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      location: listing.location,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      type: listing.type,
      images: listing.images,
      contactPhone: listing.contactPhone,
      status: listing.status,
      availability: listing.availability,
      isActive: listing.isActive,
      unlistReason: listing.unlistReason,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      landlord: listing.landlord
        ? {
            _id: listing.landlord._id,
            name: listing.landlord.name,
            email: listing.landlord.email,
            phone: listing.landlord.phone
          }
        : null
    }));

    res.json({
      success: true,
      listings: formattedListings
    });
  } catch (error) {
    next(error);
  }
};


exports.getAdminInquiries = async (req, res, next) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status && ["new", "contacted", "closed"].includes(status)) {
      filter.status = status;
    }

    const inquiries = await Inquiry.find(filter)
      .populate("listing", "title location price")
      .populate("landlord", "name email phone")
      .sort({ createdAt: -1 });

    const formattedInquiries = inquiries.map((inquiry) => ({
      _id: inquiry._id,
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      message: inquiry.message,
      status: inquiry.status,
      createdAt: inquiry.createdAt,
      listing: inquiry.listing
        ? {
            _id: inquiry.listing._id,
            title: inquiry.listing.title,
            location: inquiry.listing.location,
            price: inquiry.listing.price
          }
        : null,
      landlord: inquiry.landlord
        ? {
            _id: inquiry.landlord._id,
            name: inquiry.landlord.name,
            email: inquiry.landlord.email,
            phone: inquiry.landlord.phone
          }
        : null
    }));

    res.json({
      success: true,
      inquiries: formattedInquiries
    });
  } catch (error) {
    next(error);
  }
};




exports.getServiceApplications = async (req, res, next) => {
  try {
    const { status, paymentStatus } = req.query;

    const filter = {};

    if (
      status &&
      ["pending_review", "approved", "rejected"].includes(status)
    ) {
      filter.status = status;
    }

    if (
      paymentStatus &&
      ["pending", "success", "failed"].includes(paymentStatus)
    ) {
      filter.paymentStatus = paymentStatus;
    }

    const applications = await PartnerApplication.find(filter).sort({
      createdAt: -1
    });

    res.json({
      success: true,
      applications
    });
  } catch (error) {
    next(error);
  }
};

exports.getServiceApplicationById = async (req, res, next) => {
  try {
    const application = await PartnerApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({
      success: true,
      application
    });
  } catch (error) {
    next(error);
  }
};

exports.approveServiceApplication = async (req, res, next) => {
  try {
    const application = await PartnerApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.paymentStatus !== "success") {
      return res.status(400).json({
        message: "Cannot approve application before payment is confirmed"
      });
    }

    const existingPartner = await ServicePartner.findOne({
      application: application._id
    });

    let partner = existingPartner;

    if (!existingPartner) {
      partner = await ServicePartner.create({
        companyName: application.companyName,
        contactPerson: application.contactPerson,
        email: application.email,
        phone: application.phone,
        category: application.category,
        description: application.description,
        location: application.location,
        website: application.website,
        logo: application.logo,
        application: application._id,
        isActive: true
      });
    } else {
      existingPartner.isActive = true;
      await existingPartner.save();
    }

    application.status = "approved";
    await application.save();
    await recordAdminActivity({
      eventType: "service_application_approved",
      description: "Service provider approved",
      details: `${application.companyName} • ${application.category}`,
      path: `/admin/services/applications/${application._id}`,
      actor: req.user._id,
      actorName: req.user.name,
      readBy: [req.user._id],
      entityType: "service_application",
      entityId: String(application._id),
      dedupeKey: `service_application_approved:${application._id}:${application.updatedAt.getTime()}`
    });

    await sendEmail({
        to: application.email,
        subject: "Your RendaHomes Partner Application Has Been Approved",
        html: partnerApprovedEmail({
          contactPerson: application.contactPerson,
          companyName: application.companyName,
          category: application.category
        })
      });

    res.json({
      success: true,
      message: "Application approved successfully",
      application,
      partner
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectServiceApplication = async (req, res, next) => {
  try {
    const application = await PartnerApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.status = "rejected";
    await application.save();
    await recordAdminActivity({
      eventType: "service_application_rejected",
      description: "Service provider application rejected",
      details: `${application.companyName} • ${application.category}`,
      path: `/admin/services/applications/${application._id}`,
      actor: req.user._id,
      actorName: req.user.name,
      readBy: [req.user._id],
      entityType: "service_application",
      entityId: String(application._id),
      dedupeKey: `service_application_rejected:${application._id}:${application.updatedAt.getTime()}`
    });

    const existingPartner = await ServicePartner.findOne({
      application: application._id
    });

    if (existingPartner) {
      existingPartner.isActive = false;
      await existingPartner.save();
    }

    await sendEmail({
      to: application.email,
      subject: "Update on Your RendaHomes Partner Application",
      html: partnerRejectedEmail({
        contactPerson: application.contactPerson,
        companyName: application.companyName
      })
    });

    res.json({
      success: true,
      message: "Application rejected successfully",
      application
    });
  } catch (error) {
    next(error);
  }
};


exports.getAllListings = async (req, res, next) => {
  try {
    await purgeExpiredDeletedListings();

    const { status, availability, purpose, trash } = req.query;

    const isTrashView = trash === true || trash === "true";
    const filter = isTrashView ? { isDeleted: true } : { isDeleted: { $ne: true } };

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    if (availability && ["available", "taken"].includes(availability)) {
      filter.availability = availability;
    }

    if (purpose && ["rent", "sale"].includes(purpose)) {
      filter.purpose = purpose;
    }

    const listings = await Listing.find(filter)
      .populate("landlord", "name email phone")
      .populate("deletedByAdmin", "name email")
      .populate("reviewedByAdmin", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      listings
    });
  } catch (error) {
    next(error);
  }
};

exports.updateListingTrust = async (req, res, next) => {
  try {
    const {
      verificationStatus,
      listingSource,
      adminNote,
      availability,
      isActive,
      markAvailabilityChecked
    } = req.body;

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (verificationStatus) {
      if (!["unverified", "reviewed", "verified", "flagged"].includes(verificationStatus)) {
        return res.status(400).json({ message: "Invalid verification status" });
      }
      listing.verificationStatus = verificationStatus;
    }

    if (listingSource) {
      if (!["landlord", "agent", "admin_assisted", "app", "unknown"].includes(listingSource)) {
        return res.status(400).json({ message: "Invalid listing source" });
      }
      listing.listingSource = listingSource;
    }

    if (adminNote !== undefined) {
      listing.adminNote = adminNote;
    }

    if (availability !== undefined) {
      if (!["available", "taken"].includes(availability)) {
        return res.status(400).json({ message: "Invalid availability" });
      }
      listing.availability = availability;
      listing.unlistReason = availability === "taken" ? "taken" : null;
    }

    if (isActive !== undefined) {
      listing.isActive = Boolean(isActive);
      if (!listing.isActive) {
        listing.unlistReason = listing.unlistReason || "admin_action";
      } else if (listing.availability === "available") {
        listing.unlistReason = null;
      }
    }

    if (markAvailabilityChecked) {
      listing.availabilityCheckedAt = new Date();
    }

    listing.reviewedByAdmin = req.user._id;
    listing.reviewedAt = new Date();

    await listing.save();
    await listing.populate("landlord", "name email phone");
    await listing.populate("reviewedByAdmin", "name email");

    res.json({
      success: true,
      message: "Listing trust details updated",
      listing
    });
  } catch (error) {
    next(error);
  }
};

exports.moveListingToTrash = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const deletedAt = new Date();
    const deleteExpiresAt = new Date(deletedAt.getTime() + LISTING_TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    listing.isDeleted = true;
    listing.deletedAt = deletedAt;
    listing.deleteExpiresAt = deleteExpiresAt;
    listing.deletedByAdmin = req.user._id;
    listing.deletionReason = req.body?.reason || "Removed by admin";
    listing.isActive = false;
    listing.unlistReason = "admin_action";

    await listing.save();
    await recordAdminActivity({
      eventType: "listing_removed_from_public",
      description: "Listing removed from public site",
      details: `${listing.title} • ${listing.deletionReason}`,
      path: "/admin/listings?view=trash",
      actor: req.user._id,
      actorName: req.user.name,
      readBy: [req.user._id],
      entityType: "listing",
      entityId: String(listing._id),
      dedupeKey: `listing_removed_from_public:${listing._id}:${deletedAt.getTime()}`
    });

    res.json({
      success: true,
      message: "Listing moved to trash and removed from public listings",
      listing
    });
  } catch (error) {
    next(error);
  }
};

exports.restoreListingFromTrash = async (req, res, next) => {
  try {
    const listing = await Listing.findOne({
      _id: req.params.id,
      isDeleted: true
    });

    if (!listing) {
      return res.status(404).json({ message: "Trash listing not found" });
    }

    listing.isDeleted = false;
    listing.deletedAt = null;
    listing.deleteExpiresAt = null;
    listing.deletedByAdmin = null;
    listing.deletionReason = "";
    listing.isActive = listing.status === "approved";
    listing.unlistReason = null;

    await listing.save();
    await recordAdminActivity({
      eventType: "listing_restored",
      description: "Listing restored from trash",
      details: listing.title,
      path: "/admin/listings",
      actor: req.user._id,
      actorName: req.user.name,
      readBy: [req.user._id],
      entityType: "listing",
      entityId: String(listing._id),
      dedupeKey: `listing_restored:${listing._id}:${listing.updatedAt.getTime()}`
    });

    res.json({
      success: true,
      message: "Listing restored",
      listing
    });
  } catch (error) {
    next(error);
  }
};

exports.permanentlyDeleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findOneAndDelete({
      _id: req.params.id,
      isDeleted: true
    });

    if (!listing) {
      return res.status(404).json({ message: "Trash listing not found" });
    }

    res.json({
      success: true,
      message: "Listing permanently deleted"
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminSubscriptions = async (req, res, next) => {
  try {
    const { status, plan } = req.query;

    const filter = {};

    if (status && ["free", "pending_payment", "active", "grace", "expired", "cancelled"].includes(status)) {
      filter.status = status;
    }

    if (plan && ["normal", "basic", "premium", "pro"].includes(plan)) {
      filter.plan = plan;
    }

    const subscriptions = await Subscription.find(filter)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    const records = await Promise.all(
      subscriptions.map(async (subscription) => {
        const activeListings = await Listing.countDocuments({
          landlord: subscription.user?._id,
          isActive: true,
          availability: "available"
        });

        return {
          _id: subscription._id,
          user: subscription.user
            ? {
                _id: subscription.user._id,
                name: subscription.user.name,
                email: subscription.user.email,
                phone: subscription.user.phone
              }
            : null,
          plan: subscription.plan,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          gracePeriodEnd: subscription.gracePeriodEnd,
          lastPaymentDate: subscription.lastPaymentDate,
          activeListings
        };
      })
    );

    res.json({
      success: true,
      subscriptions: records
    });
  } catch (error) {
    next(error);
  }
};



exports.getPlatformHealth = async (req, res, next) => {
  try {
    const start = Date.now();
    let databaseStatus = "disconnected";
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      try {
        await mongoose.connection.db.admin().ping();
        databaseStatus = "connected";
      } catch {
        databaseStatus = "unavailable";
      }
    }

    let latestUpdate = null;
    let activeAppSubscribers = null;
    if (databaseStatus === "connected") {
      [latestUpdate, activeAppSubscribers] = await Promise.all([
        AppUpdate.findOne({ isPublished: true })
          .sort({ publishedAt: -1 })
          .select("title publishedAt emailNotifiedAt")
          .lean(),
        AppSubscriber.countDocuments({ isActive: true })
      ]);
    }
    const integration = (configured) => ({ status: configured ? "configured" : "missing_configuration" });

    res.json({
      success: true,
      checkedAt: new Date(),
      api: { status: "responding", responseTimeMs: Date.now() - start },
      database: { status: databaseStatus },
      process: { uptimeSeconds: Math.floor(process.uptime()), environment: process.env.NODE_ENV || "development" },
      integrations: {
        email: integration(Boolean(process.env.RESEND_API_KEY)),
        payments: integration(Boolean(process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_PUBLIC_KEY)),
        cloudinary: integration(Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET))
      },
      appCommunications: {
        activeEmailSubscribers: activeAppSubscribers,
        latestPublishedUpdate: latestUpdate ? {
          title: latestUpdate.title,
          publishedAt: latestUpdate.publishedAt,
          notificationAttemptAt: latestUpdate.emailNotifiedAt
        } : null,
        deliveryTelemetry: "not_recorded"
      }
    });
  } catch (error) {
    next(error);
  }
};


exports.getAdminPayments = async (req, res, next) => {
  try {
    const landlords = await User.find({ role: "landlord" })
      .populate("subscription")
      .sort({ createdAt: -1 });

    const records = await Promise.all(
      landlords.map(async (landlord) => {
        const latestPayment = await Payment.findOne({
          user: landlord._id,
          paymentType: "subscription"
        }).sort({ createdAt: -1 });

        const activeListings = await Listing.countDocuments({
          landlord: landlord._id,
          isActive: true,
          availability: "available"
        });

        const totalListings = await Listing.countDocuments({
          landlord: landlord._id
        });

        const subscription = landlord.subscription;
        const planConfig = subscription ? plans[subscription.plan] : null;

        return {
          _id: landlord._id,
          landlord: {
            name: landlord.name,
            email: landlord.email,
            phone: landlord.phone
          },
          subscription: subscription
            ? {
                plan: subscription.plan,
                status: subscription.status,
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                gracePeriodEnd: subscription.gracePeriodEnd,
                listingLimit: planConfig?.listingLimit || 0
              }
            : null,
          activeListings,
          totalListings,
          latestPayment: latestPayment
            ? {
                reference: latestPayment.reference,
                amount: latestPayment.amount,
                currency: latestPayment.currency,
                plan: latestPayment.plan,
                status: latestPayment.status,
                paidAt: latestPayment.paidAt,
                createdAt: latestPayment.createdAt
              }
            : null
        };
      })
    );

    res.json({
      success: true,
      records
    });
  } catch (error) {
    next(error);
  }
};
