const Listing = require("../listings/listings.model");
const sendEmail = require("../../utils/sendEmail");
const {
  listingApprovedEmail,
  listingRejectedEmail,
  partnerApprovedEmail,
 
} = require("../../utils/emailTemplates");
const User = require("../users/user.model");
const Subscription = require("../subscriptions/subscription.model");
const Payment = require("../payments/payment.model");
const plans = require("../payments/plan.config");
const Inquiry = require("../inquiries/inquiry.model");
const SupportTicket = require("../support/support.model");
const PartnerApplication = require("../services/partnerApplication.model");
const ServicePartner = require("../services/servicePartner.model");


exports.getPendingListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({ status: "pending" })
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
    await listing.save();

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
    await listing.save();

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
      revenueAgg
    ] = await Promise.all([
      Listing.countDocuments({ status: "pending" }),
      Listing.countDocuments({ status: "approved" }),
      Listing.countDocuments({ status: "rejected" }),
      Listing.countDocuments(),
      User.countDocuments({ role: "landlord" }),
      Inquiry.countDocuments(),
      Subscription.countDocuments({ status: "active" }),
      Subscription.countDocuments({ status: "pending_payment" }),
      SupportTicket.countDocuments(),
      SupportTicket.countDocuments({ status: { $in: ["open", "in_progress"] } }),
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
        openSupportTickets
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getRecentActivity = async (req, res, next) => {
  try {
    const [recentListings, recentPayments, recentInquiries, recentSupport] = await Promise.all([
      Listing.find().sort({ createdAt: -1 }).limit(5).populate("landlord", "name"),
      Payment.find({ status: "success" }).sort({ createdAt: -1 }).limit(5),
      Inquiry.find().sort({ createdAt: -1 }).limit(5),
      SupportTicket.find().sort({ updatedAt: -1 }).limit(5).populate("landlord", "name")
    ]);

    const activities = [
      ...recentListings.map((item) => ({
        type: "listing_submission",
        description: "New listing submitted",
        details: `${item.title} by ${item.landlord?.name || "Unknown landlord"}`,
        createdAt: item.createdAt
      })),
      ...recentPayments.map((item) => ({
        type: "payment_received",
        description: "Payment received",
        details: `KES ${item.amount.toLocaleString()} • ${item.reference}`,
        createdAt: item.createdAt
      })),
      ...recentInquiries.map((item) => ({
        type: "inquiry_sent",
        description: "New inquiry received",
        details: `${item.name} sent an inquiry`,
        createdAt: item.createdAt
      })),
      ...recentSupport.map((item) => ({
        type: "support_ticket",
        description: "Support ticket updated",
        details: `${item.subject} • ${item.landlord?.name || "Unknown landlord"}`,
        createdAt: item.updatedAt
      }))
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    res.json({
      success: true,
      activities
    });
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
      status: { $in: ["approved", "rejected"] }
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

    const existingPartner = await ServicePartner.findOne({
      application: application._id
    });

    if (existingPartner) {
      existingPartner.isActive = false;
      await existingPartner.save();
    }

    await sendEmail({
      to: application.email,
      subject: "Update on Your Renda Partner Application",
      html: `
        <h2>Application Update</h2>
        <p>Hello ${application.contactPerson},</p>
        <p>Your partner application for <strong>${application.companyName}</strong> was not approved at this time.</p>
        <p>If needed, our team may contact you with more details.</p>
      `
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
    const { status, availability, purpose } = req.query;

    const filter = {};

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
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      listings
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

    await Promise.resolve(); // replace with a quick DB ping if needed

    const responseTime = Date.now() - start;

    res.json({
      apiStatus: "operational",
      databaseStatus: "connected",
      responseTime,
      storageUsed: 45, // replace with actual storage logic later
      uptime: 99.9
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