const Inquiry = require("./inquiry.model");
const Listing = require("../listings/listings.model");
const OrganizationMembership = require("../organizations/organizationMembership.model");
const User = require("../users/user.model");
const { ensureLead } = require("../leads/lead.service");
const { withAuthorizationTransaction } = require("../authorization/transaction.service");
const Lead = require("../leads/lead.model");
const { canTransitionLead } = require("../leads/lead.service");
const sendEmail = require("../../utils/sendEmail");
const { syncWebsiteInquiriesToAppAlertsForUser } = require("./inquiryBridge.service");
const { recordAdminActivity } = require("../admin/adminActivity.service");
const workspaceOwnerId = (req) => req.landlordOwnerId || req.user._id;
const inquiryWorkspaceFilter = (req, extra = {}) => ({
  landlord: workspaceOwnerId(req),
  ...(req.user.role === "landlord_staff" && req.user.teamRole === "agent" || req.organizationMembership?.role === "agent" ? { assignedAgent: req.user._id } : {}),
  ...extra
});
const scopedInquiryFilter = async (req, extra = {}) => {
  const filter = inquiryWorkspaceFilter(req, extra);
  if (req.landlordOrganization) {
    const listings = await Listing.find({
      organization: req.landlordOrganization._id,
      ...(req.organizationMembership?.branchIds?.length ? { branch: { $in: req.organizationMembership.branchIds } } : {})
    }).distinct("_id");
    filter.listing = { $in: listings };
  }
  return filter;
};
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

    const matchingUser = await User.findOne({ email: email.toLowerCase() }).select("_id");
    const inquiry = await withAuthorizationTransaction(async (session) => {
      const [createdInquiry] = await Inquiry.create([{
        listing: listing._id,
        landlord: listing.landlord._id,
        name,
        email,
        phone,
        message
      }], { session });
      await ensureLead({ sourceModel: "Inquiry", sourceRecord: createdInquiry._id, listing: listing._id, advertiser: listing.landlord._id, customer: matchingUser?._id || null, sourceChannel: "website", session });
      return createdInquiry;
    });

    await recordAdminActivity({
      eventType: "inquiry_sent",
      description: "New listing inquiry",
      details: `${name} asked about ${listing.title}`,
      path: `/admin/inquiries/${inquiry._id}`,
      actorName: name,
      entityType: "inquiry",
      entityId: String(inquiry._id)
    });

    if (matchingUser) {
      await syncWebsiteInquiriesToAppAlertsForUser(matchingUser);
    }

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
    const inquiries = await Inquiry.find(await scopedInquiryFilter(req))
      .populate("listing", "title location price images purpose portfolioName portfolioCategory")
      .populate("assignedAgent", "name teamRole")
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

    const inquiry = await withAuthorizationTransaction(async (session) => {
      const updated = await Inquiry.findOneAndUpdate(
        await scopedInquiryFilter(req, { _id: req.params.id }),
        { status },
        { new: true, session }
      );
      if (updated) {
        const stage = status === "new" ? "new" : status === "contacted" ? "contacted" : "closed_unsuccessful";
        const lead = await Lead.findOne({ sourceModel: "Inquiry", sourceRecord: updated._id }).session(session);
        if (lead && lead.stage !== stage) {
          if (!canTransitionLead(lead.stage, stage)) { const error = new Error("This inquiry has progressed beyond the requested legacy status."); error.statusCode = 409; throw error; }
          lead.stage = stage;
          await lead.save({ session });
        }
      }
      return updated;
    });

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    await inquiry.populate("listing", "title location price images");

    res.json({
      success: true,
      message: "Inquiry updated successfully",
      inquiry
    });
  } catch (error) {
    next(error);
  }
};
