const crypto = require("node:crypto");
const Conversation = require("./conversation.model");
const Message = require("./message.model");
const assistantService = require("./rendaAssistant.service");

const SESSION_HEADER = "x-renda-assistant-session";
const getConsentText = () => `I agree that RendaHomes and OpenAI may process my messages to help me search public property listings. Messages are retained for up to ${assistantService.getRetentionDays()} days, or until I reset this conversation. I will not share passwords, payment details, or identity documents.`;

const getMobileSessionDays = () => {
  const value = Number(process.env.RENDA_ASSISTANT_MOBILE_SESSION_DAYS || 30);
  return Number.isInteger(value) && value >= 1 && value <= 90 ? value : 30;
};

const getConsentPolicyVersion = () => String(process.env.RENDA_ASSISTANT_MOBILE_CONSENT_POLICY_VERSION || "renda-mobile-v1").trim().slice(0, 40) || "renda-mobile-v1";

const getMobileConsentInfo = () => {
  const publicSite = String(process.env.CLIENT_URL || "https://rendahomes.com").replace(/\/$/, "");
  return {
    text: getConsentText(),
    privacyUrl: `${publicSite}/privacy-policy`,
    policyVersion: getConsentPolicyVersion(),
    retentionDays: assistantService.getRetentionDays()
  };
};

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const createMobileSession = async ({ consentAccepted, now = new Date() } = {}) => {
  assistantService.requireEnabled();
  if (consentAccepted !== true) {
    const error = new Error("Explicit consent is required to start Ask Renda.");
    error.statusCode = 403;
    throw error;
  }

  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const sessionExpiresAt = new Date(now);
  sessionExpiresAt.setDate(sessionExpiresAt.getDate() + getMobileSessionDays());

  const conversation = await Conversation.create({
    channel: "mobile_app",
    externalContactId: `mobile:${tokenHash}`,
    mobileSessionTokenHash: tokenHash,
    mobileSessionExpiresAt: sessionExpiresAt,
    serviceConsent: "granted",
    updatesConsent: "unknown",
    consentSource: "mobile_app",
    consentPolicyVersion: getConsentPolicyVersion(),
    consentRecordedAt: now,
    workflow: assistantService.normalizeWorkflow({ intent: "property_search", step: "search_preferences" }),
    expiresAt: assistantService.expiryFrom(now)
  });

  return {
    token,
    conversationId: String(conversation._id),
    expiresAt: sessionExpiresAt,
    ...getMobileConsentInfo()
  };
};

const findMobileConversation = async ({ token, now = new Date() } = {}) => {
  assistantService.requireEnabled();
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  return Conversation.findOne({
    channel: "mobile_app",
    mobileSessionTokenHash: hashToken(token),
    mobileSessionExpiresAt: { $gt: now },
    expiresAt: { $gt: now }
  });
};

const resetMobileSession = async ({ token, now = new Date() } = {}) => {
  const conversation = await findMobileConversation({ token, now });
  if (!conversation) return false;
  await Message.deleteMany({ conversation: conversation._id, channel: "mobile_app" });
  await Conversation.deleteOne({ _id: conversation._id, channel: "mobile_app", mobileSessionTokenHash: hashToken(token) });
  return true;
};

module.exports = {
  SESSION_HEADER,
  createMobileSession,
  findMobileConversation,
  getMobileConsentInfo,
  getMobileSessionDays,
  hashToken,
  resetMobileSession
};
