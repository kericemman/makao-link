const AppAlert = require("./alert.model");
const Listing = require("../listings/listings.model");

const alertPopulate = [
  {
    path: "listing",
    select:
      "title description price purpose type county town area bedrooms bathrooms size sizeUnit images amenities availability status isActive landlord contactPhone"
  },
  {
    path: "landlord",
    select: "name email phone role avatar businessName bio location"
  },
  {
    path: "user",
    select: "name email phone role avatar businessName bio location"
  },
  {
    path: "replies.sender",
    select: "name email phone role avatar businessName"
  }
];

const populateAlert = (query) => query.populate(alertPopulate);

exports.createListingInquiry = async (req, res, next) => {
  try {
    const { listingId, landlordId, message } = req.body;

    if (!listingId || !message) {
      return res.status(400).json({
        message: "Listing and message are required"
      });
    }

    const listing = await Listing.findOne({
      _id: listingId,
      status: "approved",
      availability: "available",
      isActive: true
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const targetLandlord = landlordId || listing.landlord;

    if (String(targetLandlord) !== String(listing.landlord)) {
      return res.status(400).json({
        message: "Landlord does not match this listing"
      });
    }

    const inquiry = await AppAlert.create({
      listing: listing._id,
      landlord: listing.landlord,
      user: req.user._id,
      message,
      readByUser: true,
      readByLandlord: false
    });

    const populatedInquiry = await populateAlert(AppAlert.findById(inquiry._id));

    res.status(201).json({
      success: true,
      inquiry: populatedInquiry
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyAlerts = async (req, res, next) => {
  try {
    const inquiries = await populateAlert(
      AppAlert.find({ user: req.user._id }).sort({ updatedAt: -1 })
    );

    res.json({
      success: true,
      inquiries
    });
  } catch (error) {
    next(error);
  }
};

exports.getLandlordAlerts = async (req, res, next) => {
  try {
    const inquiries = await populateAlert(
      AppAlert.find({ landlord: req.user._id }).sort({ updatedAt: -1 })
    );

    res.json({
      success: true,
      inquiries
    });
  } catch (error) {
    next(error);
  }
};

exports.replyToAlert = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Reply message is required" });
    }

    const inquiry = await AppAlert.findById(req.params.inquiryId);

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    const isUser = String(inquiry.user) === String(req.user._id);
    const isLandlord = String(inquiry.landlord) === String(req.user._id);

    if (!isUser && !isLandlord) {
      return res.status(403).json({ message: "Access denied" });
    }

    inquiry.replies.push({
      sender: req.user._id,
      senderRole: req.user.role,
      message
    });

    inquiry.readByUser = isUser;
    inquiry.readByLandlord = isLandlord;

    await inquiry.save();

    const populatedInquiry = await populateAlert(AppAlert.findById(inquiry._id));

    res.json({
      success: true,
      inquiry: populatedInquiry
    });
  } catch (error) {
    next(error);
  }
};

exports.markAlertRead = async (req, res, next) => {
  try {
    const inquiry = await AppAlert.findById(req.params.inquiryId);

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    const isUser = String(inquiry.user) === String(req.user._id);
    const isLandlord = String(inquiry.landlord) === String(req.user._id);

    if (!isUser && !isLandlord) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (isUser) inquiry.readByUser = true;
    if (isLandlord) inquiry.readByLandlord = true;

    await inquiry.save();

    const populatedInquiry = await populateAlert(AppAlert.findById(inquiry._id));

    res.json({
      success: true,
      inquiry: populatedInquiry
    });
  } catch (error) {
    next(error);
  }
};
