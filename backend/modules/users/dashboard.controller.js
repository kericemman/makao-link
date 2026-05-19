const Property = require("../listings/listings.model");
const Inquiry = require("../inquiries/inquiry.model");
const AppAlert = require("../alerts/alert.model");
const Subscription = require("../subscriptions/subscription.model");

exports.getDashboardStats = async (req, res) => {

  try {

    const totalProperties = await Property.countDocuments({
      landlord: req.user._id
    });

    const totalInquiries = await Inquiry.countDocuments({
      landlord: req.user._id
    });

    const subscription = await Subscription.findOne({
      user: req.user._id,
      status: "active"
    });
    
    const recentInquiries = await AppAlert.find({
      landlord: req.user._id
    })
      .populate(
        "listing",
        "title price purpose type county town area images availability status isActive contactPhone"
      )
      .populate("user", "name email phone role avatar")
      .sort({ updatedAt: -1 })
      .limit(10);

    res.json({
      stats: {
        totalProperties,
        totalInquiries
      },
      recentInquiries,
      totalProperties,
      totalInquiries,
      subscription
    });

  } catch (error) {

    res.status(500).json({
      message: "Failed to load dashboard stats"
    });

  }

};
