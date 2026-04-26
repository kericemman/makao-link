

const Listing = require("./listings.model");
const {
  COUNTY_TOWNS,
  COUNTIES,
  RESIDENTIAL_TYPES,
  LISTING_TYPES,
  LISTING_PURPOSES,
  OFFICE_SIZE_UNITS
} = require("./listing.constants");
const sendEmail = require("../../utils/sendEmail");
const {
  listingSubmittedEmail
} = require("../../utils/emailTemplates");
const buildListingFilter = require("./listing.filters");
const { canCreateListing } = require("../subscriptions/subscription.service");
const uploadToCloudinary = require("../../utils/uploadToCloudinary");

const Subscription = require("../subscriptions/subscription.model");
// public - metadata for frontend filters/forms
exports.getListingMeta = async (req, res, next) => {
  try {
    res.json({
      success: true,
      meta: {
        counties: COUNTIES,
        countyTowns: COUNTY_TOWNS,
        residentialTypes: RESIDENTIAL_TYPES,
        listingTypes: LISTING_TYPES,
        listingPurposes: LISTING_PURPOSES,
        officeSizeUnits: OFFICE_SIZE_UNITS
      }
    });
  } catch (error) {
    next(error);
  }
};

// public - get approved/active listings
exports.getPublicListings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      sort = "latest"
    } = req.query;

    const filter = buildListingFilter(req.query);

    let sortOption = { createdAt: -1 };

    if (sort === "price-low") {
      sortOption = { price: 1 };
    }

    if (sort === "price-high") {
      sortOption = { price: -1 };
    }

    if (sort === "popular") {
      sortOption = { views: -1 };
    }

    const currentPage = Math.max(Number(page) || 1, 1);
    const perPage = Math.max(Number(limit) || 12, 1);
    const skip = (currentPage - 1) * perPage;

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .populate("landlord", "name businessName")
        .sort(sortOption)
        .skip(skip)
        .limit(perPage),
      Listing.countDocuments(filter)
    ]);

    res.json({
      success: true,
      listings,
      pagination: {
        total,
        page: currentPage,
        limit: perPage,
        pages: Math.ceil(total / perPage)
      },
      appliedFilters: req.query
    });
  } catch (error) {
    next(error);
  }
};

//Recent listings

exports.getRecentListings = async (req, res, next) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(",") : [];

    if (!ids.length) {
      return res.json({
        success: true,
        listings: []
      });
    }

    const listings = await Listing.find({
      _id: { $in: ids },
      status: "approved",
      isActive: true,
      availability: "available"
    });

    const orderedListings = ids
      .map((id) => listings.find((listing) => String(listing._id) === id))
      .filter(Boolean);

    res.json({
      success: true,
      listings: orderedListings
    });
  } catch (error) {
    next(error);
  }
};

// public - get single approved listing
exports.getListingById = async (req, res, next) => {
  try {
    const listing = await Listing.findOne({
      _id: req.params.id,
      status: "approved",
      isActive: true
    }).populate("landlord", "name email phone businessName");

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found"
      });
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

// landlord - get one own listing
exports.getMyListingById = async (req, res, next) => {
  try {
    const listing = await Listing.findOne({
      _id: req.params.id,
      landlord: req.user._id
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found"
      });
    }

    res.json({
      success: true,
      listing
    });
  } catch (error) {
    next(error);
  }
};

// landlord - create listing
exports.createListing = async (req, res, next) => {
  try {
    let parsedAmenities = {};
    if (req.body.amenities) {
      try {
        parsedAmenities = JSON.parse(req.body.amenities);
      } catch (error) {
        return res.status(400).json({ message: "Invalid amenities format" });
      }
    }

    const imageUrls = req.files?.map((file) => file.path).filter(Boolean) || [];

    const listing = await Listing.create({
      title: req.body.title,
      description: req.body.description,
      purpose: req.body.purpose,
      price: Number(req.body.price),
      county: req.body.county,
      town: req.body.town,
      area: req.body.area || "",
      type: req.body.type,
      bedrooms:
        req.body.bedrooms !== undefined && req.body.bedrooms !== ""
          ? Number(req.body.bedrooms)
          : null,
      bathrooms:
        req.body.bathrooms !== undefined && req.body.bathrooms !== ""
          ? Number(req.body.bathrooms)
          : null,
      kitchen:
        req.body.kitchen === "true" || req.body.kitchen === true || req.body.kitchen === "on",
      size:
        req.body.size !== undefined && req.body.size !== ""
          ? Number(req.body.size)
          : null,
      sizeUnit: req.body.sizeUnit || null,
      video: req.body.video || null,
      amenities: parsedAmenities,
      images: imageUrls,
      contactPhone: req.body.contactPhone,
      landlord: req.user._id,
      status: "pending",
      availability: "available",
      isActive: true,
      unlistReason: null
    });

    if (req.user?.email) {
      await sendEmail({
        to: req.user.email,
        subject: "Listing Submitted for Review",
        html: listingSubmittedEmail({
          name: req.user.name,
          listingTitle: listing.title
        })
      });
    }

    res.status(201).json({
      success: true,
      message: "Listing created and submitted for approval",
      listing
    });
  } catch (error) {
    next(error);
  }
};

// landlord - get own listings
exports.getMyListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({
      landlord: req.user._id
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      listings
    });
  } catch (error) {
    next(error);
  }
};

// landlord - update own listing
exports.updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findOne({
      _id: req.params.id,
      landlord: req.user._id
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found"
      });
    }

    let parsedAmenities = listing.amenities;
    if (req.body.amenities) {
      try {
        parsedAmenities = JSON.parse(req.body.amenities);
      } catch (error) {
        return res.status(400).json({ message: "Invalid amenities format" });
      }
    }

    const imageUrls = req.files?.map((file) => file.path).filter(Boolean) || [];

    listing.title = req.body.title ?? listing.title;
    listing.description = req.body.description ?? listing.description;
    listing.purpose = req.body.purpose ?? listing.purpose;
    listing.price =
      req.body.price !== undefined && req.body.price !== ""
        ? Number(req.body.price)
        : listing.price;
    listing.county = req.body.county ?? listing.county;
    listing.town = req.body.town ?? listing.town;
    listing.area = req.body.area ?? listing.area;
    listing.type = req.body.type ?? listing.type;
    listing.bedrooms =
      req.body.bedrooms !== undefined && req.body.bedrooms !== ""
        ? Number(req.body.bedrooms)
        : null;
    listing.bathrooms =
      req.body.bathrooms !== undefined && req.body.bathrooms !== ""
        ? Number(req.body.bathrooms)
        : null;
    listing.kitchen =
      req.body.kitchen !== undefined
        ? req.body.kitchen === "true" || req.body.kitchen === true || req.body.kitchen === "on"
        : listing.kitchen;
    listing.size =
      req.body.size !== undefined && req.body.size !== ""
        ? Number(req.body.size)
        : null;
    listing.sizeUnit = req.body.sizeUnit ?? listing.sizeUnit;
    listing.video = req.body.video ?? listing.video;
    listing.amenities = parsedAmenities;
    listing.contactPhone = req.body.contactPhone ?? listing.contactPhone;

    if (imageUrls.length > 0) {
      listing.images = imageUrls;
    }

    // Optional: re-review if landlord edits already approved listing
    if (listing.status === "approved") {
      listing.status = "pending";
      listing.isActive = true;
      listing.unlistReason = null;
    }

    await listing.save();

    res.json({
      success: true,
      message: "Listing updated successfully",
      listing
    });
  } catch (error) {
    next(error);
  }
};

// landlord - soft delete
exports.deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findOneAndDelete({
      _id: req.params.id,
      landlord: req.user._id
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found"
      });
    }

    res.json({
      success: true,
      message: "Listing deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// landlord - mark taken / available
exports.updateListingAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;

    if (!["available", "taken"].includes(availability)) {
      return res.status(400).json({
        message: "Invalid availability value"
      });
    }

    const listing = await Listing.findOne({
      _id: req.params.id,
      landlord: req.user._id
    });

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found"
      });
    }

    listing.availability = availability;
    listing.unlistReason = availability === "taken" ? "taken" : null;

    await listing.save();

    res.json({
      success: true,
      message: "Listing availability updated",
      listing
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



exports.getFeaturedListings = async (req, res) => {
  try {
    const planWeight = {
      pro: 2,
      premium: 1
    };
    const activeSubscriptions = await Subscription.find({
      status: "active",
      plan: { $in: ["premium", "pro"] }
    }).select("landlord");

    const landlordIds = activeSubscriptions.map((sub) => sub.landlord);

    const listings = await Listing.find({
      landlord: { $in: activeSubscriptions.map((sub) => sub.landlord) },
      status: "approved",
      availability: "available",
      isActive: true
    }).lean();

    const sortedListings = listings.sort((a, b) => {
      const aPlan = landlordPlanMap.get(String(a.landlord)) || "premium";
      const bPlan = landlordPlanMap.get(String(b.landlord)) || "premium";

      return planWeight[bPlan] - planWeight[aPlan];
    });

    return res.status(200).json({ listings });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch featured listings"
    });
  }
};

