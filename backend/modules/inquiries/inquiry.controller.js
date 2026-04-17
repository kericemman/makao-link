const Inquiry = require("./inquiry.model");
const Listing = require("../listings/listings.model");
const sendEmail = require("../../utils/sendEmail");
const {
  inquiryReceivedEmail,
  inquiryConfirmationEmail
} = require("../../utils/emailTemplates");

exports.createInquiry = async (req, res, next) => {
  try {
    const { listingId, name, email, phone, message } = req.body;

    const listing = await Listing.findOne({
      _id: listingId,
      status: "approved",
      availability: "available",
      isActive: true
    }).populate("landlord");

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const inquiry = await Inquiry.create({
      listing: listing._id,
      landlord: listing.landlord._id,
      name,
      email,
      phone,
      message
    });

    await sendEmail({
      to: listing.landlord.email,
      subject: "New Property Inquiry",
      html: inquiryReceivedEmail({
        landlordName: listing.landlord.name,
        listingTitle: listing.title,
        senderName: name,
        senderEmail: email,
        senderPhone: phone,
        message
      })
    });

    await sendEmail({
      to: email,
      subject: "Your Inquiry Was Sent",
      html: inquiryConfirmationEmail({
        name,
        listingTitle: listing.title
      })
    });

    res.status(201).json({
      success: true,
      message: "Inquiry sent successfully",
      inquiry
    });
  } catch (error) {
    next(error);
  }
};

exports.getLandlordInquiries = async (req, res, next) => {
  try {
    const inquiries = await Inquiry.find({ landlord: req.user._id })
      .populate("listing", "title location price images")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      inquiries
    });
  } catch (error) {
    next(error);
  }
};

exports.updateInquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["new", "contacted", "closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid inquiry status" });
    }

    const inquiry = await Inquiry.findOneAndUpdate(
      { _id: req.params.id, landlord: req.user._id },
      { status },
      { new: true }
    ).populate("listing", "title location price images");

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    res.json({
      success: true,
      message: "Inquiry updated successfully",
      inquiry
    });
  } catch (error) {
    next(error);
  }
};