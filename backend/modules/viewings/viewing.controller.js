const crypto = require("crypto");
const mongoose = require("mongoose");
const Viewing = require("./viewing.model");
const Listing = require("../listings/listings.model");
const Inquiry = require("../inquiries/inquiry.model");
const AppAlert = require("../alerts/alert.model");
const PropertyMandate = require("../organizations/propertyMandate.model");
const OrganizationMembership = require("../organizations/organizationMembership.model");
const { canAccessListing, hasRole } = require("../authorization/authorization.service");
const { withAuthorizationTransaction } = require("../authorization/transaction.service");
const { recordAuthorizationChange } = require("../authorization/audit.service");
const { queueStatusNotificationSafely } = require("../renda-assistant/notifications.service");
const { transitionViewing } = require("./viewing.service");
const Lead = require("../leads/lead.model");
const { ensureLead, canTransitionLead } = require("../leads/lead.service");
const PropertyRequest = require("../propertyRequests/propertyRequest.model");
const ListingMatch = require("../propertyRequests/listingMatch.model");
const AgentMatchProposal = require("../propertyRequests/agentMatchProposal.model");

const parseSlot = (startValue, endValue) => {
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start <= new Date() || end <= start) {
    const error = new Error("Choose a valid future viewing time range.");
    error.statusCode = 400;
    throw error;
  }
  return { start, end };
};
const safeTimezone = (value) => {
  const timezone = String(value || "Africa/Nairobi").trim();
  try { new Intl.DateTimeFormat("en", { timeZone: timezone }); }
  catch { const error = new Error("Choose a valid time zone."); error.statusCode = 400; throw error; }
  return timezone.slice(0, 100);
};
const viewingResponse = (query) => query
  .populate("listing", "title price purpose type county town area images availability status isActive")
  .populate("customer", "name email phone")
  .populate("advertiser", "name businessName")
  .populate("assignedAgent", "name");

const canManageViewing = async (req, listing) => hasRole(req.user, "admin") || canAccessListing({ user: req.user, listing, permission: "inquiries:manage" });
const findAuthorizedViewing = async (req) => {
  if (!mongoose.isValidObjectId(req.params.id)) return null;
  const viewing = await Viewing.findById(req.params.id);
  if (!viewing) return null;
  if (String(viewing.customer) === String(req.user._id)) return { viewing, customer: true, advertiser: false };
  const listing = await Listing.findById(viewing.listing).select("_id landlord organization branch assignedAgent");
  if (!listing || !await canManageViewing(req, listing)) return null;
  return { viewing, customer: false, advertiser: true, listing };
};

exports.createViewing = async (req, res, next) => {
  try {
    const allowed = new Set(["listingId", "requestedStartAt", "requestedEndAt", "timezone", "customerMessage", "contactSharingConsent", "inquiryType", "inquiryId", "propertyRequestId"]);
    if (Object.keys(req.body || {}).some((key) => !allowed.has(key))) return res.status(400).json({ message: "Unsupported viewing request field." });
    if (req.body.contactSharingConsent !== true) return res.status(400).json({ message: "Consent to share your contact details with the advertiser is required to request a viewing." });
    if (!mongoose.isValidObjectId(req.body.listingId)) return res.status(400).json({ message: "A valid listing is required." });
    const { start, end } = parseSlot(req.body.requestedStartAt, req.body.requestedEndAt);
    const message = String(req.body.customerMessage || "").trim();
    if (message.length > 1200) return res.status(400).json({ message: "Your note is too long." });
    const timezone = safeTimezone(req.body.timezone);
    const listing = await Listing.findOne({ _id: req.body.listingId, status: "approved", availability: "available", isActive: true, isDeleted: { $ne: true } }).select("_id title landlord assignedAgent");
    if (!listing) return res.status(404).json({ message: "This property is not available for a viewing request." });

    let propertyRequest = null;
    let acceptedAgentProposal = null;
    if (req.body.propertyRequestId !== undefined) {
      if (!mongoose.isValidObjectId(req.body.propertyRequestId)) return res.status(400).json({ message: "A valid property request is required." });
      propertyRequest = await PropertyRequest.findOne({ _id: req.body.propertyRequestId, customer: req.user._id, status: { $nin: ["closed", "cancelled", "expired"] }, "consent.matching": true }).select("_id");
      if (!propertyRequest) return res.status(404).json({ message: "Property request not found for this account." });
      const [activeMatch, agentProposal] = await Promise.all([
        ListingMatch.exists({ propertyRequest: propertyRequest._id, listing: listing._id, invalidatedAt: null }),
        AgentMatchProposal.findOne({ propertyRequest: propertyRequest._id, listing: listing._id, status: "accepted" }).select("_id agent")
      ]);
      acceptedAgentProposal = agentProposal;
      if (!activeMatch && !acceptedAgentProposal) return res.status(409).json({ message: "This property is no longer an active match or accepted proposal for your request. Refresh matches and try again." });
    }

    let websiteInquiry = null;
    let appAlert = null;
    if (req.body.inquiryId) {
      if (req.body.inquiryType === "website") {
        websiteInquiry = await Inquiry.findOne({ _id: req.body.inquiryId, listing: listing._id, email: String(req.user.email || "").toLowerCase() }).select("_id");
      } else if (req.body.inquiryType === "app") {
        appAlert = await AppAlert.findOne({ _id: req.body.inquiryId, listing: listing._id, user: req.user._id }).select("_id websiteInquiry");
      }
      if (!websiteInquiry && !appAlert) return res.status(404).json({ message: "Inquiry not found for this account and property." });
    } else if (req.body.inquiryType !== undefined) {
      return res.status(400).json({ message: "An inquiry type requires an inquiry ID." });
    }

    const idempotencyHeader = String(req.get("idempotency-key") || "").trim();
    if (idempotencyHeader.length > 200) return res.status(400).json({ message: "Idempotency key is too long." });
    const idempotencyKey = idempotencyHeader ? crypto.createHash("sha256").update(idempotencyHeader).digest("hex") : undefined;
    if (idempotencyKey) {
      const existing = await Viewing.findOne({ customer: req.user._id, idempotencyKey }).select("+idempotencyKey");
      if (existing) return res.status(200).json({ success: true, duplicate: true, viewing: await viewingResponse(Viewing.findById(existing._id)) });
    }

    const viewing = await withAuthorizationTransaction(async (session) => {
      if (propertyRequest) {
        const activeRequest = await PropertyRequest.exists({ _id: propertyRequest._id, customer: req.user._id, status: { $nin: ["closed", "cancelled", "expired"] } }).session(session);
        const activeMatch = await ListingMatch.exists({ propertyRequest: propertyRequest._id, listing: listing._id, invalidatedAt: null }).session(session);
        const activeProposal = acceptedAgentProposal && await AgentMatchProposal.exists({ _id: acceptedAgentProposal._id, propertyRequest: propertyRequest._id, listing: listing._id, status: "accepted" }).session(session);
        if (!activeRequest || (!activeMatch && !activeProposal)) {
          const error = new Error("This property is no longer an active match for your request. Refresh matches and try again.");
          error.statusCode = 409;
          throw error;
        }
      }
      const [created] = await Viewing.create([{
        listing: listing._id, customer: req.user._id, advertiser: listing.landlord, assignedAgent: acceptedAgentProposal?.agent || listing.assignedAgent || null,
        websiteInquiry: websiteInquiry?._id || null, appAlert: appAlert?._id || null, idempotencyKey,
        propertyRequest: propertyRequest?._id || null,
        requestedStartAt: start, requestedEndAt: end, timezone, customerMessage: message,
        consent: { contactSharing: true }
      }], { session });
      const sourceModel = websiteInquiry || appAlert?.websiteInquiry ? "Inquiry" : appAlert ? "AppAlert" : "Viewing";
      const sourceRecord = websiteInquiry?._id || appAlert?.websiteInquiry || appAlert?._id || created._id;
      let lead = await Lead.findOne({ sourceModel, sourceRecord }).session(session);
      if (!lead) lead = await ensureLead({ sourceModel, sourceRecord, listing: listing._id, advertiser: listing.landlord, customer: req.user._id, sourceChannel: websiteInquiry || appAlert?.websiteInquiry ? "website" : appAlert ? "user_portal" : "website", assignedAgent: acceptedAgentProposal?.agent || listing.assignedAgent || null, propertyRequest: propertyRequest?._id || null, session });
      else if (propertyRequest) lead.addToSet("propertyRequests", propertyRequest._id);
      lead.stage = "viewing_requested";
      lead.viewings.addToSet(created._id);
      await lead.save({ session });
      created.lead = lead._id;
      await created.save({ session });
      await recordAuthorizationChange(req, { action: "viewing.requested", resourceType: "viewing", resourceId: created._id, changes: { listingId: String(listing._id), leadId: String(lead._id) }, session });
      return created;
    });
    await queueStatusNotificationSafely({ userId: listing.landlord, eventType: "viewing_requested", entityId: viewing._id, eventVersion: viewing.createdAt.getTime() });
    res.status(201).json({ success: true, message: "Viewing request sent. The advertiser must confirm the time.", viewing: await viewingResponse(Viewing.findById(viewing._id)) });
  } catch (error) {
    if (error.code === 11000 && req.get("idempotency-key")) {
      const idempotencyKey = crypto.createHash("sha256").update(String(req.get("idempotency-key")).trim()).digest("hex");
      const duplicate = await Viewing.findOne({ customer: req.user._id, idempotencyKey });
      if (duplicate) return res.status(200).json({ success: true, duplicate: true, viewing: await viewingResponse(Viewing.findById(duplicate._id)) });
    }
    next(error);
  }
};

exports.listMyViewings = async (req, res, next) => {
  try {
    const viewings = await viewingResponse(Viewing.find({ customer: req.user._id }).sort({ requestedStartAt: 1 }).limit(200));
    res.json({ success: true, viewings });
  } catch (error) { next(error); }
};

exports.listAdvertiserViewings = async (req, res, next) => {
  try {
    const listingFilter = { landlord: req.landlordOwnerId || req.user._id };
    if (req.landlordOrganization) listingFilter.organization = req.landlordOrganization._id;
    if (req.organizationMembership?.branchIds?.length) listingFilter.branch = { $in: req.organizationMembership.branchIds };
    if (hasRole(req.user, "landlord_staff") && req.user.teamRole === "agent" || req.organizationMembership?.role === "agent") listingFilter.assignedAgent = req.user._id;
    const listings = await Listing.find(listingFilter).distinct("_id");
    const ids = await PropertyMandate.find({ principal: req.landlordOwnerId || req.user._id, agent: req.user._id, status: "active", scope: "property", listing: { $ne: null } }).distinct("listing");
    const candidateIds = [...new Set([...listings.map(String), ...ids.map(String)])];
    const records = await Viewing.find({ listing: { $in: candidateIds } }).sort({ requestedStartAt: 1 }).limit(250);
    const viewings = await Promise.all(records.map(async (record) => {
      const listing = await Listing.findById(record.listing).select("_id landlord organization branch assignedAgent");
      return listing && await canManageViewing(req, listing) ? record : null;
    }));
    res.json({ success: true, viewings: await viewingResponse(Viewing.find({ _id: { $in: viewings.filter(Boolean).map((item) => item._id) } }).sort({ requestedStartAt: 1 })) });
  } catch (error) { next(error); }
};

exports.listAgentViewings = async (req, res, next) => {
  try {
    const now = new Date();
    const mandates = await PropertyMandate.find({ agent: req.user._id, status: "active", startsAt: { $lte: now }, $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }).select("listing organization").lean();
    const listingIds = mandates.filter((mandate) => mandate.listing).map((mandate) => mandate.listing);
    const organizationIds = [...new Set(mandates.filter((mandate) => mandate.organization).map((mandate) => String(mandate.organization)))];
    if (organizationIds.length) {
      const memberships = await OrganizationMembership.find({ organization: { $in: organizationIds }, user: req.user._id, status: "active" }).distinct("organization");
      if (memberships.length) listingIds.push(...await Listing.find({ organization: { $in: memberships } }).distinct("_id"));
    }
    const records = await Viewing.find({ $or: [{ assignedAgent: req.user._id }, { listing: { $in: listingIds } }] }).sort({ requestedStartAt: 1 }).limit(250);
    const visible = await Promise.all(records.map(async (record) => {
      const listing = await Listing.findById(record.listing).select("_id landlord organization branch assignedAgent");
      return listing && await canManageViewing(req, listing) ? record : null;
    }));
    res.json({ success: true, viewings: await viewingResponse(Viewing.find({ _id: { $in: visible.filter(Boolean).map((item) => item._id) } }).sort({ requestedStartAt: 1 })) });
  } catch (error) { next(error); }
};

exports.getViewing = async (req, res, next) => {
  try {
    const access = await findAuthorizedViewing(req);
    if (!access) return res.status(404).json({ message: "Viewing not found." });
    res.json({ success: true, viewing: await viewingResponse(Viewing.findById(access.viewing._id)) });
  } catch (error) { next(error); }
};

exports.transition = (action) => async (req, res, next) => {
  try {
    const access = await findAuthorizedViewing(req);
    if (!access) return res.status(404).json({ message: "Viewing not found." });
    const customerAcceptingProposal = access.customer && access.viewing.status === "reschedule_proposed" && String(access.viewing.proposalBy) !== String(req.user._id);
    if (action === "confirm" && (!access.advertiser && !customerAcceptingProposal || access.advertiser && access.viewing.status === "reschedule_proposed" && String(access.viewing.proposalBy) === String(req.user._id))) return res.status(403).json({ message: "Only the other party can accept this viewing time." });
    if (["decline", "complete"].includes(action) && !access.advertiser) return res.status(403).json({ message: "Only the authorized advertiser can do this." });
    if (action === "propose_reschedule" && !access.advertiser && !access.customer) return res.status(403).json({ message: "Access denied." });
    if (action === "cancel" && !access.advertiser && !access.customer) return res.status(403).json({ message: "Access denied." });
    const details = action === "propose_reschedule" ? { startAt: req.body.startAt, endAt: req.body.endAt, message: req.body.message }
      : action === "decline" ? { message: req.body.message }
        : action === "cancel" ? { reason: req.body.reason }
          : { outcome: req.body.outcome };
    const transition = transitionViewing(access.viewing, action, req.user._id, details);
    const updated = await withAuthorizationTransaction(async (session) => {
      const result = await Viewing.findOneAndUpdate(
        { _id: access.viewing._id, status: transition.expectedStatus, __v: transition.expectedVersion },
        { $set: transition.updates, $inc: { __v: 1 } },
        { new: true, runValidators: true, session }
      );
      if (!result) {
        const error = new Error("Viewing changed while this action was being processed. Refresh and try again.");
        error.statusCode = 409;
        throw error;
      }
      await recordAuthorizationChange(req, { action: `viewing.${action}`, resourceType: "viewing", resourceId: result._id, organization: access.listing?.organization || null, changes: { previousStatus: transition.expectedStatus, status: result.status }, session });
      const leadStage = action === "confirm" ? "viewing_confirmed"
        : action === "complete" ? transition.updates.completedOutcome === "viewed" ? "viewed" : transition.updates.completedOutcome === "not_completed" ? "contacted" : "closed_unsuccessful"
          : action === "decline" || action === "cancel" ? "contacted" : null;
      if (leadStage && result.lead) {
        const lead = await Lead.findById(result.lead).session(session);
        if (lead && lead.stage !== leadStage && canTransitionLead(lead.stage, leadStage)) {
          lead.stage = leadStage;
          await lead.save({ session });
        }
      }
      return result;
    });
    const recipientId = access.customer ? updated.advertiser : updated.customer;
    const eventType = ({ confirm: "viewing_confirmed", decline: "viewing_declined", propose_reschedule: "viewing_reschedule_proposed", cancel: "viewing_cancelled", complete: "viewing_completed" })[action];
    await queueStatusNotificationSafely({ userId: recipientId, eventType, entityId: updated._id, eventVersion: updated.updatedAt.getTime() });
    res.json({ success: true, viewing: await viewingResponse(Viewing.findById(updated._id)) });
  } catch (error) { next(error); }
};
