const assistantService = require("./rendaAssistant.service");
const Message = require("./message.model");
const { runAssistantTurn } = require("./orchestration/orchestrator.service");
const { COOKIE_NAME, createWebSession, findWebConversation, getConsentInfo, resetWebSession } = require("./webSession.service");

const cookieToken = (req) => {
  const cookie = String(req.headers?.cookie || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return "";
  try { return decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1)); } catch { return ""; }
};
const getBody = (req) => req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
const onlyKeys = (body, allowed) => Object.keys(body).every((key) => allowed.includes(key));
const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/renda-assistant/web",
  ...(maxAge ? { maxAge } : {})
});

const getConsent = (req, res, next) => {
  try {
    assistantService.requireEnabled();
    return res.json({ success: true, consent: getConsentInfo() });
  } catch (error) { return next(error); }
};

const getCurrentConversation = async (req, res, next) => {
  try {
    const conversation = await findWebConversation({ token: cookieToken(req) });
    if (!conversation || conversation.consentPolicyVersion !== getConsentInfo().policyVersion) {
      return res.json({ success: true, consent: getConsentInfo(), active: false });
    }
    const messages = await Message.find({ conversation: conversation._id, channel: "web" })
      .sort({ sequence: 1 }).limit(40).select("direction text createdAt").lean();
    return res.json({ success: true, consent: getConsentInfo(), active: true, messages: messages.map(({ direction, text, createdAt }) => ({ direction, text, createdAt })) });
  } catch (error) { return next(error); }
};

const createConversation = async (req, res, next) => {
  try {
    const body = getBody(req);
    if (!onlyKeys(body, ["consentAccepted"])) return res.status(400).json({ success: false, message: "Invalid request payload." });
    const session = await createWebSession({ consentAccepted: body.consentAccepted });
    res.cookie(COOKIE_NAME, session.token, cookieOptions(Math.max(0, session.expiresAt.getTime() - Date.now())));
    return res.status(201).json({
      success: true,
      conversation: { id: session.conversationId, expiresAt: session.expiresAt, consentPolicyVersion: session.policyVersion },
      consent: { text: session.text, privacyUrl: session.privacyUrl, retentionDays: session.retentionDays }
    });
  } catch (error) { return next(error); }
};

const sendMessage = async (req, res, next) => {
  try {
    const body = getBody(req);
    if (!onlyKeys(body, ["message"]) || typeof body.message !== "string" || !body.message.trim() || body.message.length > 2000) {
      return res.status(400).json({ success: false, message: "Enter a message of up to 2,000 characters." });
    }
    const conversation = await findWebConversation({ token: cookieToken(req) });
    if (!conversation || conversation.consentPolicyVersion !== getConsentInfo().policyVersion) {
      return res.status(401).json({ success: false, code: "ASSISTANT_SESSION_INVALID", message: "Your Ask Renda session expired. Start a new conversation." });
    }
    const inbound = await assistantService.appendMessage({ conversationId: String(conversation._id), direction: "inbound", text: body.message });
    const result = await runAssistantTurn({ conversationId: String(conversation._id), userText: inbound.message.text, mode: "website_search" });
    await assistantService.appendMessage({ conversationId: String(conversation._id), direction: "outbound", text: result.reply });
    return res.json({ success: true, ...result });
  } catch (error) { return next(error); }
};

const resetConversation = async (req, res, next) => {
  try {
    const reset = await resetWebSession({ token: cookieToken(req) });
    res.clearCookie(COOKIE_NAME, cookieOptions());
    if (!reset) return res.status(401).json({ success: false, code: "ASSISTANT_SESSION_INVALID", message: "Your Ask Renda session expired. Start a new conversation." });
    return res.json({ success: true, message: "Ask Renda conversation deleted." });
  } catch (error) { return next(error); }
};

module.exports = { createConversation, getConsent, getCurrentConversation, resetConversation, sendMessage };
