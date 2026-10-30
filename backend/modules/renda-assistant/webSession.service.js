const crypto = require("node:crypto");
const Conversation = require("./conversation.model");
const Message = require("./message.model");
const assistantService = require("./rendaAssistant.service");

const COOKIE_NAME = "renda_assistant_web_session";
const getConsentText = () => `I agree that RendaHomes and OpenAI may process my messages to help me search public property listings. Messages are retained for up to ${assistantService.getRetentionDays()} days, or until I reset this conversation. I will not share passwords, payment details, or identity documents.`;
const getSessionDays = () => {
  const days = Number(process.env.RENDA_ASSISTANT_WEB_SESSION_DAYS || 30);
  return Number.isInteger(days) && days >= 1 && days <= 90 ? days : 30;
};
const getPolicyVersion = () => String(process.env.RENDA_ASSISTANT_WEB_CONSENT_POLICY_VERSION || "renda-web-v1").trim().slice(0, 40) || "renda-web-v1";
const getConsentInfo = () => {
  const publicSite = String(process.env.CLIENT_URL || "https://rendahomes.com").replace(/\/$/, "");
  return {
    text: getConsentText(),
    privacyUrl: `${publicSite}/privacy-policy`,
    policyVersion: getPolicyVersion(),
    retentionDays: assistantService.getRetentionDays()
  };
};
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const createWebSession = async ({ consentAccepted, now = new Date() } = {}) => {
  assistantService.requireEnabled();
  if (consentAccepted !== true) {
    const error = new Error("Explicit assistant service consent is required");
    error.statusCode = 403;
    throw error;
  }
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + getSessionDays());
  const conversation = await Conversation.create({
    channel: "web",
    externalContactId: `web:${tokenHash}`,
    webSessionTokenHash: tokenHash,
    webSessionExpiresAt: expiresAt,
    serviceConsent: "granted",
    updatesConsent: "unknown",
    consentSource: "web",
    consentPolicyVersion: getPolicyVersion(),
    consentRecordedAt: now,
    workflow: assistantService.normalizeWorkflow({ intent: "property_search", step: "search_preferences" }),
    expiresAt: assistantService.expiryFrom(now)
  });
  return { token, conversationId: String(conversation._id), expiresAt, ...getConsentInfo() };
};

const findWebConversation = async ({ token, now = new Date() } = {}) => {
  assistantService.requireEnabled();
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  return Conversation.findOne({
    channel: "web",
    webSessionTokenHash: hashToken(token),
    webSessionExpiresAt: { $gt: now },
    expiresAt: { $gt: now }
  });
};

const resetWebSession = async ({ token, now = new Date() } = {}) => {
  const conversation = await findWebConversation({ token, now });
  if (!conversation) return false;
  await Message.deleteMany({ conversation: conversation._id, channel: "web" });
  await Conversation.deleteOne({ _id: conversation._id, channel: "web", webSessionTokenHash: hashToken(token) });
  return true;
};

module.exports = { COOKIE_NAME, createWebSession, findWebConversation, getConsentInfo, getSessionDays, hashToken, resetWebSession };
