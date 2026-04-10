const Listing = require("./listings.model");
const sendEmail = require("../../utils/sendEmail");
const { canCreateListing } = require("../subscriptions/subscription.service");
const uploadToCloudinary = require("../../utils/uploadToCloudinary");

exports.getPublicListings = async (req, res, next) => {
  try {
    const {
      location,
      minPrice,
      maxPrice,
      bedrooms,
      type,
      page = 1,
      limit = 12
    } = req.query;

    const filter = {
      status: "approved",
      availability: "available",
      isActive: true
    };

    if (location) filter.location = location;
    if (bedrooms) filter.bedrooms = Number(bedrooms);
    if (type) filter.type = type;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const currentPage = Number(page);
    const perPage = Number(limit);
    const skip = (currentPage - 1) * perPage;

    const [listings, total] = await Promise.all([
      Listing.find(filter).sort({ createdAt: -1 }).skip(skip).limit(perPage),
      Listing.countDocuments(filter)
    ]);

    res.json({
      success: true,
      listings,
      page: currentPage,
      limit: perPage,
      total,
      totalPages: Math.ceil(total / perPage)
    });
  } catch (error) {
    next(error);
  }
};

exports.getListingById = async (req, res, next) => {
  try {
    const listing = await Listing.findOne({
      _id: req.params.id,
      status: "approved",
      availability: "available",
      isActive: true
    }).populate("landlord", "name email phone");

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    listing.views += 1;
    await listing.save();

    res.json({
      success: true,
      listing
    });
  } catch (error) {
    next(error);
  }
};

exports.createListing = async (req, res, next) => {
  try {
    const permission = await canCreateListing(req.user);

    if (!permission.allowed) {
      return res.status(403).json({ message: permission.message });
    }

    let parsedAmenities = {};
    if (req.body.amenities) {
      try {
        parsedAmenities = JSON.parse(req.body.amenities);
      } catch (error) {
        return res.status(400).json({ message: "Invalid amenities format" });
      }
    }

    let imageUrls = [];

    if (req.files && req.files.length > 0) {
      const uploadedImages = await Promise.all(
        req.files.map((file) =>
          uploadToCloudinary(file.buffer, "makao/listings")
        )
      );

      imageUrls = uploadedImages.map((img) => img.secure_url);
    }

    const listing = await Listing.create({
      ...req.body,
      amenities: parsedAmenities,
      images: imageUrls,
      landlord: req.user._id,
      status: "pending",
      availability: "available",
      isActive: true,
      unlistReason: null
    });

    await sendEmail({
      to: req.user.email,
      subject: "Listing Submitted for Review",
      html: `
        <h2>Listing Submitted</h2>
        <p>Hello ${req.user.name}, your property <strong>${listing.title}</strong> has been submitted for review.</p>
        <p>You will be notified once it is approved.</p>
      `
    });

    res.status(201).json({
      success: true,
      message: "Listing created and submitted for approval",
      listing
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({ landlord: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      listings
    });
  } catch (error) {
    next(error);
  }
};

exports.updateListing = async (req, res, next) => {
  try {
    let parsedAmenities = req.body.amenities;

    if (req.body.amenities && typeof req.body.amenities === "string") {
      try {
        parsedAmenities = JSON.parse(req.body.amenities);
      } catch (error) {
        return res.status(400).json({ message: "Invalid amenities format" });
      }
    }

    let updateData = {
      ...req.body
    };

    if (parsedAmenities) {
      updateData.amenities = parsedAmenities;
    }

    if (req.files && req.files.length > 0) {
      const uploadedImages = await Promise.all(
        req.files.map((file) =>
          uploadToCloudinary(file.buffer, "makao/listings")
        )
      );

      updateData.images = uploadedImages.map((img) => img.secure_url);
    }

    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, landlord: req.user._id },
      updateData,
      { new: true }
    );

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.json({
      success: true,
      listing
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, landlord: req.user._id },
      {
        isActive: false,
        unlistReason: "admin_action"
      },
      { new: true }
    );

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.json({
      success: true,
      message: "Listing removed"
    });
  } catch (error) {
    next(error);
  }
};

exports.markListingTaken = async (req, res, next) => {
  try {
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, landlord: req.user._id },
      {
        availability: "taken",
        unlistReason: "taken"
      },
      { new: true }
    );

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.json({
      success: true,
      message: "Listing marked as taken",
      listing
    });
  } catch (error) {
    next(error);
  }
};

exports.markListingAvailable = async (req, res, next) => {
  try {
    const permission = await canCreateListing(req.user);

    if (!permission.allowed) {
      return res.status(403).json({ message: permission.message });
    }

    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, landlord: req.user._id },
      {
        availability: "available",
        isActive: true,
        unlistReason: null
      },
      { new: true }
    );

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.json({
      success: true,
      message: "Listing marked as available",
      listing
    });
  } catch (error) {
    next(error);
  }
};