const Property = require("../properties/property.model");
const Inquiry = require("../inquiries/inquiry.model");
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
      landlord: req.user._id,
      status: "active"
    });

    res.json({
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