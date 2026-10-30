const Listing = require("./listings.model");
const User = require("../users/user.model");
const Kyc = require("../kyc/kyc.model");
const { recordAdminActivity } = require("../admin/adminActivity.service");

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
const { parseRecentListingQuery } = buildListingFilter;

const { canCreateListing } = require("../subscriptions/subscription.service");

const Subscription = require("../subscriptions/subscription.model");
const workspaceOwnerId = (req) => req.landlordOwnerId || req.user._id;
const workspaceListingFilter = (req, extra = {}) => ({
  landlord: workspaceOwnerId(req),
  ...(req.user.role === "landlord_staff" && req.user.teamRole === "agent" ? { assignedAgent: req.user._id } : {}),
  ...extra
});

const parseCsvRows = (csv) => {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (quoted && character === '"' && csv[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && csv[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
};

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
    const { filter, page, limit, sort, appliedFilters } = buildListingFilter(req.query);

    let sortOption = { createdAt: -1 };

    if (sort === "price-low") sortOption = { price: 1 };
    if (sort === "price-high") sortOption = { price: -1 };
    if (sort === "popular") sortOption = { views: -1 };

    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .populate("landlord", "name businessName role")
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Listing.countDocuments(filter)
    ]);

    res.json({
      success: true,
      listings: await attachTrustSignals(listings),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      appliedFilters
    });
  } catch (error) {
    next(error);
  }
};

exports.getNearbyListings = async (req, res, next) => {
  try {
    const { filter, limit } = buildListingFilter(req.query);

    const listings = await Listing.find(filter)
      .populate("landlord", "name businessName phone role")
      .sort({ createdAt: -1 })
      .limit(limit)
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
    const { ids, limit } = parseRecentListingQuery(req.query);

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
      ...workspaceListingFilter(req),
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
    if (req.body.purpose && !LISTING_PURPOSES.includes(req.body.purpose)) {
      return res.status(400).json({ message: "Choose a valid listing purpose." });
    }
    if (req.body.purpose === "short_stay" && (!Number.isInteger(Number(req.body.maxGuests)) || Number(req.body.maxGuests) < 1 || !Number.isInteger(Number(req.body.minNights || 1)) || Number(req.body.minNights || 1) < 1)) {
      return res.status(400).json({ message: "Short-term stays need a valid maximum guest count and minimum nights." });
    }
    const permission = await canCreateListing(req.landlordOwner || req.user);

    if (!permission.allowed) {
      return res.status(403).json({
        success: false,
        code: permission.code || "LISTING_NOT_ALLOWED",
        message: permission.message
      });
    }

    const advancedPlan = ["premium", "pro"].includes(permission.subscription?.plan);
    const totalUnits = Number(req.body.totalUnits || 1);
    const availableUnits = req.body.availableUnits === undefined || req.body.availableUnits === ""
      ? totalUnits
      : Number(req.body.availableUnits);
    const portfolioName = String(req.body.portfolioName || "").trim();
    const portfolioCategory = String(req.body.portfolioCategory || "").trim();
    if (!Number.isInteger(totalUnits) || totalUnits < 1 || totalUnits > 5000 || !Number.isInteger(availableUnits) || availableUnits < 0 || availableUnits > totalUnits) {
      return res.status(400).json({ message: "Unit counts must be whole numbers, with available units no greater than total units." });
    }
    if (!advancedPlan && (totalUnits > 1 || portfolioName || portfolioCategory)) {
      return res.status(403).json({ code: "ADVANCED_PLAN_REQUIRED", message: "Building inventory is available on Premium and Pro plans." });
    }

    let assignedAgent = req.user.role === "landlord_staff" && req.user.teamRole === "agent"
      ? req.user._id
      : req.body.assignedAgent || null;
    if (assignedAgent && !(await User.exists({
      _id: assignedAgent,
      role: "landlord_staff",
      landlordOwner: workspaceOwnerId(req),
      teamStatus: "active"
    }))) {
      return res.status(400).json({ message: "The assigned agent is not an active member of this company." });
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
      maxGuests: req.body.maxGuests ? Number(req.body.maxGuests) : null,
      minNights: req.body.minNights ? Number(req.body.minNights) : 1,
      checkInTime: req.body.checkInTime || "15:00",
      checkOutTime: req.body.checkOutTime || "10:00",
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
      portfolioName: advancedPlan ? portfolioName : "",
      portfolioCategory: advancedPlan ? portfolioCategory : "",
      totalUnits: advancedPlan ? totalUnits : 1,
      availableUnits: advancedPlan ? availableUnits : 1,
      landlord: workspaceOwnerId(req),
      createdBy: req.user._id,
      assignedAgent,
      status: "pending",
      availability: "available",
      isActive: true,
      unlistReason: null
    });

    const notificationUser = req.landlordOwner || req.user;
    await recordAdminActivity({
      eventType: "listing_submission",
      description: "New listing submitted",
      details: `${listing.title} by ${notificationUser?.name || "Landlord"}`,
      path: "/admin/listings/pending",
      actor: req.user._id,
      actorName: notificationUser?.name || "Landlord",
      entityType: "listing",
      entityId: String(listing._id)
    });
    if (notificationUser?.email && listingSubmittedEmail) {
      await sendEmail({
        to: notificationUser.email,
        subject: "Listing Submitted for Review",
        html: listingSubmittedEmail({
          name: notificationUser.name,
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

exports.importListingsCsv = async (req, res, next) => {
  try {
    const permission = await canCreateListing(req.landlordOwner || req.user);
    if (!permission.allowed) {
      return res.status(403).json({ success: false, code: permission.code, message: permission.message });
    }
    if (!["premium", "pro"].includes(permission.subscription?.plan)) {
      return res.status(403).json({ code: "ADVANCED_PLAN_REQUIRED", message: "CSV import is available on active Premium and Pro plans." });
    }
    if (typeof req.body.csv !== "string" || !req.body.csv.trim() || req.body.csv.length > 180000) {
      return res.status(400).json({ message: "Upload a CSV file under 180 KB." });
    }

    let rows;
    try {
      rows = parseCsvRows(req.body.csv);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
    if (rows.length < 2) return res.status(400).json({ message: "The CSV needs a header and at least one property row." });
    if (rows.length > 101) return res.status(400).json({ message: "Import up to 100 property categories per CSV." });

    const headers = rows[0].map((header) => header.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, ""));
    const records = rows.slice(1).map((values, index) => {
      const record = Object.fromEntries(headers.map((header, columnIndex) => [header, values[columnIndex] || ""]));
      return { rowNumber: index + 2, record };
    });
    const errors = [];
    const prepared = [];
    for (const { rowNumber, record } of records) {
      const purpose = record.purpose.toLowerCase();
      const county = COUNTIES.find((value) => value.toLowerCase() === record.county.toLowerCase());
      const type = LISTING_TYPES.find((value) => value.toLowerCase() === record.type.toLowerCase());
      const price = Number(record.price);
      const totalUnits = Number(record.totalunits || 1);
      const availableUnits = Number(record.availableunits === "" ? totalUnits : record.availableunits);
      const bedrooms = record.bedrooms === "" ? null : Number(record.bedrooms);
      const bathrooms = record.bathrooms === "" ? null : Number(record.bathrooms);
      const maxGuests = record.maxguests === "" ? null : Number(record.maxguests);
      const minNights = Number(record.minnights || 1);
      const images = (record.images || "").split("|").map((url) => url.trim()).filter(Boolean);
      const rowErrors = [];
      for (const field of ["title", "description", "town", "contactphone"]) {
        if (!record[field]) rowErrors.push(`${field} is required`);
      }
      if (!LISTING_PURPOSES.includes(purpose)) rowErrors.push("purpose must be rent, sale, or short_stay");
      if (purpose === "short_stay" && (!Number.isInteger(maxGuests) || maxGuests < 1 || !Number.isInteger(minNights) || minNights < 1)) rowErrors.push("short_stay rows need maxGuests and minNights");
      if (!county) rowErrors.push("county is not recognized");
      if (!type) rowErrors.push("type is not recognized");
      if (!Number.isFinite(price) || price < 0) rowErrors.push("price must be a valid positive amount");
      if (bedrooms !== null && (!Number.isInteger(bedrooms) || bedrooms < 0 || bedrooms > 100)) rowErrors.push("bedrooms must be a whole number between 0 and 100");
      if (bathrooms !== null && (!Number.isInteger(bathrooms) || bathrooms < 0 || bathrooms > 100)) rowErrors.push("bathrooms must be a whole number between 0 and 100");
      if (!Number.isInteger(totalUnits) || totalUnits < 1 || totalUnits > 5000) rowErrors.push("totalUnits must be between 1 and 5000");
      if (!Number.isInteger(availableUnits) || availableUnits < 0 || availableUnits > totalUnits) rowErrors.push("availableUnits must be between 0 and totalUnits");
      if (images.some((url) => !/^https:\/\//i.test(url))) rowErrors.push("images must be HTTPS URLs separated with | ");
      if (rowErrors.length) errors.push({ row: rowNumber, errors: rowErrors });
      else prepared.push({ rowNumber, record, purpose, county, type, price, totalUnits, availableUnits, bedrooms, bathrooms, maxGuests, minNights, images });
    }

    if (errors.length) return res.status(400).json({ message: "Fix the CSV rows listed before importing.", errors });
    if (prepared.length > permission.usage.remaining) {
      return res.status(403).json({
        code: "LIMIT_REACHED",
        message: `This import has ${prepared.length} rows, but only ${permission.usage.remaining} listing slots remain.`
      });
    }

    const ownerId = workspaceOwnerId(req);
    const docs = [];
    for (const item of prepared) {
      const assignedEmail = item.record.agentemail.trim().toLowerCase();
      let assignedAgent = req.user.role === "landlord_staff" && req.user.teamRole === "agent" ? req.user._id : null;
      if (assignedEmail && !assignedAgent) {
        const agent = await User.findOne({ email: assignedEmail, landlordOwner: ownerId, role: "landlord_staff", teamStatus: "active" }).select("_id");
        if (!agent) errors.push({ row: item.rowNumber, errors: ["agentEmail does not match an active company agent"] });
        else assignedAgent = agent._id;
      }
      docs.push({
        title: item.record.title,
        description: item.record.description,
        purpose: item.purpose,
        maxGuests: item.maxGuests,
        minNights: item.minNights,
        checkInTime: item.record.checkintime || "15:00",
        checkOutTime: item.record.checkouttime || "10:00",
        price: item.price,
        county: item.county,
        town: item.record.town,
        area: item.record.area,
        type: item.type,
        bedrooms: item.bedrooms,
        bathrooms: item.bathrooms,
        contactPhone: item.record.contactphone,
        images: item.images,
        portfolioName: item.record.building || item.record.portfolioname || "",
        portfolioCategory: item.record.category || item.record.portfoliocategory || "",
        totalUnits: item.totalUnits,
        availableUnits: item.availableUnits,
        landlord: ownerId,
        createdBy: req.user._id,
        assignedAgent,
        status: "pending",
        availability: item.availableUnits > 0 ? "available" : "taken",
        isActive: item.availableUnits > 0,
        unlistReason: item.availableUnits > 0 ? null : "taken"
      });
    }
    if (errors.length) return res.status(400).json({ message: "Fix invalid agent email values before importing.", errors });
    const listings = await Listing.insertMany(docs, { ordered: true });
    res.status(201).json({ success: true, imported: listings.length, listings });
  } catch (error) {
    next(error);
  }
};

// Landlord - get own listings
exports.getMyListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({
      ...workspaceListingFilter(req),
      isDeleted: { $ne: true }
    }).populate("assignedAgent", "name email teamRole").sort({ createdAt: -1 });

    res.json({
      success: true,
      listings
    });
  } catch (error) {
    next(error);
  }
};

exports.groupMyPortfolioListings = async (req, res, next) => {
  try {
    const subscription = req.landlordSubscription || await Subscription.findOne({ user: workspaceOwnerId(req) });
    if (!["premium", "pro"].includes(subscription?.plan) || subscription.status !== "active") {
      return res.status(403).json({
        success: false,
        code: "PRO_PLAN_REQUIRED",
        message: "Active Pro plan required to organize portfolio listings."
      });
    }

    const listingIds = Array.isArray(req.body.listingIds)
      ? [...new Set(req.body.listingIds.map(String))]
      : [];
    const portfolioName = typeof req.body.portfolioName === "string"
      ? req.body.portfolioName.trim()
      : "";
    const portfolioCategory = typeof req.body.portfolioCategory === "string"
      ? req.body.portfolioCategory.trim()
      : "";

    if (!listingIds.length || listingIds.length > 50) {
      return res.status(400).json({ message: "Select between 1 and 50 of your listings." });
    }
    if (listingIds.some((id) => !/^[a-f\d]{24}$/i.test(id))) {
      return res.status(400).json({ message: "One or more selected listing IDs are invalid." });
    }
    if (portfolioName.length > 80 || portfolioCategory.length > 60) {
      return res.status(400).json({ message: "Portfolio and category names are too long." });
    }

    const ownedCount = await Listing.countDocuments({
      _id: { $in: listingIds },
      ...workspaceListingFilter(req),
      isDeleted: { $ne: true }
    });
    if (ownedCount !== listingIds.length) {
      return res.status(404).json({ message: "One or more selected listings were not found." });
    }

    await Listing.updateMany(
      { ...workspaceListingFilter(req), _id: { $in: listingIds } },
      { $set: { portfolioName, portfolioCategory } }
    );

    const listings = await Listing.find({
      ...workspaceListingFilter(req),
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 });

    res.json({ success: true, listings });
  } catch (error) {
    next(error);
  }
};

// Landlord - update own listing
exports.updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findOne({
      _id: req.params.id,
      ...workspaceListingFilter(req),
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

    if (req.body.totalUnits !== undefined || req.body.availableUnits !== undefined || req.body.portfolioName !== undefined || req.body.portfolioCategory !== undefined) {
      const subscription = req.landlordSubscription || await Subscription.findOne({ user: workspaceOwnerId(req) });
      if (!subscription || !["premium", "pro"].includes(subscription.plan) || subscription.status !== "active") {
        return res.status(403).json({ code: "ADVANCED_PLAN_REQUIRED", message: "Building inventory is available on active Premium and Pro plans." });
      }
      const totalUnits = req.body.totalUnits === undefined ? listing.totalUnits : Number(req.body.totalUnits);
      const availableUnits = req.body.availableUnits === undefined ? listing.availableUnits : Number(req.body.availableUnits);
      if (!Number.isInteger(totalUnits) || totalUnits < 1 || totalUnits > 5000 || !Number.isInteger(availableUnits) || availableUnits < 0 || availableUnits > totalUnits) {
        return res.status(400).json({ message: "Unit counts must be whole numbers, with available units no greater than total units." });
      }
      listing.totalUnits = totalUnits;
      listing.availableUnits = availableUnits;
      listing.portfolioName = String(req.body.portfolioName ?? listing.portfolioName).trim().slice(0, 80);
      listing.portfolioCategory = String(req.body.portfolioCategory ?? listing.portfolioCategory).trim().slice(0, 60);
    }

    if (req.body.assignedAgent !== undefined) {
      if (req.user.role === "landlord_staff" && req.user.teamRole !== "manager") {
        return res.status(403).json({ message: "Only the company owner or a manager can reassign properties." });
      }
      const agentId = req.body.assignedAgent || null;
      if (agentId && !(await User.exists({ _id: agentId, role: "landlord_staff", landlordOwner: workspaceOwnerId(req), teamStatus: "active" }))) {
        return res.status(400).json({ message: "The assigned agent is not an active member of this company." });
      }
      listing.assignedAgent = agentId;
    }

    const imageUrls =
      req.files?.map((file) => file.path).filter(Boolean) || [];

    if (req.body.purpose && !LISTING_PURPOSES.includes(req.body.purpose)) {
      return res.status(400).json({ message: "Choose a valid listing purpose." });
    }
    const nextPurpose = req.body.purpose ?? listing.purpose;
    if (nextPurpose === "short_stay") {
      const guests = req.body.maxGuests === undefined ? listing.maxGuests : Number(req.body.maxGuests);
      const nights = req.body.minNights === undefined ? listing.minNights : Number(req.body.minNights || 1);
      if (!Number.isInteger(guests) || guests < 1 || !Number.isInteger(nights) || nights < 1) {
        return res.status(400).json({ message: "Short-term stays need a valid maximum guest count and minimum nights." });
      }
    }

    listing.title = req.body.title ?? listing.title;
    listing.description = req.body.description ?? listing.description;
    listing.purpose = req.body.purpose ?? listing.purpose;
    if (req.body.maxGuests !== undefined) listing.maxGuests = req.body.maxGuests === "" ? null : Number(req.body.maxGuests);
    if (req.body.minNights !== undefined) listing.minNights = Number(req.body.minNights || 1);
    if (req.body.checkInTime !== undefined) listing.checkInTime = req.body.checkInTime;
    if (req.body.checkOutTime !== undefined) listing.checkOutTime = req.body.checkOutTime;

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
      ...workspaceListingFilter(req)
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
      const permission = await canCreateListing(req.landlordOwner || req.user);

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
      ...workspaceListingFilter(req),
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
        ...workspaceListingFilter(req),
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
    const permission = await canCreateListing(req.landlordOwner || req.user);

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
        ...workspaceListingFilter(req),
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
