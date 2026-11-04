const mongoose = require("mongoose");
const User = require("../users/user.model");
const Listing = require("../listings/listings.model");
const OrganizationMembership = require("../organizations/organizationMembership.model");
const PropertyMandate = require("../organizations/propertyMandate.model");
const PropertyRequest = require("./propertyRequest.model");
const AgentMatchProposal = require("./agentMatchProposal.model");
const { hasRole, canAccessListing } = require("../authorization/authorization.service");
const { withAuthorizationTransaction } = require("../authorization/transaction.service");
const { recordAuthorizationChange } = require("../authorization/audit.service");
const { buildListingEligibilityFilter, buildAlternativeListingFilter } = require("./propertyRequest.service");
const { isWithinServiceAreas, requestWithinServiceAreas } = require("./agentMarketplace.service");

const listingProjection = "title description price purpose type county town area bedrooms bathrooms size sizeUnit images amenities availability maxGuests minNights organization branch landlord";
const requestProjection = "purpose preferredLocations propertyTypes minBedrooms minBathrooms budgetMin budgetMax currency pricePeriod moveInDate stayStartDate stayEndDate guestCount status createdAt expiresAt consent";
const notFound = () => Object.assign(new Error("Property request not found."), { statusCode: 404 });

const loadMarketplaceAgent = async (userId) => {
  const agent = await User.findById(userId).select("role roles agentStatus agentMarketplaceStatus agentServiceAreas");
  if (!agent || !hasRole(agent, "agent") || agent.agentStatus !== "active" || agent.agentMarketplaceStatus !== "approved" || !agent.agentServiceAreas?.length) {
    const error = new Error("Agent marketplace access is not enabled for this account.");
    error.statusCode = 403;
    throw error;
  }
  return agent;
};

const getLiveRequest = async (id, { agentAreas, customerId } = {}) => {
  if (!mongoose.isValidObjectId(id)) return null;
  const request = await PropertyRequest.findOne({
    _id: id,
    status: { $in: ["active", "matched"] },
    "consent.matching": true,
    ...(agentAreas ? { "consent.agentSharing": true } : {}),
    ...(customerId ? { customer: customerId } : {}),
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
  }).select(requestProjection);
  if (request && agentAreas && !requestWithinServiceAreas(agentAreas, request.preferredLocations)) return null;
  return request;
};

const agentCandidateListings = async (agent) => {
  const agentId = agent._id;
  const now = new Date();
  const [mandates, memberships] = await Promise.all([
    PropertyMandate.find({ agent: agentId, status: "active", permissions: "listings:advertise", startsAt: { $lte: now }, $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }).select("listing organization"),
    OrganizationMembership.find({ user: agentId, status: "active", permissions: "listings:advertise" }).select("organization scope branchIds")
  ]);
  const conditions = [{ landlord: agentId }, { assignedAgent: agentId }];
  const listingIds = mandates.map((mandate) => mandate.listing).filter(Boolean);
  if (listingIds.length) conditions.push({ _id: { $in: listingIds } });
  for (const membership of memberships) {
    if (membership.scope === "organization") conditions.push({ organization: membership.organization });
    else if (membership.branchIds.length) conditions.push({ organization: membership.organization, branch: { $in: membership.branchIds } });
  }
  const orgWideMandates = mandates.filter((mandate) => !mandate.listing && mandate.organization).map((mandate) => mandate.organization);
  if (orgWideMandates.length) conditions.push({ organization: { $in: orgWideMandates } });
  const visible = await Listing.find({
    status: "approved", isActive: true, availability: "available", isDeleted: { $ne: true },
    $or: conditions
  }).select(listingProjection).sort({ updatedAt: -1 }).limit(1000);
  const authorized = await Promise.all(visible.map(async (listing) =>
    await canAccessListing({ user: agent, listing, permission: "listings:advertise" }) ? listing : null
  ));
  return authorized.filter(Boolean);
};

const proposalFit = async (request, listing) => {
  const exact = await Listing.exists({ _id: listing._id, ...buildListingEligibilityFilter(request) });
  if (exact) return "exact";
  const alternativeFilter = buildAlternativeListingFilter(request);
  if (alternativeFilter && await Listing.exists({ _id: listing._id, ...alternativeFilter })) return "alternative";
  return null;
};

const requestSummary = (request, proposalStatus = null) => ({
  _id: request._id,
  purpose: request.purpose,
  preferredLocations: request.preferredLocations,
  propertyTypes: request.propertyTypes,
  minBedrooms: request.minBedrooms,
  minBathrooms: request.minBathrooms,
  budgetMin: request.budgetMin,
  budgetMax: request.budgetMax,
  currency: request.currency,
  pricePeriod: request.pricePeriod,
  moveInDate: request.moveInDate,
  stayStartDate: request.stayStartDate,
  stayEndDate: request.stayEndDate,
  guestCount: request.guestCount,
  status: request.status,
  createdAt: request.createdAt,
  proposalStatus
});

exports.listSharedRequests = async (req, res, next) => {
  try {
    const agent = await loadMarketplaceAgent(req.user._id);
    const requests = await PropertyRequest.find({
      status: { $in: ["active", "matched"] },
      "consent.matching": true,
      "consent.agentSharing": true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
    }).select(requestProjection).sort({ createdAt: -1 }).limit(200).lean();
    const relevant = requests.filter((request) => requestWithinServiceAreas(agent.agentServiceAreas, request.preferredLocations));
    const proposals = relevant.length ? await AgentMatchProposal.find({ agent: agent._id, propertyRequest: { $in: relevant.map((request) => request._id) } }).select("propertyRequest status").lean() : [];
    const proposalByRequest = new Map(proposals.map((proposal) => [String(proposal.propertyRequest), proposal.status]));
    res.json({ success: true, requests: relevant.map((request) => requestSummary(request, proposalByRequest.get(String(request._id)) || null)) });
  } catch (error) { next(error); }
};

exports.listEligibleListings = async (req, res, next) => {
  try {
    const agent = await loadMarketplaceAgent(req.user._id);
    const propertyRequest = await getLiveRequest(req.params.requestId, { agentAreas: agent.agentServiceAreas });
    if (!propertyRequest) return res.status(404).json({ message: "Shared property request not found." });
    const candidates = await agentCandidateListings(agent);
    const eligible = [];
    for (const listing of candidates) {
      if (!isWithinServiceAreas(agent.agentServiceAreas, listing.county, listing.town)) continue;
      const classification = await proposalFit(propertyRequest, listing);
      if (classification) {
        const { landlord, organization, branch, ...publicListing } = listing.toObject();
        eligible.push({ ...publicListing, classification });
      }
      if (eligible.length >= 100) break;
    }
    res.json({ success: true, listings: eligible });
  } catch (error) { next(error); }
};

exports.createProposal = async (req, res, next) => {
  try {
    const agent = await loadMarketplaceAgent(req.user._id);
    const allowed = new Set(["listingId", "message"]);
    if (Object.keys(req.body || {}).some((key) => !allowed.has(key))) return res.status(400).json({ message: "Unsupported proposal field." });
    if (!mongoose.isValidObjectId(req.body.listingId)) return res.status(400).json({ message: "Choose a valid listing." });
    const message = String(req.body.message || "").trim();
    if (message.length > 500) return res.status(400).json({ message: "Proposal message is too long." });
    const propertyRequest = await getLiveRequest(req.params.requestId, { agentAreas: agent.agentServiceAreas });
    if (!propertyRequest) return res.status(404).json({ message: "Shared property request not found." });
    const listing = await Listing.findOne({ _id: req.body.listingId, status: "approved", isActive: true, availability: "available", isDeleted: { $ne: true } }).select(listingProjection);
    if (!listing || !isWithinServiceAreas(agent.agentServiceAreas, listing.county, listing.town)) return res.status(404).json({ message: "Authorized available listing not found in your approved service area." });
    if (!await canAccessListing({ user: agent, listing, permission: "listings:advertise" }) || !await canAccessListing({ user: agent, listing, permission: "inquiries:manage" })) {
      return res.status(403).json({ message: "You need active advertising and inquiry authority for this listing." });
    }
    const classification = await proposalFit(propertyRequest, listing);
    if (!classification) return res.status(400).json({ message: "This listing does not meet the request's budget, property, room and availability requirements." });
    const proposal = await AgentMatchProposal.create({ propertyRequest: propertyRequest._id, listing: listing._id, agent: agent._id, classification, message });
    await recordAuthorizationChange(req, { action: "agent_match.proposed", resourceType: "agent_match_proposal", resourceId: proposal._id, organization: listing.organization || null, changes: { propertyRequestId: String(propertyRequest._id), listingId: String(listing._id), classification } });
    res.status(201).json({ success: true, proposal: { _id: proposal._id, status: proposal.status, classification: proposal.classification, listing: { _id: listing._id, title: listing.title, price: listing.price, county: listing.county, town: listing.town } } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "You have already proposed a listing for this request." });
    next(error);
  }
};

exports.listCustomerProposals = async (req, res, next) => {
  try {
    const propertyRequest = await PropertyRequest.findOne({ _id: req.params.id, customer: req.user._id, "consent.agentSharing": true });
    if (!propertyRequest) return res.status(404).json({ message: "Property request not found." });
    const proposals = await AgentMatchProposal.find({ propertyRequest: propertyRequest._id }).sort({ createdAt: -1 })
      .populate({ path: "listing", select: "title description price purpose type county town area bedrooms bathrooms images availability status isActive" })
      .populate({ path: "agent", select: "name businessName avatar" }).lean();
    res.json({ success: true, proposals: proposals.filter((proposal) => proposal.listing).map((proposal) => ({
      _id: proposal._id,
      status: proposal.status,
      classification: proposal.classification,
      message: proposal.message,
      createdAt: proposal.createdAt,
      respondedAt: proposal.respondedAt,
      listing: proposal.listing,
      agent: proposal.agent ? { name: proposal.agent.businessName || proposal.agent.name, avatar: proposal.agent.avatar || "" } : null
    })) });
  } catch (error) { next(error); }
};

exports.respondToProposal = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !["accepted", "declined"].includes(req.body.status) || Object.keys(req.body || {}).some((key) => key !== "status")) {
      return res.status(400).json({ message: "Choose whether to accept or decline this proposal." });
    }
    const propertyRequest = await PropertyRequest.findOne({ _id: req.params.id, customer: req.user._id, "consent.agentSharing": true, status: { $in: ["active", "matched"] } });
    if (!propertyRequest) return res.status(404).json({ message: "Property request not found." });
    const proposal = await AgentMatchProposal.findOne({ _id: req.params.proposalId, propertyRequest: propertyRequest._id, status: "proposed" });
    if (!proposal) return res.status(404).json({ message: "Pending agent proposal not found." });
    if (req.body.status === "accepted") {
      const [agent, listing] = await Promise.all([
        User.findById(proposal.agent).select("role roles agentStatus agentMarketplaceStatus agentServiceAreas"),
        Listing.findOne({ _id: proposal.listing, status: "approved", isActive: true, availability: "available", isDeleted: { $ne: true } })
      ]);
      if (!agent || !hasRole(agent, "agent") || agent.agentStatus !== "active" || agent.agentMarketplaceStatus !== "approved" || !listing ||
          !isWithinServiceAreas(agent.agentServiceAreas, listing.county, listing.town) ||
          !await canAccessListing({ user: agent, listing, permission: "listings:advertise" }) ||
          !await canAccessListing({ user: agent, listing, permission: "inquiries:manage" }) ||
          !await proposalFit(propertyRequest, listing)) {
        return res.status(409).json({ message: "This proposal is no longer eligible. Refresh your request to see current options." });
      }
    }
    const updated = await withAuthorizationTransaction(async (session) => {
      const activeRequest = await PropertyRequest.exists({ _id: propertyRequest._id, customer: req.user._id, "consent.agentSharing": true, status: { $in: ["active", "matched"] } }).session(session);
      if (!activeRequest) throw notFound();
      const saved = await AgentMatchProposal.findOneAndUpdate(
        { _id: proposal._id, propertyRequest: propertyRequest._id, status: "proposed", __v: proposal.__v },
        { $set: { status: req.body.status, respondedAt: new Date() }, $inc: { __v: 1 } },
        { new: true, runValidators: true, session }
      );
      if (!saved) { const error = new Error("This proposal has changed. Refresh and try again."); error.statusCode = 409; throw error; }
      await recordAuthorizationChange(req, { action: `agent_match.${req.body.status}`, resourceType: "agent_match_proposal", resourceId: saved._id, changes: { propertyRequestId: String(propertyRequest._id), listingId: String(saved.listing), agentId: String(saved.agent) }, session });
      return saved;
    });
    res.json({ success: true, proposal: updated });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Another proposal has already been accepted for this request." });
    next(error);
  }
};

exports.withdrawProposal = async (req, res, next) => {
  try {
    const proposal = await AgentMatchProposal.findOneAndUpdate(
      { _id: req.params.proposalId, agent: req.user._id, status: "proposed" },
      { $set: { status: "withdrawn", respondedAt: new Date() }, $inc: { __v: 1 } },
      { new: true, runValidators: true }
    );
    if (!proposal) return res.status(404).json({ message: "Pending proposal not found." });
    await recordAuthorizationChange(req, { action: "agent_match.withdrawn", resourceType: "agent_match_proposal", resourceId: proposal._id, changes: { propertyRequestId: String(proposal.propertyRequest), listingId: String(proposal.listing) } });
    res.json({ success: true, proposal });
  } catch (error) { next(error); }
};
