const User = require("../users/user.model");
const Listing = require("../listings/listings.model");
const Payment = require("../payments/payment.model");
const Subscription = require("../subscriptions/subscription.model");
const sendEmail = require("../../utils/sendEmail");
const { agentInstructionEmail } = require("../../utils/emailTemplates");
const { createOrGrantAgentRole, createResetInvite, sendAgentInvitation } = require("./agentAccount.service");
const { hasRole } = require("../authorization/authorization.service");
const AgentInstruction = require("./agentInstruction.model");
const { recordAdminActivity } = require("../admin/adminActivity.service");
const { recordAuthorizationChange } = require("../authorization/audit.service");
const { withAuthorizationTransaction } = require("../authorization/transaction.service");
const { normalizeServiceAreas } = require("../propertyRequests/agentMarketplace.service");

const LANDLORD_URL = process.env.LANDLORD_URL || "https://landlord.rendahomes.com";
const USER_URL = process.env.USER_URL || "https://user.rendahomes.com";

const agentRoleFilter = () => ({ $or: [{ role: "agent" }, { roles: "agent" }] });
const agentIdFilter = (id) => ({ _id: id, ...agentRoleFilter() });

const referralLinks = (agentCode) => ({
  landlord: `${LANDLORD_URL}/register?agent=${agentCode}`,
  serviceProvider: `${USER_URL}/service-provider/register?agent=${agentCode}`
});

const agentPitchKit = (agentCode) => {
  const links = referralLinks(agentCode);

  const landlordPitch =
    `Hello, I am a RendaHomes agent. You can list 2 properties free on RendaHomes and receive direct tenant inquiries. ` +
    `Use my link to create your landlord account: ${links.landlord}`;

  const followUpPitch =
    `Hi, just following up on RendaHomes. The platform helps landlords publish verified listings, keep control of tenant calls, ` +
    `and upgrade only when the free listing limit is full. Your onboarding link: ${links.landlord}`;

  return {
    landlordPitch,
    followUpPitch,
    whatsappLandlordPitch: `https://wa.me/?text=${encodeURIComponent(landlordPitch)}`,
    quickChecklist: [
      "Ask the landlord for property location, price, purpose, and contact phone.",
      "Ask for clear photos of rooms, exterior, access, and amenities.",
      "Share your referral link and confirm they register through it.",
      "Remind them the first 2 active listings are free.",
      "Encourage paid landlords to complete KYC for stronger trust."
    ]
  };
};

const buildAgentStats = async (agent) => {
  const landlords = await User.find({
    role: "landlord",
    onboardedByAgent: agent._id
  }).populate("subscription", "plan status");

  const landlordIds = landlords.map((landlord) => landlord._id);

  const [approvedLandlords, paidLandlords, propertiesListed, payments] = await Promise.all([
    User.countDocuments({
      _id: { $in: landlordIds },
      subscription: { $ne: null }
    }),
    Subscription.countDocuments({
      user: { $in: landlordIds },
      status: "active",
      plan: { $ne: "normal" }
    }),
    Listing.countDocuments({
      landlord: { $in: landlordIds }
    }),
    Payment.find({
      user: { $in: landlordIds },
      status: "success"
    })
  ]);

  const totalRevenueGenerated = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const commissionEarned = Math.round(totalRevenueGenerated * ((agent.commissionRate || 0) / 100));

  return {
    totalOnboardedLandlords: landlords.length,
    totalOnboardedServiceProviders: 0,
    totalApprovedLandlords: approvedLandlords,
    totalPaidLandlords: paidLandlords,
    totalPropertiesListed: propertiesListed,
    totalRevenueGenerated,
    commissionEarned
  };
};

const buildCommissionBreakdown = async (agent) => {
  const landlords = await User.find({
    role: "landlord",
    onboardedByAgent: agent._id
  }).select("_id name email phone createdAt");

  const landlordIds = landlords.map((landlord) => landlord._id);
  const [subscriptions, payments] = await Promise.all([
    Subscription.find({ user: { $in: landlordIds } }).select("user plan status"),
    Payment.find({ user: { $in: landlordIds }, status: "success" }).select("user amount reference createdAt")
  ]);

  const subscriptionMap = new Map(subscriptions.map((subscription) => [String(subscription.user), subscription]));
  const paymentMap = new Map();

  payments.forEach((payment) => {
    const key = String(payment.user);
    paymentMap.set(key, [...(paymentMap.get(key) || []), payment]);
  });

  return landlords.map((landlord) => {
    const landlordPayments = paymentMap.get(String(landlord._id)) || [];
    const revenue = landlordPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    return {
      landlord: {
        _id: landlord._id,
        name: landlord.name,
        email: landlord.email,
        phone: landlord.phone,
        createdAt: landlord.createdAt
      },
      subscription: subscriptionMap.get(String(landlord._id)) || null,
      revenue,
      commission: Math.round(revenue * ((agent.commissionRate || 0) / 100)),
      payments: landlordPayments
    };
  });
};

const formatAgent = async (agent) => ({
  _id: agent._id,
  fullName: agent.name,
  name: agent.name,
  email: agent.email,
  phone: agent.phone,
  role: agent.role,
  agentCode: agent.agentCode,
  status: agent.agentStatus,
  marketplaceStatus: agent.agentMarketplaceStatus,
  serviceAreas: agent.agentServiceAreas || [],
  commissionRate: agent.commissionRate,
  createdAt: agent.createdAt,
  referralLinks: referralLinks(agent.agentCode),
  pitchKit: agentPitchKit(agent.agentCode),
  commissionBreakdown: await buildCommissionBreakdown(agent),
  stats: await buildAgentStats(agent)
});

exports.createAgent = async (req, res, next) => {
  try {
    const { fullName, name, email, phone, commissionRate = 10 } = req.body;
    const agentName = fullName || name;

    if (!agentName || !email || !phone) {
      return res.status(400).json({ message: "Name, email and phone are required" });
    }
    if (!Number.isFinite(Number(commissionRate)) || Number(commissionRate) < 0 || Number(commissionRate) > 100) return res.status(400).json({ message: "Commission rate must be between 0 and 100." });
    const { agent, setupUrl } = await createOrGrantAgentRole({ name: agentName, email, phone, commissionRate: Number(commissionRate), createdByAdmin: req.user._id });

    await recordAdminActivity({
      eventType: "agent_created",
      description: "Referral agent account created",
      details: `${agent.name} • ${agent.agentCode}`,
      path: "/admin/agents",
      actor: req.user._id,
      actorName: req.user.name,
      readBy: [req.user._id],
      entityType: "agent",
      entityId: String(agent._id)
    });

    let invitationSent = false;
    try {
      await sendAgentInvitation({ agent, setupUrl });
      invitationSent = true;
    } catch (error) { console.error("Agent invitation email failed:", error.message); }

    res.status(201).json({
      success: true,
      message: invitationSent ? "Agent created and invited" : "Agent account created, but the invitation email failed. The agent can use password reset to activate access.",
      invitationSent,
      agent: await formatAgent(agent)
    });
  } catch (error) {
    next(error);
  }
};

exports.resendAgentInvitation = async (req, res, next) => {
  try {
    const agent = await User.findOne(agentIdFilter(req.params.id));
    if (!agent) return res.status(404).json({ message: "Agent not found." });
    const setupUrl = agent.isEmailVerified ? "" : await createResetInvite(agent);
    await sendAgentInvitation({ agent, setupUrl });
    res.json({ success: true, message: "Agent invitation sent." });
  } catch (error) { next(error); }
};

exports.getAgents = async (req, res, next) => {
  try {
    const agents = await User.find(agentRoleFilter()).sort({ createdAt: -1 });
    res.json({
      success: true,
      agents: await Promise.all(agents.map(formatAgent))
    });
  } catch (error) {
    next(error);
  }
};

exports.getAgentById = async (req, res, next) => {
  try {
    const agent = await User.findOne(agentIdFilter(req.params.id));
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    res.json({
      success: true,
      agent: await formatAgent(agent)
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAgent = async (req, res, next) => {
  try {
    const allowedFields = new Set(["fullName", "name", "phone", "commissionRate", "agentMarketplaceStatus", "agentServiceAreas"]);
    if (Object.keys(req.body || {}).some((key) => !allowedFields.has(key))) return res.status(400).json({ message: "Unsupported agent update field." });
    const { fullName, name, phone, commissionRate, agentMarketplaceStatus, agentServiceAreas } = req.body;
    if (agentMarketplaceStatus !== undefined && !["not_enabled", "pending", "approved", "suspended"].includes(agentMarketplaceStatus)) return res.status(400).json({ message: "Choose a valid marketplace status." });
    const normalizedAreas = agentServiceAreas === undefined ? undefined : normalizeServiceAreas(agentServiceAreas);
    const agent = await withAuthorizationTransaction(async (session) => {
      const current = await User.findOne(agentIdFilter(req.params.id)).session(session);
      if (!current) return null;
      const previousMarketplaceStatus = current.agentMarketplaceStatus;
      const previousServiceAreas = current.agentServiceAreas.map((area) => area.toObject());
      if (fullName || name) current.name = fullName || name;
      if (phone) current.phone = phone;
      if (commissionRate !== undefined) current.commissionRate = commissionRate;
      if (agentMarketplaceStatus !== undefined) current.agentMarketplaceStatus = agentMarketplaceStatus;
      if (normalizedAreas !== undefined) current.agentServiceAreas = normalizedAreas;
      if (current.agentMarketplaceStatus === "approved" && (current.agentStatus !== "active" || !current.agentServiceAreas.length)) {
        const error = new Error("An active agent needs at least one approved service area before marketplace approval.");
        error.statusCode = 400;
        throw error;
      }
      await current.save({ session });
      if (agentMarketplaceStatus !== undefined || normalizedAreas !== undefined) {
        await recordAuthorizationChange(req, {
          action: "agent.marketplace_settings_updated",
          resourceType: "agent",
          resourceId: current._id,
          changes: {
            previous: { marketplaceStatus: previousMarketplaceStatus, serviceAreas: previousServiceAreas },
            next: { marketplaceStatus: current.agentMarketplaceStatus, serviceAreas: current.agentServiceAreas.map((area) => area.toObject()) }
          },
          session
        });
      }
      return current;
    });
    if (!agent) return res.status(404).json({ message: "Agent not found" });
    res.json({ success: true, agent: await formatAgent(agent) });
  } catch (error) {
    next(error);
  }
};

exports.suspendAgent = async (req, res, next) => {
  try {
    const agent = await withAuthorizationTransaction(async (session) => {
      const current = await User.findOne(agentIdFilter(req.params.id)).session(session);
      if (!current) return null;
      const previousStatus = current.agentStatus;
      const previousMarketplaceStatus = current.agentMarketplaceStatus;
      current.agentStatus = "suspended";
      current.agentMarketplaceStatus = "suspended";
      await current.save({ session });
      await recordAuthorizationChange(req, { action: "agent.suspended", resourceType: "agent", resourceId: current._id, changes: { previousStatus, previousMarketplaceStatus, status: current.agentStatus, marketplaceStatus: current.agentMarketplaceStatus }, session });
      return current;
    });
    if (!agent) return res.status(404).json({ message: "Agent not found" });
    res.json({ success: true, agent: await formatAgent(agent) });
  } catch (error) {
    next(error);
  }
};

exports.activateAgent = async (req, res, next) => {
  try {
    const agent = await withAuthorizationTransaction(async (session) => {
      const current = await User.findOne(agentIdFilter(req.params.id)).session(session);
      if (!current) return null;
      current.agentStatus = "active";
      await current.save({ session });
      await recordAuthorizationChange(req, { action: "agent.activated", resourceType: "agent", resourceId: current._id, changes: { status: current.agentStatus, marketplaceStatus: current.agentMarketplaceStatus }, session });
      return current;
    });
    if (!agent) return res.status(404).json({ message: "Agent not found" });
    res.json({ success: true, agent: await formatAgent(agent) });
  } catch (error) {
    next(error);
  }
};

exports.getAgentOnboarded = async (req, res, next) => {
  try {
    const agent = await User.findOne(agentIdFilter(req.params.id));
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    const landlords = await User.find({
      role: "landlord",
      onboardedByAgent: agent._id
    })
      .populate("subscription", "plan status currentPeriodEnd")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      landlords,
      stats: await buildAgentStats(agent)
    });
  } catch (error) {
    next(error);
  }
};

exports.createInstruction = async (req, res, next) => {
  try {
    const { title, content, isPublished = true, emailAgents = true } = req.body;
    if (!title || !content) return res.status(400).json({ message: "Title and content are required" });

    const instruction = await AgentInstruction.create({
      title,
      content,
      isPublished,
      createdByAdmin: req.user._id
    });

    if (emailAgents) {
      const agents = await User.find({ ...agentRoleFilter(), agentStatus: "active" }).select("email name");
      await Promise.all(
        agents.map((agent) =>
          sendEmail({
            to: agent.email,
            subject: `RendaHomes agent update: ${title}`,
            html: agentInstructionEmail({
              name: agent.name,
              title,
              content
            })
          }).catch(() => null)
        )
      );
    }

    res.status(201).json({ success: true, instruction });
  } catch (error) {
    next(error);
  }
};

exports.getInstructions = async (req, res, next) => {
  try {
    const filter = hasRole(req.user, "agent") ? { isPublished: true } : {};
    const instructions = await AgentInstruction.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, instructions });
  } catch (error) {
    next(error);
  }
};

exports.getMyAgentProfile = async (req, res, next) => {
  try {
    if (req.user.agentStatus === "suspended") {
      return res.status(403).json({ message: "Your agent account is suspended" });
    }

    res.json({
      success: true,
      agent: await formatAgent(req.user)
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyOnboardedLandlords = async (req, res, next) => {
  try {
    const landlords = await User.find({
      role: "landlord",
      onboardedByAgent: req.user._id
    })
      .populate("subscription", "plan status currentPeriodEnd")
      .sort({ createdAt: -1 });

    const records = await Promise.all(
      landlords.map(async (landlord) => {
        const [listingsCount, payments] = await Promise.all([
          Listing.countDocuments({ landlord: landlord._id }),
          Payment.find({ user: landlord._id, status: "success" })
        ]);

        const revenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        return {
          _id: landlord._id,
          name: landlord.name,
          email: landlord.email,
          phone: landlord.phone,
          createdAt: landlord.createdAt,
          subscription: landlord.subscription,
          listingsCount,
          revenue,
          commission: Math.round(revenue * ((req.user.commissionRate || 0) / 100))
        };
      })
    );

    res.json({ success: true, landlords: records });
  } catch (error) {
    next(error);
  }
};

exports._private = {
  buildAgentStats,
  referralLinks
};
