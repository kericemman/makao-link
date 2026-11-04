const crypto = require("crypto");
const User = require("../users/user.model");
const Subscription = require("../subscriptions/subscription.model");
const Listing = require("../listings/listings.model");
const Inquiry = require("../inquiries/inquiry.model");
const TeamDeal = require("./teamDeal.model");
const OrganizationMembership = require("../organizations/organizationMembership.model");
const { hasRole } = require("../authorization/authorization.service");
const sendEmail = require("../../utils/sendEmail");
const buildEmailLayout = require("../../utils/emailLayout");
const { ensureLegacyWorkspaceMembership } = require("../organizations/legacyWorkspace.service");
const { recordAuthorizationChange } = require("../authorization/audit.service");
const { normalizeKenyanPhone, phoneUniquenessFilter } = require("../../utils/kenyanPhone");
const { withAuthorizationTransaction } = require("../authorization/transaction.service");
const Lead = require("../leads/lead.model");

const roleDefaults = {
  manager: ["listings", "inquiries", "team", "reports", "deals"],
  agent: ["listings", "inquiries", "reports", "deals"],
  viewer: ["listings", "inquiries", "reports"]
};
const allowedPermissions = new Set(["listings", "inquiries", "team", "reports", "deals"]);

const requireAdvancedPlan = async (ownerId) => {
  const subscription = await Subscription.findOne({ user: ownerId });
  return Boolean(subscription && ["premium", "pro"].includes(subscription.plan) && subscription.status === "active");
};

const serializeMember = (member) => ({
  _id: member._id,
  name: member.name,
  email: member.email,
  phone: member.phone,
  role: member.teamRole,
  permissions: member.teamPermissions,
  status: member.teamStatus,
  createdAt: member.createdAt,
  lastLoginAt: member.lastLoginAt || null
});

exports.getTeam = async (req, res, next) => {
  try {
    const ownerId = req.landlordOwnerId || req.user._id;
    if (!(await requireAdvancedPlan(ownerId))) {
      return res.status(403).json({ code: "ADVANCED_PLAN_REQUIRED", message: "Team management is available on active Premium and Pro plans." });
    }
    let memberFilter = { landlordOwner: ownerId, role: "landlord_staff" };
    if (req.organizationMembership?.scope === "branches") {
      const scopedMemberIds = await OrganizationMembership.find({
        organization: req.landlordOrganization._id,
        status: "active",
        $or: [{ scope: "organization" }, { scope: "branches", branchIds: { $in: req.organizationMembership.branchIds } }]
      }).distinct("user");
      memberFilter._id = { $in: scopedMemberIds };
    }
    const members = await User.find(memberFilter).sort({ createdAt: -1 });
    res.json({ success: true, members: members.map(serializeMember) });
  } catch (error) {
    next(error);
  }
};

exports.inviteTeamMember = async (req, res, next) => {
  try {
    if (!(await requireAdvancedPlan(req.user._id))) {
      return res.status(403).json({ code: "ADVANCED_PLAN_REQUIRED", message: "Team management is available on active Premium and Pro plans." });
    }

    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    let phone;
    try {
      phone = normalizeKenyanPhone(req.body.phone);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
    const teamRole = req.body.role;
    if (!name || !email || !phone || !roleDefaults[teamRole]) {
      return res.status(400).json({ message: "Name, email, phone, and a valid team role are required." });
    }
    if (await User.exists({ email })) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    if (await User.exists(phoneUniquenessFilter(phone))) {
      return res.status(409).json({ message: "This phone number is already linked to an account." });
    }

    const permissions = Array.isArray(req.body.permissions)
      ? [...new Set(req.body.permissions.filter((permission) => allowedPermissions.has(permission)))]
      : roleDefaults[teamRole];
    const rawToken = crypto.randomBytes(32).toString("hex");
    const passwordResetToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const member = await User.create({
      name,
      email,
      phone,
      password: crypto.randomBytes(32).toString("hex"),
      role: "landlord_staff",
      landlordOwner: req.user._id,
      teamRole,
      teamPermissions: permissions,
      teamStatus: "active",
      isEmailVerified: true,
      passwordResetToken,
      passwordResetExpires: new Date(Date.now() + 1000 * 60 * 60 * 24)
    });

    const portalUrl = process.env.LANDLORD_CLIENT_URL || "https://landlord.rendahomes.com";
    const resetUrl = `${portalUrl}/reset-password/${rawToken}`;
    try {
      await sendEmail({
        to: member.email,
        subject: "Your company invited you to RendaHomes",
        html: buildEmailLayout({
          title: "You have a RendaHomes workspace invitation",
          greeting: `Hello ${member.name}`,
          intro: `${req.user.businessName || req.user.name} invited you to manage properties in its RendaHomes workspace as a ${teamRole}.`,
          body: "<p>Set a password to accept the invitation. The secure link expires in 24 hours.</p>",
          ctaText: "Set password and sign in",
          ctaUrl: resetUrl,
          footerNote: "If you were not expecting this invitation, you can ignore this email."
        })
      });
    } catch (error) {
      await User.deleteOne({ _id: member._id });
      throw error;
    }

    try {
      await withAuthorizationTransaction(async (session) => {
        const organization = await ensureLegacyWorkspaceMembership(req.user, member, session);
        await recordAuthorizationChange(req, { action: "organization.member_invited", resourceType: "organization_membership", resourceId: `${organization._id}:${member._id}`, organization: organization._id, changes: { memberId: String(member._id), role: teamRole, permissions }, session });
      });
    } catch (error) {
      await User.deleteOne({ _id: member._id });
      throw error;
    }

    res.status(201).json({ success: true, message: "Invitation sent.", member: serializeMember(member) });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.phoneCanonical) {
      return res.status(409).json({ message: "This phone number is already linked to an account." });
    }
    next(error);
  }
};

exports.updateTeamMember = async (req, res, next) => {
  try {
    if (!(await requireAdvancedPlan(req.user._id))) {
      return res.status(403).json({ code: "ADVANCED_PLAN_REQUIRED", message: "Team management is available on active Premium and Pro plans." });
    }
    if (req.body.role !== undefined && !roleDefaults[req.body.role]) return res.status(400).json({ message: "Invalid team role." });
    if (req.body.status !== undefined && !["active", "suspended"].includes(req.body.status)) return res.status(400).json({ message: "Invalid team member status." });
    const member = await withAuthorizationTransaction(async (session) => {
      const target = await User.findOne({ _id: req.params.id, landlordOwner: req.user._id, role: "landlord_staff" }).session(session);
      if (!target) return null;
      if (req.body.role !== undefined) {
        target.teamRole = req.body.role;
        if (!Array.isArray(req.body.permissions)) target.teamPermissions = roleDefaults[req.body.role];
      }
      if (Array.isArray(req.body.permissions)) target.teamPermissions = [...new Set(req.body.permissions.filter((permission) => allowedPermissions.has(permission)))];
      if (req.body.status !== undefined) target.teamStatus = req.body.status;
      await target.save({ session });
      const owner = await User.findById(req.user._id).session(session);
      const organization = await ensureLegacyWorkspaceMembership(owner, target, session);
      await recordAuthorizationChange(req, { action: "organization.member_updated", resourceType: "organization_membership", resourceId: `${organization._id}:${target._id}`, organization: organization._id, changes: { memberId: String(target._id), role: target.teamRole, permissions: target.teamPermissions, status: target.teamStatus }, session });
      return target;
    });
    if (!member) return res.status(404).json({ message: "Team member not found." });
    res.json({ success: true, member: serializeMember(member) });
  } catch (error) {
    next(error);
  }
};

exports.assignListing = async (req, res, next) => {
  try {
    const memberId = req.body.agentId || null;
    const listing = await Listing.findOne({ _id: req.params.listingId, landlord: req.landlordOwnerId, ...(req.landlordOrganization ? { organization: req.landlordOrganization._id } : {}), ...(req.organizationMembership?.branchIds?.length ? { branch: { $in: req.organizationMembership.branchIds } } : {}), isDeleted: { $ne: true } });
    if (!listing) return res.status(404).json({ message: "Property not found." });
    const validMember = !memberId || (req.landlordOrganization
      ? await OrganizationMembership.exists({ organization: req.landlordOrganization._id, user: memberId, status: "active", ...(listing.branch ? { $or: [{ scope: "organization" }, { scope: "branches", branchIds: listing.branch }] } : { scope: "organization" }) })
      : await User.exists({ _id: memberId, landlordOwner: req.landlordOwnerId, role: "landlord_staff", teamStatus: "active" }));
    if (!validMember) {
      return res.status(400).json({ message: "Choose an active agent from this company." });
    }
    await withAuthorizationTransaction(async (session) => {
      listing.assignedAgent = memberId;
      await listing.save({ session });
      await recordAuthorizationChange(req, { action: "listing.agent_assigned", resourceType: "listing", resourceId: listing._id, organization: listing.organization, changes: { assignedAgent: memberId ? String(memberId) : null }, session });
    });
    await listing.populate("assignedAgent", "name email teamRole");
    res.json({ success: true, listing });
  } catch (error) {
    next(error);
  }
};

exports.assignInquiry = async (req, res, next) => {
  try {
    const agentId = req.body.agentId || null;
    const validMember = !agentId || (req.landlordOrganization
      ? await OrganizationMembership.exists({ organization: req.landlordOrganization._id, user: agentId, status: "active", ...(req.organizationMembership?.scope === "branches" ? { $or: [{ scope: "organization" }, { scope: "branches", branchIds: { $in: req.organizationMembership.branchIds } }] } : {}) })
      : await User.exists({ _id: agentId, landlordOwner: req.landlordOwnerId, role: "landlord_staff", teamStatus: "active" }));
    if (!validMember) {
      return res.status(400).json({ message: "Choose an active agent from this company." });
    }
    const listingIds = req.landlordOrganization ? await Listing.find({ organization: req.landlordOrganization._id, ...(req.organizationMembership?.branchIds?.length ? { branch: { $in: req.organizationMembership.branchIds } } : {}) }).distinct("_id") : null;
    const inquiry = await withAuthorizationTransaction(async (session) => {
      const updated = await Inquiry.findOneAndUpdate(
        { _id: req.params.inquiryId, landlord: req.landlordOwnerId, ...(listingIds ? { listing: { $in: listingIds } } : {}) },
        { assignedAgent: agentId },
        { new: true, session }
      );
      if (updated) {
        await Lead.updateOne({ sourceModel: "Inquiry", sourceRecord: updated._id }, { $set: { assignedAgent: agentId } }, { session });
        await recordAuthorizationChange(req, { action: "inquiry.agent_assigned", resourceType: "inquiry", resourceId: updated._id, organization: req.landlordOrganization?._id || null, changes: { assignedAgent: agentId ? String(agentId) : null }, session });
      }
      return updated;
    });
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found." });
    await inquiry.populate("listing", "title");
    await inquiry.populate("assignedAgent", "name teamRole");
    res.json({ success: true, inquiry });
  } catch (error) {
    next(error);
  }
};

exports.recordDeal = async (req, res, next) => {
  try {
    const { listingId, agentId, outcome, amount, closedAt, notes } = req.body;
    if (!listingId || !["rented", "sold"].includes(outcome) || !Number.isFinite(Number(amount)) || Number(amount) < 0) {
      return res.status(400).json({ message: "Property, deal outcome, and a valid deal amount are required." });
    }
    const listing = await Listing.findOne({ _id: listingId, landlord: req.landlordOwnerId, ...(req.landlordOrganization ? { organization: req.landlordOrganization._id } : {}), ...(req.organizationMembership?.branchIds?.length ? { branch: { $in: req.organizationMembership.branchIds } } : {}), isDeleted: { $ne: true } });
    if (!listing) return res.status(404).json({ message: "Property not found." });
    const expectedOutcome = listing.purpose === "sale" ? "sold" : "rented";
    if (outcome !== expectedOutcome) return res.status(400).json({ message: `This property can only be recorded as ${expectedOutcome}.` });

    const assignedOnly = hasRole(req.user, "landlord_staff") && req.user.teamRole === "agent" || req.organizationMembership?.role === "agent";
    const actingAgent = assignedOnly
      ? req.user._id
      : agentId || listing.assignedAgent || req.user._id;
    const activeAgent = req.landlordOrganization
      ? await OrganizationMembership.exists({ organization: req.landlordOrganization._id, user: actingAgent, status: "active" })
      : await User.exists({ _id: actingAgent, landlordOwner: req.landlordOwnerId, role: "landlord_staff", teamStatus: "active" });
    if (String(actingAgent) !== String(req.user._id) && !activeAgent) {
      return res.status(400).json({ message: "The selected agent is not an active company member." });
    }
    if (assignedOnly && String(listing.assignedAgent) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only record a deal for a property assigned to you." });
    }

    const units = Math.max(1, Math.floor(Number(req.body.units) || 1));
    if (units > Math.max(0, Number(listing.availableUnits) || 0)) {
      return res.status(409).json({ message: `Only ${listing.availableUnits} units remain available in this category.` });
    }
    const deal = await TeamDeal.create({
      landlord: req.landlordOwnerId,
      listing: listing._id,
      agent: actingAgent,
      outcome,
      units,
      amount: Number(amount),
      closedAt: closedAt ? new Date(closedAt) : new Date(),
      notes: String(notes || "").trim()
    });
    listing.availableUnits = Math.max(0, (Number(listing.availableUnits) || 1) - units);
    if (listing.availableUnits === 0) {
      listing.availability = "taken";
      listing.isActive = false;
      listing.unlistReason = "taken";
    }
    await listing.save();
    const populated = await TeamDeal.findById(deal._id)
      .populate("listing", "title purpose price portfolioName portfolioCategory")
      .populate("agent", "name email teamRole");
    res.status(201).json({ success: true, deal: populated });
  } catch (error) {
    next(error);
  }
};

exports.getTeamReports = async (req, res, next) => {
  try {
    const since = new Date();
    since.setMonth(since.getMonth() - 5);
    const assignedOnly = hasRole(req.user, "landlord_staff") && req.user.teamRole === "agent" || req.organizationMembership?.role === "agent";
    const listingFilter = {
      landlord: req.landlordOwnerId,
      isDeleted: { $ne: true },
      ...(req.landlordOrganization ? { organization: req.landlordOrganization._id } : {}),
      ...(req.organizationMembership?.branchIds?.length ? { branch: { $in: req.organizationMembership.branchIds } } : {}),
      ...(assignedOnly ? { assignedAgent: req.user._id } : {})
    };
    const scopedListingIds = await Listing.find(listingFilter).distinct("_id");
    const memberUserIds = req.landlordOrganization
      ? await OrganizationMembership.find({
        organization: req.landlordOrganization._id,
        status: "active",
        ...(req.organizationMembership?.scope === "branches" ? { branchIds: { $in: req.organizationMembership.branchIds } } : {}),
        ...(assignedOnly ? { user: req.user._id } : {})
      }).distinct("user")
      : null;
    const [listings, inquiries, deals, members] = await Promise.all([
      Listing.find({ ...listingFilter }).select("title views status availability purpose assignedAgent createdAt totalUnits availableUnits").populate("assignedAgent", "name"),
      Inquiry.find({ landlord: req.landlordOwnerId, listing: { $in: scopedListingIds }, ...(assignedOnly ? { assignedAgent: req.user._id } : {}) }).select("createdAt status assignedAgent").populate("assignedAgent", "name"),
      TeamDeal.find({ landlord: req.landlordOwnerId, listing: { $in: scopedListingIds }, closedAt: { $gte: since }, ...(assignedOnly ? { agent: req.user._id } : {}) }).populate("agent", "name teamRole").populate("listing", "title purpose"),
      memberUserIds
        ? User.find({ _id: { $in: memberUserIds } }).select("name teamRole role")
        : User.find({ landlordOwner: req.landlordOwnerId, role: "landlord_staff", ...(assignedOnly ? { _id: req.user._id } : {}) }).select("name teamRole role")
    ]);
    const monthly = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (5 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthDeals = deals.filter((deal) => {
        const closedAt = new Date(deal.closedAt);
        return closedAt.getFullYear() === date.getFullYear() && closedAt.getMonth() === date.getMonth();
      });
      const monthInquiries = inquiries.filter((inquiry) => {
        const createdAt = new Date(inquiry.createdAt);
        return createdAt.getFullYear() === date.getFullYear() && createdAt.getMonth() === date.getMonth();
      }).length;
      return { key, label: new Intl.DateTimeFormat("en", { month: "short" }).format(date), deals: monthDeals.length, inquiries: monthInquiries, value: monthDeals.reduce((sum, deal) => sum + deal.amount, 0) };
    });
    const byAgent = members.map((member) => {
      const agentDeals = deals.filter((deal) => String(deal.agent?._id) === String(member._id));
      const agentInquiries = inquiries.filter((inquiry) => String(inquiry.assignedAgent?._id) === String(member._id));
      return { id: member._id, name: member.name, role: member.teamRole || member.role, deals: agentDeals.length, inquiries: agentInquiries.length, value: agentDeals.reduce((sum, deal) => sum + deal.amount, 0) };
    });
    res.json({
      success: true,
      summary: {
        listingViews: listings.reduce((sum, listing) => sum + (Number(listing.views) || 0), 0),
        inquiries: inquiries.length,
        activeListings: listings.filter((listing) => listing.isActive && listing.availability === "available").length,
        deals: deals.length,
        dealValue: deals.reduce((sum, deal) => sum + deal.amount, 0),
        availableUnits: listings.reduce((sum, listing) => sum + (Number(listing.availableUnits) || 0), 0)
      },
      monthly,
      byAgent,
      recentDeals: deals.sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt)).slice(0, 12)
    });
  } catch (error) {
    next(error);
  }
};
