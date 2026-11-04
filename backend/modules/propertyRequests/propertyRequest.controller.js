const PropertyRequest = require("./propertyRequest.model");
const ListingMatch = require("./listingMatch.model");
const AgentMatchProposal = require("./agentMatchProposal.model");
const { normalizePropertyRequest, getOwnedRequest, generateMatches } = require("./propertyRequest.service");
const { hashIdempotencyKey, hashRequestPayload } = require("./idempotency.service");

const matchingProjection = "title description price purpose type county town area bedrooms bathrooms size sizeUnit images amenities availability maxGuests minNights";

const sendDuplicateOrConflict = (res, existing, payloadHash) => {
  if (!existing) return false;
  if (existing.idempotencyPayloadHash !== payloadHash) {
    res.status(409).json({ message: "This submission key was already used for different property requirements." });
    return true;
  }
  res.status(200).json({ success: true, duplicate: true, propertyRequest: existing });
  return true;
};

exports.createRequest = async (req, res, next) => {
  try {
    const payload = normalizePropertyRequest(req.body);
    const requestKey = req.get("Idempotency-Key");
    if (requestKey !== undefined && (requestKey.length < 16 || requestKey.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(requestKey))) {
      return res.status(400).json({ message: "A valid Idempotency-Key header is required." });
    }
    const payloadHash = hashRequestPayload(payload);
    const idempotencyKeyHash = requestKey ? hashIdempotencyKey(requestKey) : null;
    if (idempotencyKeyHash) {
      const existing = await PropertyRequest.findOne({ customer: req.user._id, idempotencyKeyHash }).select("+idempotencyPayloadHash");
      if (sendDuplicateOrConflict(res, existing, payloadHash)) return;
    }
    let propertyRequest;
    try {
      [propertyRequest] = await PropertyRequest.create([{
        ...payload,
        customer: req.user._id,
        status: "active",
        ...(idempotencyKeyHash ? { idempotencyKeyHash, idempotencyPayloadHash: payloadHash } : {})
      }]);
    } catch (error) {
      if (error.code !== 11000 || !idempotencyKeyHash) throw error;
      const existing = await PropertyRequest.findOne({ customer: req.user._id, idempotencyKeyHash }).select("+idempotencyPayloadHash");
      if (sendDuplicateOrConflict(res, existing, payloadHash)) return;
      throw error;
    }
    res.status(201).json({ success: true, propertyRequest });
  } catch (error) { next(error); }
};

exports.listMyRequests = async (req, res, next) => {
  try {
    const requests = await PropertyRequest.find({ customer: req.user._id }).sort({ updatedAt: -1 }).limit(100).lean();
    const requestIds = requests.map((request) => request._id);
    const matches = requestIds.length ? await ListingMatch.find({ propertyRequest: { $in: requestIds }, invalidatedAt: null })
      .sort({ score: -1 }).limit(500).populate({ path: "listing", select: matchingProjection }).lean() : [];
    const sharedRequestIds = requests.filter((request) => request.consent?.agentSharing).map((request) => request._id);
    const agentProposals = sharedRequestIds.length ? await AgentMatchProposal.find({ propertyRequest: { $in: sharedRequestIds }, status: { $in: ["proposed", "accepted"] } })
      .sort({ createdAt: -1 })
      .populate({ path: "listing", select: matchingProjection })
      .populate({ path: "agent", select: "name businessName avatar" }).lean() : [];
    const matchesByRequest = {};
    const proposalsByRequest = {};
    for (const match of matches) {
      if (!match.listing) continue;
      const key = String(match.propertyRequest);
      if (!matchesByRequest[key]) matchesByRequest[key] = [];
      if (matchesByRequest[key].length < 4) matchesByRequest[key].push({ ...match.listing, match: { score: match.score, classification: match.classification, reasons: match.reasons } });
    }
    for (const proposal of agentProposals) {
      if (!proposal.listing) continue;
      const key = String(proposal.propertyRequest);
      if (!proposalsByRequest[key]) proposalsByRequest[key] = [];
      proposalsByRequest[key].push({
        _id: proposal._id,
        status: proposal.status,
        classification: proposal.classification,
        message: proposal.message,
        createdAt: proposal.createdAt,
        listing: proposal.listing,
        agent: proposal.agent ? { name: proposal.agent.businessName || proposal.agent.name, avatar: proposal.agent.avatar || "" } : null
      });
    }
    res.json({ success: true, propertyRequests: requests, matchesByRequest, proposalsByRequest });
  } catch (error) { next(error); }
};

exports.getMyRequest = async (req, res, next) => {
  try {
    const propertyRequest = await getOwnedRequest(req.user._id, req.params.id);
    if (!propertyRequest) return res.status(404).json({ message: "Property request not found." });
    const matches = await ListingMatch.find({ propertyRequest: propertyRequest._id, invalidatedAt: null })
      .sort({ score: -1 }).limit(50).populate({
        path: "listing",
        select: matchingProjection
      }).lean();
    res.json({ success: true, propertyRequest, matches: matches.filter((match) => match.listing) });
  } catch (error) { next(error); }
};

exports.matchMyRequest = async (req, res, next) => {
  try {
    const propertyRequest = await getOwnedRequest(req.user._id, req.params.id);
    if (!propertyRequest) return res.status(404).json({ message: "Property request not found." });
    if (!propertyRequest.consent?.matching) return res.status(403).json({ message: "Matching consent is required." });
    if (["closed", "cancelled", "expired"].includes(propertyRequest.status)) return res.status(409).json({ message: "This property request is no longer active." });
    const matches = await generateMatches(propertyRequest);
    res.json({ success: true, count: matches.length, matches });
  } catch (error) { next(error); }
};

exports.closeMyRequest = async (req, res, next) => {
  try {
    const propertyRequest = await getOwnedRequest(req.user._id, req.params.id);
    if (!propertyRequest) return res.status(404).json({ message: "Property request not found." });
    if (["closed", "cancelled", "expired"].includes(propertyRequest.status)) return res.status(409).json({ message: "This property request is already closed." });
    propertyRequest.status = "closed";
    await propertyRequest.save();
    res.json({ success: true, propertyRequest });
  } catch (error) { next(error); }
};
