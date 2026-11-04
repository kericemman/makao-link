const crypto = require("crypto");
const User = require("../users/user.model");
const sendEmail = require("../../utils/sendEmail");
const { agentInviteEmail } = require("../../utils/emailTemplates");
const { normalizeKenyanPhone, phoneUniquenessFilter } = require("../../utils/kenyanPhone");

const USER_URL = process.env.USER_URL || "https://user.rendahomes.com";

const buildAgentCode = async (name = "AGENT", session) => {
  const base = String(name).split(/\s+/)[0].replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 10) || "AGENT";
  for (let index = 1; index <= 999; index += 1) {
    const code = `AGT-${base}-${String(index).padStart(3, "0")}`;
    let query = User.exists({ agentCode: code });
    if (session) query = query.session(session);
    if (!await query) return code;
  }
  return `AGT-${base}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
};

const createOrGrantAgentRole = async ({ name, email, phone, createdByAdmin, commissionRate = 10, session }) => {
  const normalizedPhone = normalizeKenyanPhone(phone);
  let query = User.findOne({ email: String(email).trim().toLowerCase() });
  if (session) query = query.session(session);
  let agent = await query;
  let duplicatePhoneQuery = User.exists({
    ...phoneUniquenessFilter(normalizedPhone),
    ...(agent ? { _id: { $ne: agent._id } } : {})
  });
  if (session) duplicatePhoneQuery = duplicatePhoneQuery.session(session);
  if (await duplicatePhoneQuery) throw Object.assign(new Error("This phone number is already linked to another account."), { status: 409 });
  const setupRequired = !agent || agent.isEmailVerified !== true;
  if (!agent) {
    agent = new User({
      name,
      email: String(email).trim().toLowerCase(),
      phone: normalizedPhone,
      password: crypto.randomBytes(32).toString("base64url"),
      role: "agent",
      roles: ["agent"],
      agentCode: await buildAgentCode(name, session),
      agentStatus: "active",
      agentMarketplaceStatus: "not_enabled",
      commissionRate,
      createdByAdmin,
      isEmailVerified: false
    });
  } else {
    agent.name = agent.name || name;
    agent.phone = agent.phone || normalizedPhone;
    agent.roles = [...new Set([...(agent.roles || []), agent.role, "agent"].filter(Boolean))];
    agent.agentCode = agent.agentCode || await buildAgentCode(name, session);
    agent.createdByAdmin = agent.createdByAdmin || createdByAdmin;
    agent.commissionRate = commissionRate;
  }

  if (setupRequired) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    agent.passwordResetToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    agent.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 30);
    await agent.save(session ? { session } : undefined);
    return { agent, setupUrl: `${USER_URL.replace(/\/+$/, "")}/reset-password/${rawToken}` };
  }

  await agent.save(session ? { session } : undefined);
  return { agent, setupUrl: "" };
};

const sendAgentInvitation = async ({ agent, setupUrl }) => {
  const landlordUrl = `${process.env.LANDLORD_URL || "https://landlord.rendahomes.com"}/register?agent=${encodeURIComponent(agent.agentCode)}`;
  await sendEmail({
    to: agent.email,
    subject: "Your RendaHomes agent access",
    html: agentInviteEmail({ name: agent.name, agentCode: agent.agentCode, landlordLink: landlordUrl, loginUrl: `${USER_URL}/login`, setupUrl })
  });
};

const createResetInvite = async (agent) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  agent.passwordResetToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  agent.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 30);
  await agent.save();
  return `${USER_URL.replace(/\/+$/, "")}/reset-password/${rawToken}`;
};

module.exports = { createOrGrantAgentRole, createResetInvite, sendAgentInvitation };
