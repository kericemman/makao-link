const mongoose = require("mongoose");
const Lead = require("./lead.model");
const User = require("../users/user.model");
const Listing = require("../listings/listings.model");
const Inquiry = require("../inquiries/inquiry.model");
const OrganizationMembership = require("../organizations/organizationMembership.model");
const Viewing = require("../viewings/viewing.model");
const { canAccessListing, hasRole } = require("../authorization/authorization.service");
const { withAuthorizationTransaction } = require("../authorization/transaction.service");
const { recordAuthorizationChange } = require("../authorization/audit.service");
const { canTransitionLead } = require("./lead.service");

const populateLead = (query) => query
  .populate("listing", "title price purpose type county town area images availability status organization branch")
  .populate("assignedAgent", "name email role teamRole")
  .populate("customer", "name email phone")
  .populate({ path: "sourceRecord", select: "name email phone message replies status createdAt" });

const scopedListingIds = async (req) => {
  const filter = { landlord: req.landlordOwnerId || req.user._id };
  if (req.landlordOrganization) filter.organization = req.landlordOrganization._id;
  if (req.organizationMembership?.branchIds?.length) filter.branch = { $in: req.organizationMembership.branchIds };
  return Listing.find(filter).distinct("_id");
};

const accessibleLead = async (req, lead) => {
  const listing = await Listing.findById(lead.listing).select("_id landlord organization branch assignedAgent");
  if (req.landlordOrganization && listing?.organization && String(req.landlordOrganization._id) !== String(listing.organization)) return false;
  if (!listing || !await canAccessListing({ user: req.user, listing, permission: "inquiries:read" })) return false;
  const isScopedAgent = req.organizationMembership?.role === "agent" || req.user.teamRole === "agent" || hasRole(req.user, "agent");
  return !isScopedAgent || String(lead.assignedAgent || "") === String(req.user._id) || String(listing.assignedAgent || "") === String(req.user._id);
};

exports.listLeads = async (req, res, next) => {
  try {
    const validStages = new Set(["new", "contacted", "viewing_requested", "viewing_confirmed", "viewed", "application_negotiation", "closed_successful", "closed_unsuccessful"]);
    if (req.query.stage && !validStages.has(req.query.stage)) return res.status(400).json({ message: "Unsupported lead stage." });
    const listingIds = await scopedListingIds(req);
    const filter = { advertiser: req.landlordOwnerId || req.user._id, listing: { $in: listingIds } };
    if (req.user.teamRole === "agent" || req.organizationMembership?.role === "agent" || hasRole(req.user, "agent")) {
      filter.assignedAgent = req.user._id;
    }
    if (req.query.stage) filter.stage = req.query.stage;
    if (req.query.assignedTo === "me") filter.assignedAgent = req.user._id;
    const leads = await populateLead(Lead.find(filter).sort({ updatedAt: -1 }).limit(250));
    res.json({ success: true, leads });
  } catch (error) { next(error); }
};

exports.getLead = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Lead not found." });
    const lead = await Lead.findById(req.params.id);
    if (!lead || !await accessibleLead(req, lead)) return res.status(404).json({ message: "Lead not found." });
    res.json({ success: true, lead: await populateLead(Lead.findById(lead._id)) });
  } catch (error) { next(error); }
};

exports.updateLeadStatus = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Lead not found." });
    const allowed = new Set(["stage", "nextFollowUpAt", "outcomeNote"]);
    if (Object.keys(req.body || {}).some((key) => !allowed.has(key))) return res.status(400).json({ message: "Unsupported lead update field." });
    const lead = await Lead.findById(req.params.id);
    if (!lead || !await accessibleLead(req, lead)) return res.status(404).json({ message: "Lead not found." });
    const stage = req.body.stage;
    if (!canTransitionLead(lead.stage, stage)) return res.status(409).json({ message: "That lead status transition is not allowed." });
    const nextFollowUpAt = req.body.nextFollowUpAt ? new Date(req.body.nextFollowUpAt) : null;
    if (req.body.nextFollowUpAt && (!Number.isFinite(nextFollowUpAt.getTime()) || nextFollowUpAt <= new Date())) return res.status(400).json({ message: "Follow-up time must be in the future." });
    if (String(req.body.outcomeNote || "").length > 1000) return res.status(400).json({ message: "Outcome note is too long." });
    const listing = await Listing.findById(lead.listing).select("organization");
    const updated = await withAuthorizationTransaction(async (session) => {
      const saved = await Lead.findOneAndUpdate({ _id: lead._id, stage: lead.stage, __v: lead.__v || 0 }, {
        $set: { stage, nextFollowUpAt, outcomeNote: String(req.body.outcomeNote || "").trim() }, $inc: { __v: 1 }
      }, { new: true, runValidators: true, session });
      if (!saved) { const error = new Error("Lead changed while processing. Refresh and try again."); error.statusCode = 409; throw error; }
      await recordAuthorizationChange(req, { action: "lead.status_updated", resourceType: "lead", resourceId: saved._id, organization: listing?.organization || req.landlordOrganization?._id || null, changes: { previousStage: lead.stage, stage }, session });
      if (lead.sourceModel === "Inquiry") await Inquiry.updateOne({ _id: lead.sourceRecord }, { $set: { status: stage === "new" ? "new" : ["closed_successful", "closed_unsuccessful"].includes(stage) ? "closed" : "contacted" } }, { session });
      return saved;
    });
    res.json({ success: true, lead: await populateLead(Lead.findById(updated._id)) });
  } catch (error) { next(error); }
};

exports.assignLead = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Lead not found." });
    if (Object.keys(req.body || {}).some((key) => key !== "agentId")) return res.status(400).json({ message: "Only agentId can be assigned." });
    const lead = await Lead.findById(req.params.id);
    if (!lead || !await accessibleLead(req, lead)) return res.status(404).json({ message: "Lead not found." });
    const agentId = req.body.agentId || null;
    if (agentId && !mongoose.isValidObjectId(agentId)) return res.status(400).json({ message: "Choose a valid team member." });
    const listing = await Listing.findById(lead.listing).select("landlord organization branch");
    if (agentId) {
      const validMember = listing.organization
        ? await OrganizationMembership.exists({ organization: listing.organization, user: agentId, status: "active", role: "agent", permissions: "inquiries:read", ...(listing.branch ? { $or: [{ scope: "organization" }, { scope: "branches", branchIds: listing.branch }] } : { scope: "organization" }) })
        : await User.exists({ _id: agentId, landlordOwner: req.landlordOwnerId || req.user._id, role: "landlord_staff", teamRole: "agent", teamStatus: "active" });
      if (!validMember) return res.status(400).json({ message: "Choose an active team member within this property scope." });
    }
    const updated = await withAuthorizationTransaction(async (session) => {
      const saved = await Lead.findOneAndUpdate({ _id: lead._id, assignedAgent: lead.assignedAgent }, { $set: { assignedAgent: agentId } }, { new: true, runValidators: true, session });
      if (!saved) { const error = new Error("Lead changed while processing. Refresh and try again."); error.statusCode = 409; throw error; }
      if (lead.sourceModel === "Inquiry") await Inquiry.updateOne({ _id: lead.sourceRecord }, { $set: { assignedAgent: agentId } }, { session });
      if (lead.viewings?.length) await Viewing.updateMany({ _id: { $in: lead.viewings } }, { $set: { assignedAgent: agentId } }, { session });
      await recordAuthorizationChange(req, { action: "lead.assigned", resourceType: "lead", resourceId: lead._id, organization: listing.organization || req.landlordOrganization?._id || null, changes: { previousAgent: lead.assignedAgent ? String(lead.assignedAgent) : null, assignedAgent: agentId ? String(agentId) : null }, session });
      return saved;
    });
    res.json({ success: true, lead: await populateLead(Lead.findById(updated._id)) });
  } catch (error) { next(error); }
};
