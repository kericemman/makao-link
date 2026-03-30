const Listing = require("../listings/listings.model");
const sendEmail = require("../../utils/sendEmail");
const User = require("../users/user.model");
const Payment = require("../payments/payment.model");
const plans = require("../payments/plan.config");
const Inquiry = require("../inquiries/inquiry.model");

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
      html: `
        <h2>Listing Approved</h2>
        <p>Hello ${listing.landlord.name}, your property <strong>${listing.title}</strong> has been approved and is now live.</p>
      `
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
      html: `
        <h2>Listing Rejected</h2>
        <p>Hello ${listing.landlord.name}, your property <strong>${listing.title}</strong> was not approved.</p>
      `
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
    const [pendingListings, landlords] = await Promise.all([
      Listing.countDocuments({ status: "pending" }),
      User.countDocuments({ role: "landlord" })
    ]);

    res.json({
      success: true,
      summary: {
        pendingListings,
        landlords
      }
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
        const latestPayment = await Payment.findOne({ user: landlord._id })
          .sort({ createdAt: -1 });

        const activeListings = await Listing.countDocuments({
          landlord: landlord._id,
          isActive: true,
          availability: "available"
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