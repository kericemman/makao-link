const Listing = require("../listings/listings.model");
const ListingReport = require("./listingReport.model");

const validStatuses = ["new", "reviewing", "resolved", "dismissed"];

exports.createListingReport = async (req, res, next) => {
  try {
    const { listingId, reason, message = "", name = "", email = "", phone = "" } = req.body;

    if (!listingId || !reason) {
      return res.status(400).json({
        success: false,
        message: "Listing and report reason are required"
      });
    }

    const listing = await Listing.findOne({
      _id: listingId,
      status: "approved",
      isDeleted: { $ne: true }
    }).select("landlord title");

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found"
      });
    }

    const report = await ListingReport.create({
      listing: listing._id,
      landlord: listing.landlord,
      reason,
      message,
      name,
      email,
      phone
    });

    res.status(201).json({
      success: true,
      message: "Report submitted. RendaHomes will review this listing.",
      report
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminListingReports = async (req, res, next) => {
  try {
    const { status = "", reason = "", page = 1, limit = 30 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (reason) query.reason = reason;

    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const [reports, total] = await Promise.all([
      ListingReport.find(query)
        .populate("listing", "title price purpose type county town area images availability status isActive contactPhone")
        .populate("landlord", "name email phone businessName")
        .populate("reviewedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      ListingReport.countDocuments(query)
    ]);

    res.json({
      success: true,
      reports,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateListingReportStatus = async (req, res, next) => {
  try {
    const { status, adminNote = "" } = req.body;

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report status"
      });
    }

    const report = await ListingReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    report.status = status;
    report.adminNote = adminNote;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();

    await report.save();

    res.json({
      success: true,
      message: "Report updated",
      report
    });
  } catch (error) {
    next(error);
  }
};
