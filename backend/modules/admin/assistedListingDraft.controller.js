const crypto = require("crypto");
const mongoose = require("mongoose");
const Draft = require("./assistedListingDraft.model");
const User = require("../users/user.model");
const Subscription = require("../subscriptions/subscription.model");
const Listing = require("../listings/listings.model");
const plans = require("../payments/plan.config");
const { uploadListingImages, serializeListingImages, deletePrivateImages } = require("../listings/listingMedia.storage");
const { isValidGoogleMapsUrl } = require("../listings/listings.controller");
const { LISTING_PURPOSES, LISTING_TYPES, COUNTIES, COUNTY_TOWNS, RESIDENTIAL_TYPES, OFFICE_SIZE_UNITS } = require("../listings/listing.constants");
const { normalizeKenyanPhone, phoneUniquenessFilter } = require("../../utils/kenyanPhone");
const sendEmail = require("../../utils/sendEmail");
const { assistedLandlordSetupEmail } = require("../../utils/emailTemplates");
const { recordAdminActivity } = require("./adminActivity.service");

const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validNumber = (value, { min = 0, integer = false } = {}) => value !== "" && Number.isFinite(Number(value)) && Number(value) >= min && (!integer || Number.isInteger(Number(value)));

const validateDraft = (body, files) => {
  const issues = [];
  const email = String(body.email || "").trim().toLowerCase();
  let phone = String(body.phone || "").trim();
  try { phone = normalizeKenyanPhone(phone); }
  catch { issues.push("Enter a Kenyan mobile number starting with +254."); }
  if (!String(body.name || "").trim()) issues.push("Landlord name is required.");
  if (!validEmail(email)) issues.push("A valid landlord email is required.");
  if (!phone) issues.push("Landlord phone is required.");
  if (!["normal", "basic", "premium", "pro"].includes(body.package)) issues.push("Choose a valid package.");
  if (!String(body.title || "").trim()) issues.push("Property title is required.");
  if (!String(body.description || "").trim()) issues.push("Property description is required.");
  if (!LISTING_PURPOSES.includes(body.purpose)) issues.push("Choose a valid property purpose.");
  if (!validNumber(body.price)) issues.push("Enter a valid property price.");
  if (!COUNTIES.includes(body.county)) issues.push("Choose a valid county.");
  if (!String(body.town || "").trim()) issues.push("Property town is required.");
  if (!LISTING_TYPES.includes(body.type)) issues.push("Choose a valid property type.");
  try { normalizeKenyanPhone(body.contactPhone); }
  catch { issues.push("Property contact phone must be a Kenyan mobile number starting with +254."); }
  if (!isValidGoogleMapsUrl(String(body.googleMapsUrl || "").trim())) issues.push("Enter a valid HTTPS Google Maps link.");
  if (body.purpose === "short_stay" && (!validNumber(body.maxGuests, { min: 1, integer: true }) || !validNumber(body.minNights || "1", { min: 1, integer: true }))) issues.push("Short stays require valid guest and minimum-night counts.");
  if (RESIDENTIAL_TYPES.includes(body.type) && (!validNumber(body.bedrooms) || !validNumber(body.bathrooms))) issues.push("Bedrooms and bathrooms are required for residential properties.");
  if (body.type === "office" && (!validNumber(body.size, { min: 1 }) || !OFFICE_SIZE_UNITS.includes(body.sizeUnit))) issues.push("Office size and unit are required.");
  const totalUnits = body.totalUnits ? Number(body.totalUnits) : 1;
  const availableUnits = body.availableUnits ? Number(body.availableUnits) : totalUnits;
  const hasBuildingCategory = Boolean(String(body.portfolioName || "").trim() || String(body.portfolioCategory || "").trim() || body.totalUnits);
  if (!Number.isInteger(totalUnits) || totalUnits < 1 || totalUnits > 5000 || !Number.isInteger(availableUnits) || availableUnits < 0 || availableUnits > totalUnits) issues.push("Building unit counts must be whole numbers, with available units no greater than total units.");
  if (hasBuildingCategory && !["premium", "pro"].includes(body.package)) issues.push("Building categories are available on Premium and Pro packages.");
  if (hasBuildingCategory && (!String(body.portfolioName || "").trim() || !String(body.portfolioCategory || "").trim())) issues.push("Building name and unit category are required for building inventory.");
  for (const key of ["latitude", "longitude"]) {
    if (body[key] !== undefined && body[key] !== "") {
      const coordinate = Number(body[key]);
      const validRange = key === "latitude" ? coordinate >= -90 && coordinate <= 90 : coordinate >= -180 && coordinate <= 180;
      if (!Number.isFinite(coordinate) || !validRange) issues.push(`Enter a valid ${key}.`);
    }
  }
  const imageLimit = body.package === "normal" ? 15 : 30;
  if (!files?.length) issues.push("At least one property image is required.");
  if ((files?.length || 0) > imageLimit) issues.push(`This package allows up to ${imageLimit} images.`);
  return { issues, email, phone, imageLimit };
};

const validateAssistedListingEdit = (body, files, { packageName, existingImageCount = 0 } = {}) => {
  const issues = [];
  const imageLimit = packageName === "normal" ? 15 : 30;
  const imagesCount = files?.length || existingImageCount;
  if (!String(body.title || "").trim()) issues.push("Property title is required.");
  if (!String(body.description || "").trim()) issues.push("Property description is required.");
  if (!LISTING_PURPOSES.includes(body.purpose)) issues.push("Choose a valid property purpose.");
  if (!validNumber(body.price)) issues.push("Enter a valid property price.");
  if (!COUNTIES.includes(body.county)) issues.push("Choose a valid county.");
  if (!String(body.town || "").trim() || !(COUNTY_TOWNS[body.county] || []).includes(body.town)) issues.push("Choose a town in the selected county.");
  if (!LISTING_TYPES.includes(body.type)) issues.push("Choose a valid property type.");
  try { normalizeKenyanPhone(body.contactPhone); }
  catch { issues.push("Property contact phone must be a Kenyan mobile number starting with +254."); }
  if (!isValidGoogleMapsUrl(String(body.googleMapsUrl || "").trim())) issues.push("Enter a valid HTTPS Google Maps link.");
  if (body.purpose === "short_stay" && (!validNumber(body.maxGuests, { min: 1, integer: true }) || !validNumber(body.minNights || "1", { min: 1, integer: true }))) issues.push("Short stays require valid guest and minimum-night counts.");
  if (RESIDENTIAL_TYPES.includes(body.type) && (!validNumber(body.bedrooms) || !validNumber(body.bathrooms))) issues.push("Bedrooms and bathrooms are required for residential properties.");
  if (body.type === "office" && (!validNumber(body.size, { min: 1 }) || !OFFICE_SIZE_UNITS.includes(body.sizeUnit))) issues.push("Office size and unit are required.");
  if (!Number.isInteger(imagesCount) || imagesCount < 1) issues.push("Keep at least one property image.");
  if (imagesCount > imageLimit) issues.push(`This package allows up to ${imageLimit} images.`);
  let amenities = {};
  try { amenities = body.amenities ? JSON.parse(body.amenities) : {}; }
  catch { issues.push("Amenities data is invalid."); }
  const allowedAmenities = ["garden", "tarmacAccess", "nearSchools", "nearShoppingCentre", "nearHospital", "waterAvailable", "electricityAvailable"];
  if (!amenities || typeof amenities !== "object" || Array.isArray(amenities) || Object.keys(amenities).some((key) => !allowedAmenities.includes(key)) || Object.values(amenities).some((value) => typeof value !== "boolean")) {
    issues.push("Amenities data contains unsupported fields.");
  }
  for (const key of ["latitude", "longitude"]) {
    if (body[key] !== undefined && body[key] !== "") {
      const coordinate = Number(body[key]);
      const validRange = key === "latitude" ? coordinate >= -90 && coordinate <= 90 : coordinate >= -180 && coordinate <= 180;
      if (!Number.isFinite(coordinate) || !validRange) issues.push(`Enter a valid ${key}.`);
    }
  }
  const hasBuildingCategory = Boolean(String(body.portfolioName || "").trim() || String(body.portfolioCategory || "").trim());
  const totalUnits = body.totalUnits ? Number(body.totalUnits) : 1;
  const availableUnits = body.availableUnits ? Number(body.availableUnits) : totalUnits;
  if (hasBuildingCategory && !["premium", "pro"].includes(packageName)) issues.push("Building categories are available on Premium and Pro packages.");
  if (hasBuildingCategory && (!String(body.portfolioName || "").trim() || !String(body.portfolioCategory || "").trim())) issues.push("Building name and unit category are both required.");
  if (hasBuildingCategory && (!Number.isInteger(totalUnits) || totalUnits < 1 || totalUnits > 5000 || !Number.isInteger(availableUnits) || availableUnits < 0 || availableUnits > totalUnits)) issues.push("Building unit counts must be whole numbers, with available units no greater than total units.");
  return { issues, amenities, imageLimit };
};

exports.createAssistedListingDraft = async (req, res, next) => {
  let stagedKeys = [];
  try {
    const { issues, email, phone } = validateDraft(req.body, req.files);
    if (issues.length) return res.status(400).json({ success: false, message: issues[0], issues });

    let amenities = {};
    try { amenities = req.body.amenities ? JSON.parse(req.body.amenities) : {}; }
    catch { return res.status(400).json({ success: false, message: "Amenities data is invalid." }); }
    if (!amenities || typeof amenities !== "object" || Array.isArray(amenities)) return res.status(400).json({ success: false, message: "Amenities data is invalid." });
    const allowedAmenities = ["garden", "tarmacAccess", "nearSchools", "nearShoppingCentre", "nearHospital", "waterAvailable", "electricityAvailable"];
    if (Object.keys(amenities).some((key) => !allowedAmenities.includes(key)) || Object.values(amenities).some((value) => typeof value !== "boolean")) {
      return res.status(400).json({ success: false, message: "Amenities data contains unsupported fields." });
    }

    const media = await uploadListingImages(req.user._id, req.files || []);
    stagedKeys = media.assets.map((asset) => asset.stagingKey);
    const property = {
      title: String(req.body.title).trim(), description: String(req.body.description).trim(), purpose: req.body.purpose,
      maxGuests: req.body.maxGuests ? Number(req.body.maxGuests) : null, minNights: Number(req.body.minNights || 1),
      checkInTime: req.body.checkInTime || "15:00", checkOutTime: req.body.checkOutTime || "10:00", price: Number(req.body.price),
      county: req.body.county, town: String(req.body.town).trim(), area: String(req.body.area || "").trim(),
      latitude: req.body.latitude === "" ? null : Number(req.body.latitude), longitude: req.body.longitude === "" ? null : Number(req.body.longitude),
      googleMapsUrl: String(req.body.googleMapsUrl || "").trim(), type: req.body.type,
      portfolioName: String(req.body.portfolioName || "").trim(), portfolioCategory: String(req.body.portfolioCategory || "").trim(),
      totalUnits: Number(req.body.totalUnits || 1), availableUnits: Number(req.body.availableUnits || req.body.totalUnits || 1),
      bedrooms: req.body.bedrooms === "" ? null : Number(req.body.bedrooms), bathrooms: req.body.bathrooms === "" ? null : Number(req.body.bathrooms),
      kitchen: req.body.kitchen === "true", size: req.body.size === "" ? null : Number(req.body.size), sizeUnit: req.body.sizeUnit || null,
      video: String(req.body.video || "").trim(), contactPhone: String(req.body.contactPhone).trim(), amenities
    };
    const draft = await Draft.create({
      landlord: { name: String(req.body.name).trim(), email, phone, businessName: String(req.body.businessName || "").trim() },
      package: req.body.package, property, images: media.images, imageAssets: media.assets, createdByAdmin: req.user._id
    });
    stagedKeys = [];
    res.status(201).json({ success: true, message: "Assisted listing draft saved for review.", draft: await serializeListingImages(draft) });
  } catch (error) {
    if (stagedKeys.length) await deletePrivateImages(stagedKeys);
    next(error);
  }
};

exports.getAssistedListingDrafts = async (_req, res, next) => {
  try {
    const drafts = await Draft.find().select("+imageAssets").populate("createdListing", "title status isDeleted updatedAt").sort({ createdAt: -1 }).limit(200).lean();
    res.json({ success: true, drafts: await Promise.all(drafts.map(serializeListingImages)) });
  } catch (error) { next(error); }
};

exports.setAssistedListingImageLimit = async (req, res, next) => {
  try {
    const draft = await Draft.findOne({ _id: req.params.id, status: "approved", createdListing: { $ne: null } }).select("package").lean();
    if (!draft) return res.status(404).json({ success: false, message: "Approved assisted listing was not found." });
    req.maxListingImages = draft.package === "normal" ? 15 : 30;
    next();
  } catch (error) { next(error); }
};

exports.getApprovedAssistedListing = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid assisted listing draft ID." });
    const draft = await Draft.findOne({ _id: req.params.id, status: "approved", createdListing: { $ne: null } });
    if (!draft) return res.status(404).json({ success: false, message: "Approved assisted listing was not found." });
    const listing = await Listing.findOne({
      _id: draft.createdListing,
      landlord: draft.landlordUser,
      listingSource: "admin_assisted",
      status: "approved",
      isDeleted: { $ne: true }
    }).select("+imageAssets");
    if (!listing) return res.status(409).json({ success: false, message: "Property editing is available after the listing itself is approved and live." });
    res.json({ success: true, package: draft.package, listing: await serializeListingImages(listing) });
  } catch (error) { next(error); }
};

exports.updateApprovedAssistedListing = async (req, res, next) => {
  let stagedKeys = [];
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid assisted listing draft ID." });
    const draft = await Draft.findOne({ _id: req.params.id, status: "approved", createdListing: { $ne: null } });
    if (!draft) return res.status(404).json({ success: false, message: "Approved assisted listing was not found." });
    let listing = await Listing.findOne({
      _id: draft.createdListing,
      landlord: draft.landlordUser,
      listingSource: "admin_assisted",
      status: "approved",
      isDeleted: { $ne: true }
    }).select("+imageAssets");
    if (!listing) return res.status(409).json({ success: false, message: "Only a live, approved assisted listing can be edited here." });
    const expectedUpdatedAt = new Date(req.body.expectedUpdatedAt);
    if (!req.body.expectedUpdatedAt || Number.isNaN(expectedUpdatedAt.getTime())) {
      return res.status(400).json({ success: false, message: "Reload the property before saving changes." });
    }
    if (expectedUpdatedAt.getTime() !== new Date(listing.updatedAt).getTime()) {
      return res.status(409).json({ success: false, code: "LISTING_CHANGED", message: "This property changed after you opened it. Reload the editor before saving." });
    }
    const { issues, amenities } = validateAssistedListingEdit(req.body, req.files, { packageName: draft.package, existingImageCount: listing.images?.length || 0 });
    if (issues.length) return res.status(400).json({ success: false, message: issues[0], issues });

    const property = {
      title: String(req.body.title).trim(),
      description: String(req.body.description).trim(),
      purpose: req.body.purpose,
      maxGuests: req.body.purpose === "short_stay" ? Number(req.body.maxGuests) : null,
      minNights: req.body.purpose === "short_stay" ? Number(req.body.minNights || 1) : 1,
      checkInTime: req.body.checkInTime || "15:00",
      checkOutTime: req.body.checkOutTime || "10:00",
      price: Number(req.body.price), county: req.body.county, town: String(req.body.town).trim(),
      area: String(req.body.area || "").trim(),
      latitude: req.body.latitude === "" ? null : Number(req.body.latitude),
      longitude: req.body.longitude === "" ? null : Number(req.body.longitude),
      googleMapsUrl: String(req.body.googleMapsUrl || "").trim(), type: req.body.type,
      bedrooms: RESIDENTIAL_TYPES.includes(req.body.type) ? Number(req.body.bedrooms) : null,
      bathrooms: RESIDENTIAL_TYPES.includes(req.body.type) ? Number(req.body.bathrooms) : null,
      kitchen: ["true", true, "on"].includes(req.body.kitchen),
      size: req.body.type === "office" ? Number(req.body.size) : null,
      sizeUnit: req.body.type === "office" ? req.body.sizeUnit : null,
      video: String(req.body.video || "").trim(),
      contactPhone: normalizeKenyanPhone(req.body.contactPhone), amenities,
      portfolioName: String(req.body.portfolioName || "").trim(),
      portfolioCategory: String(req.body.portfolioCategory || "").trim(),
      totalUnits: String(req.body.portfolioName || "").trim() ? Number(req.body.totalUnits) : 1,
      availableUnits: String(req.body.portfolioName || "").trim() ? Number(req.body.availableUnits) : 1
    };
    let newImageAssets = null;
    if (req.files?.length) {
      const media = await uploadListingImages(req.user._id, req.files);
      newImageAssets = media.assets;
      stagedKeys = media.assets.map((asset) => asset.stagingKey);
    }
    const previousStagedKeys = newImageAssets
      ? (listing.imageAssets || []).filter((asset) => asset.status === "staged" && asset.stagingKey).map((asset) => asset.stagingKey)
      : [];
    let session;
    try {
      session = await mongoose.startSession();
      await session.withTransaction(async () => {
        const currentListing = await Listing.findOne({
          _id: listing._id,
          landlord: draft.landlordUser,
          listingSource: "admin_assisted",
          status: "approved",
          isDeleted: { $ne: true },
          updatedAt: expectedUpdatedAt
        }).select("+imageAssets").session(session);
        if (!currentListing) {
          throw Object.assign(new Error("This property changed after you opened it. Reload the editor before saving."), { status: 409, code: "LISTING_CHANGED" });
        }
        listing = currentListing;
        Object.assign(listing, property);
        if (newImageAssets) {
          listing.images = newImageAssets.map(() => "");
          listing.imageAssets = newImageAssets;
        }
        listing.status = "pending";
        listing.reviewedByAdmin = null;
        listing.reviewedAt = null;
        listing.unlistReason = null;
        await listing.save({ session });

        draft.property = property;
        draft.lastPropertyEditedByAdmin = req.user._id;
        draft.lastPropertyEditedAt = new Date();
        await draft.save({ session });
      });
    } finally {
      if (session) await session.endSession();
    }
    stagedKeys = [];
    if (previousStagedKeys.length) {
      try { await deletePrivateImages(previousStagedKeys); }
      catch { console.warn("Could not clean superseded staged assisted listing images."); }
    }
    let activityRecorded = true;
    try {
      await recordAdminActivity({
        eventType: "assisted_listing_edited",
        description: "Approved assisted listing edited",
        details: `${property.title} · edits returned the listing to review`,
        path: "/admin/landlords/assisted-listing",
        actor: req.user._id,
        actorName: req.user.name,
        entityType: "listing",
        entityId: String(listing._id)
      });
    } catch { activityRecorded = false; }
    res.json({ success: true, activityRecorded, message: "Property updated and returned to review before it goes live again.", draft: await serializeListingImages(draft), listing: await serializeListingImages(listing) });
  } catch (error) {
    if (stagedKeys.length) await deletePrivateImages(stagedKeys);
    next(error);
  }
};

exports.validateAssistedListingEdit = validateAssistedListingEdit;

exports.approveAssistedListingDraft = async (req, res, next) => {
  let session;
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid assisted listing draft ID." });
    const note = String(req.body?.reviewNote || "").trim();
    if (note.length > 1000) return res.status(400).json({ success: false, message: "Review note must be 1,000 characters or fewer." });
    const draft = await Draft.findById(req.params.id).select("+imageAssets");
    if (!draft) return res.status(404).json({ success: false, message: "Assisted listing draft not found." });
    if (draft.status === "approved" && draft.createdListing && draft.landlordUser) {
      return res.json({ success: true, alreadyApproved: true, accountSetupEmailSent: false, message: "This draft has already been approved.", landlordId: draft.landlordUser, listingId: draft.createdListing });
    }
    if (draft.status === "approving" && draft.reviewClaimedAt && Date.now() - draft.reviewClaimedAt.getTime() > 5 * 60 * 1000) {
      await Draft.updateOne({ _id: draft._id, status: "approving", reviewClaimedAt: draft.reviewClaimedAt }, { $set: { status: "draft", reviewedByAdmin: null, reviewClaimedAt: null } });
      return res.status(409).json({ success: false, message: "A stale approval attempt was recovered. Review the draft again to approve it." });
    }
    if (draft.status !== "draft" && draft.status !== "submitted") return res.status(409).json({ success: false, message: "This draft is not available for approval." });

    const claimed = await Draft.findOneAndUpdate(
      { _id: draft._id, status: draft.status },
      { $set: { status: "approving", reviewedByAdmin: req.user._id, reviewClaimedAt: new Date(), reviewNote: note } },
      { new: true }
    ).select("+imageAssets");
    if (!claimed) return res.status(409).json({ success: false, message: "This draft is already being reviewed." });

    let newAccountId;
    let listingId;
    let setupUrl;
    try {
      session = await mongoose.startSession();
      await session.withTransaction(async () => {
        const email = claimed.landlord.email.toLowerCase();
        let user = await User.findOne({ email }).session(session);
        if (user && user.role !== "landlord" && !(user.roles || []).includes("landlord")) {
          throw Object.assign(new Error("This email already belongs to a non-landlord account. Resolve the identity before approving."), { status: 409 });
        }
        if (user) throw Object.assign(new Error("A landlord account already exists for this email. Use the existing landlord workflow instead of creating a duplicate."), { status: 409 });

        const normalizedPhone = normalizeKenyanPhone(claimed.landlord.phone);
        const phoneExists = await User.exists(phoneUniquenessFilter(normalizedPhone)).session(session);
        if (phoneExists) throw Object.assign(new Error("This phone number is already linked to another account."), { status: 409 });

        const rawToken = crypto.randomBytes(32).toString("hex");
        user = new User({
          name: claimed.landlord.name,
          email,
          phone: normalizedPhone,
          businessName: claimed.landlord.businessName,
          password: crypto.randomBytes(32).toString("base64url"),
          role: "landlord",
          roles: ["landlord"],
          isEmailVerified: false,
          passwordResetToken: crypto.createHash("sha256").update(rawToken).digest("hex"),
          passwordResetExpires: new Date(Date.now() + 30 * 60 * 1000)
        });
        await user.save({ session });
        newAccountId = user._id;

        await Subscription.create([{
          user: user._id,
          plan: claimed.package,
          status: claimed.package === "normal" ? "free" : "pending_payment"
        }], { session });

        const property = claimed.property || {};
        const listing = new Listing({
          ...property,
          landlord: user._id,
          createdBy: req.user._id,
          listingSource: "admin_assisted",
          status: "pending",
          isActive: true,
          availability: "available",
          images: claimed.images || [],
          imageAssets: claimed.imageAssets || []
        });
        await listing.save({ session });
        listingId = listing._id;

        claimed.status = "approved";
        claimed.reviewedByAdmin = req.user._id;
        claimed.reviewedAt = new Date();
        claimed.reviewClaimedAt = null;
        claimed.landlordUser = user._id;
        claimed.createdListing = listing._id;
        claimed.reviewNote = note;
        await claimed.save({ session });

        const portalUrl = (process.env.LANDLORD_CLIENT_URL || "https://landlord.rendahomes.com").replace(/\/+$/, "");
        setupUrl = `${portalUrl}/reset-password/${rawToken}`;
      });
    } catch (error) {
      await Draft.updateOne({ _id: claimed._id, status: "approving" }, { $set: { status: "draft", reviewedByAdmin: null, reviewClaimedAt: null, reviewNote: "" } });
      throw error;
    } finally {
      if (session) await session.endSession();
    }

    let accountSetupEmailSent = false;
    let emailMessage = "";
    try {
      if (!process.env.RESEND_API_KEY) throw new Error("Email provider is not configured.");
      const result = await sendEmail({
        to: draft.landlord.email,
        subject: "Your RendaHomes landlord account is ready",
        html: assistedLandlordSetupEmail({
          name: draft.landlord.name,
          planName: plans[draft.package]?.name || draft.package,
          setupUrl,
          loginUrl: `${(process.env.LANDLORD_CLIENT_URL || "https://landlord.rendahomes.com").replace(/\/+$/, "")}/login`,
          isPaidPlan: draft.package !== "normal"
        })
      });
      if (result?.error) throw result.error;
      accountSetupEmailSent = true;
      await Draft.updateOne({ _id: draft._id, status: "approved" }, { $set: { accountSetupEmailSentAt: new Date() } });
    } catch (emailError) {
      emailMessage = "Account and listing were created, but the setup email could not be sent. Use the landlord password-reset flow to send a new link.";
    }

    await recordAdminActivity({
      eventType: "assisted_landlord_approved",
      description: "Assisted landlord draft approved",
      details: `${draft.property.title} · ${draft.landlord.name}`,
      path: "/admin/landlords/assisted-listing",
      actor: req.user._id,
      actorName: req.user.name,
      entityType: "listing",
      entityId: String(listingId)
    });
    res.json({ success: true, accountSetupEmailSent, message: emailMessage || "Landlord account created and listing submitted for review.", landlordId: newAccountId, listingId });
  } catch (error) { next(error); }
};

exports.resendAssistedLandlordSetupEmail = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid assisted listing draft ID." });
    const draft = await Draft.findOne({ _id: req.params.id, status: "approved", landlordUser: { $ne: null } });
    if (!draft) return res.status(404).json({ success: false, message: "Approved landlord draft not found." });
    const user = await User.findOne({ _id: draft.landlordUser, role: "landlord" });
    if (!user) return res.status(404).json({ success: false, message: "Landlord account not found." });

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
    const portalUrl = (process.env.LANDLORD_CLIENT_URL || "https://landlord.rendahomes.com").replace(/\/+$/, "");
    const result = await sendEmail({
      to: user.email,
      subject: "Your RendaHomes landlord account is ready",
      html: assistedLandlordSetupEmail({ name: user.name, planName: plans[draft.package]?.name || draft.package, setupUrl: `${portalUrl}/reset-password/${rawToken}`, loginUrl: `${portalUrl}/login`, isPaidPlan: draft.package !== "normal" })
    });
    if (!process.env.RESEND_API_KEY || result?.error) return res.status(503).json({ success: false, message: "Setup email could not be sent. Check the email provider configuration and retry." });
    await Draft.updateOne({ _id: draft._id }, { $set: { accountSetupEmailSentAt: new Date() } });
    res.json({ success: true, message: "A new secure password-setup link has been emailed." });
  } catch (error) { next(error); }
};

exports.rejectAssistedListingDraft = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid assisted listing draft ID." });
    const reviewNote = String(req.body?.reviewNote || "").trim();
    if (reviewNote.length > 1000) return res.status(400).json({ success: false, message: "Review note must be 1,000 characters or fewer." });
    const draft = await Draft.findOneAndUpdate(
      { _id: req.params.id, status: { $in: ["draft", "submitted"] } },
      { $set: { status: "rejected", reviewedByAdmin: req.user._id, reviewedAt: new Date(), reviewNote } },
      { new: true }
    );
    if (!draft) return res.status(404).json({ success: false, message: "Open assisted listing draft not found." });
    await recordAdminActivity({ eventType: "assisted_landlord_rejected", description: "Assisted landlord draft rejected", details: draft.property?.title || "Assisted draft", path: "/admin/landlords/assisted-listing", actor: req.user._id, actorName: req.user.name, entityType: "assisted_listing_draft", entityId: String(draft._id) });
    res.json({ success: true, message: "Draft rejected.", draft });
  } catch (error) { next(error); }
};

exports.validateAssistedListingDraft = validateDraft;
