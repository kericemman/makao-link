const crypto = require("crypto");
const User = require("../users/user.model");
const Listing = require("../listings/listings.model");
const Payment = require("../payments/payment.model");
const Subscription = require("../subscriptions/subscription.model");
const sendEmail = require("../../utils/sendEmail");
const { agentInviteEmail, agentInstructionEmail } = require("../../utils/emailTemplates");
const AgentInstruction = require("./agentInstruction.model");

const LANDLORD_URL = process.env.LANDLORD_URL || "https://landlord.rendahomes.com";
const USER_URL = process.env.USER_URL || "https://user.rendahomes.com";

const buildAgentCode = async (name = "AGENT") => {
  const base = String(name)
    .split(/\s+/)[0]
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 10) || "AGENT";

  for (let index = 1; index <= 999; index += 1) {
    const code = `AGT-${base}-${String(index).padStart(3, "0")}`;
    const exists = await User.exists({ agentCode: code });
    if (!exists) return code;
  }

  return `AGT-${base}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
};

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
  commissionRate: agent.commissionRate,
  createdAt: agent.createdAt,
  referralLinks: referralLinks(agent.agentCode),
  pitchKit: agentPitchKit(agent.agentCode),
  commissionBreakdown: await buildCommissionBreakdown(agent),
  stats: await buildAgentStats(agent)
});

exports.createAgent = async (req, res, next) => {
  try {
    const { fullName, name, email, phone, password, commissionRate = 10 } = req.body;
    const agentName = fullName || name;

    if (!agentName || !email || !phone || !password) {
      return res.status(400).json({ message: "Name, email, phone and password are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const agentCode = await buildAgentCode(agentName);
    const agent = await User.create({
      name: agentName,
      email,
      phone,
      password,
      role: "agent",
      agentCode,
      agentStatus: "active",
      commissionRate,
      createdByAdmin: req.user._id,
      isEmailVerified: true
    });

    const links = referralLinks(agentCode);

    await sendEmail({
      to: agent.email,
      subject: "Your RendaHomes agent account",
      html: agentInviteEmail({
        name: agent.name,
        agentCode: agent.agentCode,
        password,
        landlordLink: links.landlord,
        loginUrl: `${USER_URL}/login`
      })
    });

    res.status(201).json({
      success: true,
      message: "Agent created and invited",
      agent: await formatAgent(agent)
    });
  } catch (error) {
    next(error);
  }
};

exports.getAgents = async (req, res, next) => {
  try {
    const agents = await User.find({ role: "agent" }).sort({ createdAt: -1 });
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
    const agent = await User.findOne({ _id: req.params.id, role: "agent" });
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
    const agent = await User.findOne({ _id: req.params.id, role: "agent" });
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    const { fullName, name, phone, commissionRate } = req.body;
    if (fullName || name) agent.name = fullName || name;
    if (phone) agent.phone = phone;
    if (commissionRate !== undefined) agent.commissionRate = commissionRate;

    await agent.save();
    res.json({ success: true, agent: await formatAgent(agent) });
  } catch (error) {
    next(error);
  }
};

exports.suspendAgent = async (req, res, next) => {
  try {
    const agent = await User.findOneAndUpdate(
      { _id: req.params.id, role: "agent" },
      { agentStatus: "suspended" },
      { new: true }
    );
    if (!agent) return res.status(404).json({ message: "Agent not found" });
    res.json({ success: true, agent: await formatAgent(agent) });
  } catch (error) {
    next(error);
  }
};

exports.activateAgent = async (req, res, next) => {
  try {
    const agent = await User.findOneAndUpdate(
      { _id: req.params.id, role: "agent" },
      { agentStatus: "active" },
      { new: true }
    );
    if (!agent) return res.status(404).json({ message: "Agent not found" });
    res.json({ success: true, agent: await formatAgent(agent) });
  } catch (error) {
    next(error);
  }
};

exports.getAgentOnboarded = async (req, res, next) => {
  try {
    const agent = await User.findOne({ _id: req.params.id, role: "agent" });
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
      const agents = await User.find({ role: "agent", agentStatus: "active" }).select("email name");
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
    const filter = req.user.role === "agent" ? { isPublished: true } : {};
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
