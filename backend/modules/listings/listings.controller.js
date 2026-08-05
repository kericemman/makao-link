const Listing = require("./listings.model");
const Kyc = require("../kyc/kyc.model");

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

const Subscription = require("../subscriptions/subscription.model");

const attachTrustSignals = async (listings) => {
  const list = Array.isArray(listings) ? listings : [listings].filter(Boolean);
  const landlordIds = [
    ...new Set(
      list
        .map((listing) => listing.landlord?._id || listing.landlord)
        .filter(Boolean)
        .map(String)
    )
  ];

  const approvedKycs = landlordIds.length
    ? await Kyc.find({
        landlord: { $in: landlordIds },
        status: "approved"
      })
        .select("landlord")
        .lean()
    : [];

  const kycVerifiedLandlords = new Set(
    approvedKycs.map((kyc) => String(kyc.landlord))
  );

  return list.map((listing) => {
    const plainListing = typeof listing.toObject === "function" ? listing.toObject() : listing;
    const landlordId = String(plainListing.landlord?._id || plainListing.landlord || "");

    return {
      ...plainListing,
      trust: {
        listingVerified: plainListing.verificationStatus === "verified",
        listingReviewed: plainListing.status === "approved",
        availabilityConfirmed: plainListing.availability === "available" && plainListing.isActive === true,
        directContact: Boolean(plainListing.contactPhone),
        landlordKycVerified: kycVerifiedLandlords.has(landlordId),
        lastCheckedAt: plainListing.availabilityCheckedAt || plainListing.reviewedAt || plainListing.updatedAt || plainListing.createdAt
      }
    };
  });
};

// Public - metadata for frontend filters/forms
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

// Public - get approved/active listings
exports.getPublicListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, sort = "latest" } = req.query;

    const filter = buildListingFilter(req.query);

    let sortOption = { createdAt: -1 };

    if (sort === "price-low") sortOption = { price: 1 };
    if (sort === "price-high") sortOption = { price: -1 };
    if (sort === "popular") sortOption = { views: -1 };

    const currentPage = Math.max(Number(page) || 1, 1);
    const perPage = Math.max(Number(limit) || 12, 1);
    const skip = (currentPage - 1) * perPage;

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .populate("landlord", "name businessName role")
        .sort(sortOption)
        .skip(skip)
        .limit(perPage)
        .lean(),
      Listing.countDocuments(filter)
    ]);

    res.json({
      success: true,
      listings: await attachTrustSignals(listings),
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

exports.getNearbyListings = async (req, res, next) => {
  try {
    const { limit = 12 } = req.query;
    const filter = buildListingFilter(req.query);

    const listings = await Listing.find(filter)
      .populate("landlord", "name businessName phone role")
      .sort({ createdAt: -1 })
      .limit(Math.max(Number(limit) || 12, 1))
      .lean();

    res.json({
      success: true,
      listings: await attachTrustSignals(listings)
    });
  } catch (error) {
    next(error);
  }
};

// Public - recently viewed listings
exports.getRecentListings = async (req, res, next) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(",") : [];
    const limit = Math.max(Number(req.query.limit) || 6, 1);

    if (!ids.length) {
      const listings = await Listing.find({
        status: "approved",
        isActive: true,
        availability: "available",
        isDeleted: { $ne: true }
      })
        .populate("landlord", "name businessName role")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return res.json({
        success: true,
        listings: await attachTrustSignals(listings)
      });
    }

    const listings = await Listing.find({
      _id: { $in: ids },
      status: "approved",
      isActive: true,
      availability: "available",
      isDeleted: { $ne: true }
    }).lean();

    const orderedListings = ids
      .map((id) => listings.find((listing) => String(listing._id) === id))
      .filter(Boolean);

    res.json({
      success: true,
      listings: await attachTrustSignals(orderedListings)
    });
  } catch (error) {
    next(error);
  }
};

// Public - get single approved listing
exports.getListingById = async (req, res, next) => {
  try {
    const listing = await Listing.findOne({
      _id: req.params.id,
      status: "approved",
      isActive: true,
      availability: "available",
      isDeleted: { $ne: true }
    }).populate("landlord", "name email phone businessName role");

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
      listing: (await attachTrustSignals(listing))[0]
    });
  } catch (error) {
    next(error);
  }
};

// Landlord - get one own listing
exports.getMyListingById = async (req, res, next) => {
  try {
    const listing = await Listing.findOne({
      _id: req.params.id,
      landlord: req.user._id,
      isDeleted: { $ne: true }
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

// Landlord - create listing
exports.createListing = async (req, res, next) => {
  try {
    const permission = await canCreateListing(req.user);

    if (!permission.allowed) {
      return res.status(403).json({
        success: false,
        code: permission.code || "LISTING_NOT_ALLOWED",
        message: permission.message
      });
    }

    let parsedAmenities = {};

    if (req.body.amenities) {
      try {
        parsedAmenities = JSON.parse(req.body.amenities);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid amenities format"
        });
      }
    }

    const imageUrls =
      req.files?.map((file) => file.path).filter(Boolean) || [];

    const listing = await Listing.create({
      title: req.body.title,
      description: req.body.description,
      purpose: req.body.purpose,
      price: Number(req.body.price),
      county: req.body.county,
      town: req.body.town,
      area: req.body.area || "",
      latitude:
        req.body.latitude !== undefined && req.body.latitude !== ""
          ? Number(req.body.latitude)
          : null,
      longitude:
        req.body.longitude !== undefined && req.body.longitude !== ""
          ? Number(req.body.longitude)
          : null,
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
        req.body.kitchen === "true" ||
        req.body.kitchen === true ||
        req.body.kitchen === "on",

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

    if (req.user?.email && listingSubmittedEmail) {
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
      listing,
      usage: permission.usage
    });
  } catch (error) {
    next(error);
  }
};

// Landlord - get own listings
exports.getMyListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({
      landlord: req.user._id,
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      listings
    });
  } catch (error) {
    next(error);
  }
};

// Landlord - update own listing
exports.updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findOne({
      _id: req.params.id,
      landlord: req.user._id,
      isDeleted: { $ne: true }
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
        return res.status(400).json({
          success: false,
          message: "Invalid amenities format"
        });
      }
    }

    const imageUrls =
      req.files?.map((file) => file.path).filter(Boolean) || [];

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
    listing.latitude =
      req.body.latitude !== undefined && req.body.latitude !== ""
        ? Number(req.body.latitude)
        : req.body.latitude === ""
          ? null
          : listing.latitude;
    listing.longitude =
      req.body.longitude !== undefined && req.body.longitude !== ""
        ? Number(req.body.longitude)
        : req.body.longitude === ""
          ? null
          : listing.longitude;
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
        ? req.body.kitchen === "true" ||
          req.body.kitchen === true ||
          req.body.kitchen === "on"
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

    if (listing.status === "approved") {
      listing.status = "pending";
      listing.isActive = true;
      listing.availability = "available";
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

// Landlord - delete listing
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

// Landlord - update availability
exports.updateListingAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;

    if (!["available", "taken"].includes(availability)) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability value"
      });
    }

    if (availability === "available") {
      const permission = await canCreateListing(req.user);

      if (!permission.allowed) {
        return res.status(403).json({
          success: false,
          code: permission.code || "LISTING_NOT_ALLOWED",
          message: permission.message
        });
      }
    }

    const listing = await Listing.findOne({
      _id: req.params.id,
      landlord: req.user._id,
      isDeleted: { $ne: true }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found"
      });
    }

    listing.availability = availability;
    listing.isActive = availability === "available";
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
      {
        _id: req.params.id,
        landlord: req.user._id,
        isDeleted: { $ne: true }
      },
      {
        availability: "taken",
        isActive: false,
        unlistReason: "taken"
      },
      { new: true }
    );

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found"
      });
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
      return res.status(403).json({
        success: false,
        code: permission.code || "LISTING_NOT_ALLOWED",
        message: permission.message
      });
    }

    const listing = await Listing.findOneAndUpdate(
      {
        _id: req.params.id,
        landlord: req.user._id,
        isDeleted: { $ne: true }
      },
      {
        availability: "available",
        isActive: true,
        unlistReason: null
      },
      { new: true }
    );

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found"
      });
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

// Public - featured listings from premium/pro landlords
exports.getFeaturedListings = async (req, res, next) => {
  try {
    const planWeight = {
      pro: 2,
      premium: 1
    };

    const activeSubscriptions = await Subscription.find({
      status: "active",
      plan: { $in: ["premium", "pro"] }
    }).select("user plan");

    const landlordIds = activeSubscriptions.map((sub) => sub.user);

    const landlordPlanMap = new Map(
      activeSubscriptions.map((sub) => [String(sub.user), sub.plan])
    );

    const listings = await Listing.find({
      landlord: { $in: landlordIds },
      status: "approved",
      availability: "available",
      isActive: true,
      isDeleted: { $ne: true }
    })
      .populate("landlord", "name businessName role")
      .lean();

    const sortedListings = listings.sort((a, b) => {
      const aPlan = landlordPlanMap.get(String(a.landlord?._id || a.landlord)) || "premium";
      const bPlan = landlordPlanMap.get(String(b.landlord?._id || b.landlord)) || "premium";

      return planWeight[bPlan] - planWeight[aPlan];
    });

    res.status(200).json({
      success: true,
      listings: await attachTrustSignals(sortedListings)
    });
  } catch (error) {
    next(error);
  }
};
