const crypto = require("crypto");
const Listing = require("../listings/listings.model");
const StayBooking = require("./stayBooking.model");
const { recordAdminActivity } = require("../admin/adminActivity.service");

const overlapFilter = (listingId, checkIn, checkOut, excludeId) => ({
  listing: listingId,
  status: "confirmed",
  checkIn: { $lt: checkOut },
  checkOut: { $gt: checkIn },
  ...(excludeId ? { _id: { $ne: excludeId } } : {})
});

const validDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

exports.createStayRequest = async (req, res, next) => {
  try {
    const listing = await Listing.findOne({
      _id: req.params.listingId,
      purpose: "short_stay",
      status: "approved",
      isActive: true,
      availability: "available",
      isDeleted: { $ne: true }
    }).select("_id title landlord maxGuests minNights contactPhone");
    if (!listing) return res.status(404).json({ message: "This short-term stay is not available." });

    const { guestName, guestEmail, guestPhone, guests, message } = req.body;
    const checkIn = validDate(req.body.checkIn);
    const checkOut = validDate(req.body.checkOut);
    const guestCount = Number(guests);
    const now = new Date();
    if (!guestName?.trim() || !guestEmail?.trim() || !guestPhone?.trim()) {
      return res.status(400).json({ message: "Name, email, and phone are required." });
    }
    if (guestName.trim().length > 100 || guestEmail.trim().length > 160 || guestPhone.trim().length > 30 || String(message || "").length > 1200) {
      return res.status(400).json({ message: "One or more request fields are too long." });
    }
    if (!/^\S+@\S+\.\S+$/.test(guestEmail.trim())) return res.status(400).json({ message: "Enter a valid email address." });
    if (!checkIn || !checkOut || checkIn < new Date(now.toDateString()) || checkOut <= checkIn) {
      return res.status(400).json({ message: "Choose valid future check-in and check-out dates." });
    }
    const nights = Math.ceil((checkOut - checkIn) / 86400000);
    if (nights < (listing.minNights || 1)) return res.status(400).json({ message: `This stay requires at least ${listing.minNights || 1} night(s).` });
    if (!Number.isInteger(guestCount) || guestCount < 1 || (listing.maxGuests && guestCount > listing.maxGuests)) {
      return res.status(400).json({ message: `Guest count must be between 1 and ${listing.maxGuests || "the available limit"}.` });
    }
    if (await StayBooking.exists(overlapFilter(listing._id, checkIn, checkOut))) {
      return res.status(409).json({ message: "Those dates are already confirmed for this property. Please choose other dates." });
    }

    const requestCode = `RH-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const request = await StayBooking.create({
      requestCode,
      listing: listing._id,
      landlord: listing.landlord,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: guestPhone.trim(),
      checkIn,
      checkOut,
      guests: guestCount,
      message: String(message || "").trim()
    });
    await recordAdminActivity({
      eventType: "stay_request",
      description: "Short-stay request received",
      details: `${listing.title} • ${request.guestName}`,
      path: "/admin/stay-requests",
      actorName: request.guestName,
      entityType: "stay_request",
      entityId: String(request._id)
    });
    res.status(201).json({ success: true, message: "Stay request sent. The host must confirm your dates.", request: {
      _id: request._id, requestCode, listing: { _id: listing._id, title: listing.title }, status: request.status,
      checkIn: request.checkIn, checkOut: request.checkOut, guests: request.guests, guestName: request.guestName,
      guestEmail: request.guestEmail, guestPhone: request.guestPhone, landlordPhone: listing.contactPhone
    } });
  } catch (error) { next(error); }
};

exports.getLandlordStayRequests = async (req, res, next) => {
  try {
    const listingFilter = { landlord: req.landlordOwnerId || req.user._id };
    if (req.user.role === "landlord_staff" && req.user.teamRole === "agent") listingFilter.assignedAgent = req.user._id;
    const listings = await Listing.find(listingFilter).select("_id");
    const requests = await StayBooking.find({ listing: { $in: listings.map((item) => item._id) } })
      .populate("listing", "title images price town county")
      .sort({ createdAt: -1 }).limit(250).lean();
    res.json({ success: true, requests });
  } catch (error) { next(error); }
};

exports.updateStayRequestStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["confirmed", "declined", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({ message: "Choose a valid request status." });
    }
    const request = await StayBooking.findOne({ _id: req.params.id, landlord: req.landlordOwnerId || req.user._id });
    if (!request) return res.status(404).json({ message: "Stay request not found." });
    const listing = await Listing.findOne({ _id: request.listing, landlord: req.landlordOwnerId || req.user._id });
    if (!listing || (req.user.role === "landlord_staff" && req.user.teamRole === "agent" && String(listing.assignedAgent) !== String(req.user._id))) {
      return res.status(404).json({ message: "Stay request not found." });
    }
    if (status === "confirmed") {
      if (request.status === "declined" || request.status === "cancelled") {
        return res.status(409).json({ message: "This request is closed and cannot be confirmed." });
      }
      const lockToken = crypto.randomUUID();
      let acquired = false;
      for (let attempt = 0; attempt < 30 && !acquired; attempt += 1) {
        const lock = await Listing.updateOne({
          _id: listing._id,
          $or: [
            { bookingLockToken: null },
            { bookingLockToken: { $exists: false } },
            { bookingLockExpiresAt: { $lt: new Date() } }
          ]
        }, { $set: { bookingLockToken: lockToken, bookingLockExpiresAt: new Date(Date.now() + 15000) } });
        acquired = lock.modifiedCount === 1;
        if (!acquired) await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (!acquired) return res.status(409).json({ message: "This property's calendar is busy. Please try again." });
      try {
        if (await StayBooking.exists(overlapFilter(request.listing, request.checkIn, request.checkOut, request._id))) {
          return res.status(409).json({ message: "Another confirmed stay overlaps these dates." });
        }
        request.status = status;
        await request.save();
        return res.json({ success: true, request });
      } finally {
        await Listing.updateOne({ _id: listing._id, bookingLockToken: lockToken }, { $set: { bookingLockToken: null, bookingLockExpiresAt: null } });
      }
    }
    request.status = status;
    await request.save();
    res.json({ success: true, request });
  } catch (error) { next(error); }
};
