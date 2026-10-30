const assistantService = require("./rendaAssistant.service");
const { runAssistantTurn } = require("./orchestration/orchestrator.service");
const {
  SESSION_HEADER,
  createMobileSession,
  findMobileConversation,
  getMobileConsentInfo,
  resetMobileSession
} = require("./mobileSession.service");

const getBody = (req) => req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};

const getToken = (req) => String(req.get?.(SESSION_HEADER) || req.headers?.[SESSION_HEADER] || "").trim();

const requireExactKeys = (body, allowed) => Object.keys(body).every((key) => allowed.includes(key));

const getConsent = (req, res, next) => {
  try {
    assistantService.requireEnabled();
    return res.json({ success: true, consent: getMobileConsentInfo() });
  } catch (error) {
    return next(error);
  }
};

const createConversation = async (req, res, next) => {
  try {
    const body = getBody(req);
    if (!requireExactKeys(body, ["consentAccepted"])) {
      return res.status(400).json({ success: false, message: "Invalid request payload." });
    }
    const session = await createMobileSession({ consentAccepted: body.consentAccepted });
    return res.status(201).json({
      success: true,
      conversation: {
        id: session.conversationId,
        sessionToken: session.token,
        expiresAt: session.expiresAt,
        consentPolicyVersion: session.policyVersion
      },
      consent: { text: session.text, privacyUrl: session.privacyUrl, retentionDays: session.retentionDays }
    });
  } catch (error) {
    return next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const body = getBody(req);
    if (!requireExactKeys(body, ["message"]) || typeof body.message !== "string" || !body.message.trim() || body.message.length > 2000) {
      return res.status(400).json({ success: false, message: "Enter a message of up to 2,000 characters." });
    }

    const conversation = await findMobileConversation({ token: getToken(req) });
    if (!conversation) return res.status(401).json({ success: false, code: "ASSISTANT_SESSION_INVALID", message: "Your Ask Renda session expired. Start a new conversation." });

    const inbound = await assistantService.appendMessage({
      conversationId: String(conversation._id),
      direction: "inbound",
      text: body.message
    });
    const result = await runAssistantTurn({
      conversationId: String(conversation._id),
      userText: inbound.message.text,
      mode: "mobile_search"
    });
    await assistantService.appendMessage({
      conversationId: String(conversation._id),
      direction: "outbound",
      text: result.reply
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    return next(error);
  }
};

const resetConversation = async (req, res, next) => {
  try {
    const token = getToken(req);
    const reset = await resetMobileSession({ token });
    if (!reset) return res.status(401).json({ success: false, code: "ASSISTANT_SESSION_INVALID", message: "Your Ask Renda session expired. Start a new conversation." });
    return res.json({ success: true, message: "Ask Renda conversation deleted." });
  } catch (error) {
    return next(error);
  }
};

module.exports = { createConversation, getConsent, sendMessage, resetConversation };
