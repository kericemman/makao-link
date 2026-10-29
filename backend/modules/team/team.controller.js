const crypto = require("crypto");
const User = require("../users/user.model");
const Subscription = require("../subscriptions/subscription.model");
const Listing = require("../listings/listings.model");
const Inquiry = require("../inquiries/inquiry.model");
const TeamDeal = require("./teamDeal.model");
const sendEmail = require("../../utils/sendEmail");
const buildEmailLayout = require("../../utils/emailLayout");

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
    const members = await User.find({ landlordOwner: ownerId, role: "landlord_staff" }).sort({ createdAt: -1 });
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
    const phone = String(req.body.phone || "").trim();
    const teamRole = req.body.role;
    if (!name || !email || !phone || !roleDefaults[teamRole]) {
      return res.status(400).json({ message: "Name, email, phone, and a valid team role are required." });
    }
    if (await User.exists({ email })) {
      return res.status(409).json({ message: "An account with this email already exists." });
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

    res.status(201).json({ success: true, message: "Invitation sent.", member: serializeMember(member) });
  } catch (error) {
    next(error);
  }
};

exports.updateTeamMember = async (req, res, next) => {
  try {
    if (!(await requireAdvancedPlan(req.user._id))) {
      return res.status(403).json({ code: "ADVANCED_PLAN_REQUIRED", message: "Team management is available on active Premium and Pro plans." });
    }
    const member = await User.findOne({ _id: req.params.id, landlordOwner: req.user._id, role: "landlord_staff" });
    if (!member) return res.status(404).json({ message: "Team member not found." });

    if (req.body.role !== undefined) {
      if (!roleDefaults[req.body.role]) return res.status(400).json({ message: "Invalid team role." });
      member.teamRole = req.body.role;
      if (!Array.isArray(req.body.permissions)) member.teamPermissions = roleDefaults[req.body.role];
    }
    if (Array.isArray(req.body.permissions)) {
      member.teamPermissions = [...new Set(req.body.permissions.filter((permission) => allowedPermissions.has(permission)))];
    }
    if (req.body.status !== undefined) {
      if (!["active", "suspended"].includes(req.body.status)) return res.status(400).json({ message: "Invalid team member status." });
      member.teamStatus = req.body.status;
    }
    await member.save();
    res.json({ success: true, member: serializeMember(member) });
  } catch (error) {
    next(error);
  }
};

exports.assignListing = async (req, res, next) => {
  try {
    const memberId = req.body.agentId || null;
    if (memberId && !(await User.exists({ _id: memberId, landlordOwner: req.landlordOwnerId, role: "landlord_staff", teamStatus: "active" }))) {
      return res.status(400).json({ message: "Choose an active agent from this company." });
    }
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.listingId, landlord: req.landlordOwnerId, isDeleted: { $ne: true } },
      { assignedAgent: memberId },
      { new: true }
    ).populate("assignedAgent", "name email teamRole");
    if (!listing) return res.status(404).json({ message: "Property not found." });
    res.json({ success: true, listing });
  } catch (error) {
    next(error);
  }
};

exports.assignInquiry = async (req, res, next) => {
  try {
    const agentId = req.body.agentId || null;
    if (agentId && !(await User.exists({ _id: agentId, landlordOwner: req.landlordOwnerId, role: "landlord_staff", teamStatus: "active" }))) {
      return res.status(400).json({ message: "Choose an active agent from this company." });
    }
    const inquiry = await Inquiry.findOneAndUpdate(
      { _id: req.params.inquiryId, landlord: req.landlordOwnerId },
      { assignedAgent: agentId },
      { new: true }
    ).populate("listing", "title").populate("assignedAgent", "name teamRole");
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found." });
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
    const listing = await Listing.findOne({ _id: listingId, landlord: req.landlordOwnerId, isDeleted: { $ne: true } });
    if (!listing) return res.status(404).json({ message: "Property not found." });
    const expectedOutcome = listing.purpose === "sale" ? "sold" : "rented";
    if (outcome !== expectedOutcome) return res.status(400).json({ message: `This property can only be recorded as ${expectedOutcome}.` });

    const actingAgent = req.user.role === "landlord_staff" && req.user.teamRole === "agent"
      ? req.user._id
      : agentId || listing.assignedAgent || req.user._id;
    if (String(actingAgent) !== String(req.user._id) && !(await User.exists({ _id: actingAgent, landlordOwner: req.landlordOwnerId, role: "landlord_staff", teamStatus: "active" }))) {
      return res.status(400).json({ message: "The selected agent is not an active company member." });
    }
    if (req.user.role === "landlord_staff" && req.user.teamRole === "agent" && String(listing.assignedAgent) !== String(req.user._id)) {
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
    const assignedOnly = req.user.role === "landlord_staff" && req.user.teamRole === "agent";
    const [listings, inquiries, deals, members] = await Promise.all([
      Listing.find({ landlord: req.landlordOwnerId, isDeleted: { $ne: true }, ...(assignedOnly ? { assignedAgent: req.user._id } : {}) }).select("title views status availability purpose assignedAgent createdAt totalUnits availableUnits").populate("assignedAgent", "name"),
      Inquiry.find({ landlord: req.landlordOwnerId, ...(assignedOnly ? { assignedAgent: req.user._id } : {}) }).select("createdAt status assignedAgent").populate("assignedAgent", "name"),
      TeamDeal.find({ landlord: req.landlordOwnerId, closedAt: { $gte: since }, ...(assignedOnly ? { agent: req.user._id } : {}) }).populate("agent", "name teamRole").populate("listing", "title purpose"),
      User.find({ landlordOwner: req.landlordOwnerId, role: "landlord_staff", ...(assignedOnly ? { _id: req.user._id } : {}) }).select("name teamRole")
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
      return { id: member._id, name: member.name, role: member.teamRole, deals: agentDeals.length, inquiries: agentInquiries.length, value: agentDeals.reduce((sum, deal) => sum + deal.amount, 0) };
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
