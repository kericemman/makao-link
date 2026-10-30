const Conversation = require("./conversation.model");
const Message = require("./message.model");
const Handoff = require("./handoff.model");

const DEFAULT_RETENTION_DAYS = 90;
const MAX_MESSAGE_LENGTH = 4000;
const ALLOWED_INTENTS = new Set(["unknown", "property_search", "list_property", "support"]);
const ALLOWED_CONSENT_SOURCES = new Set(["user_message", "web", "mobile_app"]);

class AssistantDisabledError extends Error {
  constructor() {
    super("Renda Assistant is disabled");
    this.name = "AssistantDisabledError";
    this.statusCode = 503;
  }
}

class ConversationConflictError extends Error {
  constructor() {
    super("Conversation state changed; reload before retrying");
    this.name = "ConversationConflictError";
    this.statusCode = 409;
  }
}

class HumanHandoffActiveError extends Error {
  constructor() {
    super("A RendaHomes support handoff is active for this conversation");
    this.name = "HumanHandoffActiveError";
    this.statusCode = 409;
  }
}

const isEnabled = () => process.env.RENDA_ASSISTANT_ENABLED === "true";

const requireEnabled = () => {
  if (!isEnabled()) throw new AssistantDisabledError();
};

const getRetentionDays = () => {
  const value = Number(process.env.RENDA_ASSISTANT_RETENTION_DAYS || DEFAULT_RETENTION_DAYS);
  return Number.isInteger(value) && value >= 7 && value <= 365 ? value : DEFAULT_RETENTION_DAYS;
};

const expiryFrom = (date) => {
  const expiresAt = new Date(date);
  expiresAt.setDate(expiresAt.getDate() + getRetentionDays());
  return expiresAt;
};

const redactSensitiveText = (value) => String(value || "")
  .slice(0, MAX_MESSAGE_LENGTH)
  .replace(/\b(?:password|passcode|pin|otp|one[- ]time code|verification code)\s*(?:is|[:=])?\s*[^\s,;]+/gi, "[REDACTED]")
  .replace(/\b(?:national\s+)?id(?:\s+number|\s+no\.?|\s*#)?\s*[:=-]?\s*[A-Z0-9-]{5,}\b/gi, "[REDACTED]")
  .replace(/\bpassport(?:\s+(?:number|no\.?))?\s*[:=-]?\s*[A-Z0-9]{6,}\b/gi, "[REDACTED]")
  .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED EMAIL]")
  .replace(/(?<!\w)(?:\+?254[\s-]?(?:1|7)|0(?:1|7))(?:[\s-]?\d){8}(?!\w)/g, "[REDACTED PHONE]")
  .replace(/\b(?:\d[ -]*?){13,19}\b/g, "[REDACTED]")
  .trim();

const normalizeWorkflow = (value = {}) => {
  if (!ALLOWED_INTENTS.has(value.intent || "unknown")) throw new TypeError("Invalid workflow intent");
  const search = value.search || {};
  const purpose = search.purpose || "";
  if (!["", "rent", "sale", "short_term"].includes(purpose)) throw new TypeError("Invalid search purpose");

  const numberOrNull = (number, name, max = Number.MAX_SAFE_INTEGER, integer = false) => {
    if (number === undefined || number === null || number === "") return null;
    const parsed = Number(number);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > max || (integer && !Number.isInteger(parsed))) {
      throw new TypeError(`Invalid ${name}`);
    }
    return parsed;
  };
  const minPrice = numberOrNull(search.minPrice, "minimum price");
  const maxPrice = numberOrNull(search.maxPrice, "maximum price");
  if (minPrice !== null && maxPrice !== null && maxPrice < minPrice) throw new TypeError("Maximum price cannot be below minimum price");

  return {
    intent: value.intent || "unknown",
    step: String(value.step || "welcome").trim().slice(0, 60) || "welcome",
    search: {
      purpose,
      propertyType: String(search.propertyType || "").trim().slice(0, 60),
      county: String(search.county || "").trim().slice(0, 80),
      town: String(search.town || "").trim().slice(0, 80),
      minPrice,
      maxPrice,
      bedrooms: numberOrNull(search.bedrooms, "bedrooms", 30, true)
    }
  };
};

const createOrLoadConversation = async ({ externalContactId, now = new Date() }) => {
  requireEnabled();
  const contactId = String(externalContactId || "").trim();
  if (!contactId || contactId.length > 160) throw new TypeError("A valid external contact ID is required");

  let conversation = await Conversation.findOne({ channel: "whatsapp", externalContactId: contactId });
  if (conversation && conversation.expiresAt <= now) {
    conversation = await Conversation.findOneAndUpdate(
      { _id: conversation._id, expiresAt: { $lte: now } },
      {
        $set: {
          linkedUser: null,
          contactName: "",
          contactEmail: "",
          accountLinkStatus: "unlinked",
          linkChallengeHash: null,
          linkChallengeExpiresAt: null,
          serviceConsent: "unknown",
          updatesConsent: "unknown",
          consentSource: "",
          consentPolicyVersion: "",
          consentRecordedAt: null,
          workflow: normalizeWorkflow(),
          workflowRevision: 0,
          handoffStatus: "none",
          handoffReason: "",
          handoffRequestedAt: null,
          lastMessageAt: null,
          expiresAt: expiryFrom(now)
        }
      },
      { new: true }
    );
    if (conversation) return conversation;
  }
  if (conversation) return conversation;

  try {
    return await Conversation.findOneAndUpdate(
      { channel: "whatsapp", externalContactId: contactId },
      {
        $setOnInsert: {
          channel: "whatsapp",
          externalContactId: contactId,
          expiresAt: expiryFrom(now)
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
    return Conversation.findOne({ channel: "whatsapp", externalContactId: contactId });
  }
};

const appendMessage = async ({ conversationId, direction, text, providerEventId, providerMessageId, now = new Date() }) => {
  requireEnabled();
  if (!["inbound", "outbound", "system"].includes(direction)) throw new TypeError("Invalid message direction");
  const safeText = redactSensitiveText(text);
  if (!safeText) throw new TypeError("Message text is required");
  for (const [name, id] of [["provider event ID", providerEventId], ["provider message ID", providerMessageId]]) {
    if (id !== undefined && id !== null && String(id).length > 200) throw new TypeError(`Invalid ${name}`);
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new ConversationConflictError();

  if (providerEventId) {
    const existing = await Message.findOne({ channel: conversation.channel, providerEventId: String(providerEventId) });
    if (existing) return { message: existing, duplicate: true };
  }

  const updatedConversation = await Conversation.findOneAndUpdate(
    { _id: conversationId },
    {
      $inc: { messageSequence: 1 },
      $set: { lastMessageAt: now, expiresAt: expiryFrom(now) }
    },
    { new: true }
  );
  if (!updatedConversation) throw new ConversationConflictError();

  try {
    const message = await Message.create({
      conversation: updatedConversation._id,
      channel: updatedConversation.channel,
      sequence: updatedConversation.messageSequence,
      direction,
      text: safeText,
      providerEventId: providerEventId ? String(providerEventId).slice(0, 200) : undefined,
      providerMessageId: providerMessageId ? String(providerMessageId).slice(0, 200) : undefined,
      deliveryStatus: direction === "inbound" ? "received" : direction === "outbound" ? ["mobile_app", "web"].includes(updatedConversation.channel) ? "sent" : "queued" : "sent",
      statusTimestamps: direction === "system" || (direction === "outbound" && ["mobile_app", "web"].includes(updatedConversation.channel)) ? { sentAt: now } : {},
      expiresAt: expiryFrom(now)
    });
    return { message, duplicate: false };
  } catch (error) {
    if (error?.code !== 11000 || !providerEventId) throw error;
    const existing = await Message.findOne({ channel: updatedConversation.channel, providerEventId: String(providerEventId) });
    if (!existing) throw error;
    return { message: existing, duplicate: true };
  }
};

const updateWorkflow = async ({ conversationId, expectedRevision, workflow, now = new Date() }) => {
  requireEnabled();
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0) throw new TypeError("A valid workflow revision is required");
  const updated = await Conversation.findOneAndUpdate(
    { _id: conversationId, workflowRevision: expectedRevision },
    {
      $set: { workflow: normalizeWorkflow(workflow), expiresAt: expiryFrom(now) },
      $inc: { workflowRevision: 1 }
    },
    { new: true, runValidators: true }
  );
  if (!updated) throw new ConversationConflictError();
  return updated;
};

const requestHumanHandoff = async ({ conversationId, expectedRevision, reason = "user_requested", now = new Date(), ConversationModel = Conversation, HandoffModel = Handoff } = {}) => {
  if (!["user_requested", "assistant_escalation"].includes(reason)) throw new TypeError("Invalid handoff reason");
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0) throw new TypeError("A valid workflow revision is required");
  const conversation = await ConversationModel.findOneAndUpdate(
    { _id: conversationId, workflowRevision: expectedRevision, handoffStatus: { $nin: ["pending", "claimed"] } },
    {
      $set: {
        workflow: normalizeWorkflow({ intent: "support", step: "human_support" }),
        handoffStatus: "pending",
        handoffReason: reason,
        handoffRequestedAt: now,
        expiresAt: expiryFrom(now)
      },
      $inc: { workflowRevision: 1 }
    },
    { new: true, runValidators: true }
  );
  if (!conversation) {
    const existing = await ConversationModel.findById(conversationId).select("handoffStatus workflowRevision").lean();
    if (existing?.handoffStatus === "pending" || existing?.handoffStatus === "claimed") return { conversation: existing, duplicate: true };
    throw new ConversationConflictError();
  }
  try {
    await HandoffModel.findOneAndUpdate(
      { conversation: conversation._id, status: "pending" },
      { $set: { reason, requestedAt: now, expiresAt: expiryFrom(now) }, $setOnInsert: { conversation: conversation._id, status: "pending" } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }
  return { conversation, duplicate: false };
};

const recordConsentBatch = async ({ conversationId, changes, source, policyVersion, now = new Date() }) => {
  if (!changes || typeof changes !== "object" || Array.isArray(changes) || Object.keys(changes).length < 1 || Object.keys(changes).length > 2) {
    throw new TypeError("Invalid consent changes");
  }
  for (const [scope, status] of Object.entries(changes)) {
    if (!["service", "updates"].includes(scope) || !["granted", "withdrawn"].includes(status)) {
      throw new TypeError("Invalid consent change");
    }
  }
  if (!ALLOWED_CONSENT_SOURCES.has(source)) throw new TypeError("Invalid consent source");
  const consentVersion = String(policyVersion || "").trim();
  if (!consentVersion || consentVersion.length > 40) throw new TypeError("A valid consent policy version is required");
  const update = {
    $set: {
      ...Object.fromEntries(Object.entries(changes).map(([scope, status]) => [`${scope}Consent`, status])),
      consentSource: source,
      consentPolicyVersion: consentVersion,
      consentRecordedAt: now,
      expiresAt: expiryFrom(now)
    }
  };
  const conversation = await Conversation.findByIdAndUpdate(conversationId, update, { new: true, runValidators: true });
  if (!conversation) throw new ConversationConflictError();
  return conversation;
};

const recordConsent = async ({ conversationId, scope, status, source, policyVersion, now = new Date() }) => recordConsentBatch({
  conversationId,
  changes: { [scope]: status },
  source,
  policyVersion,
  now
});

const setDeliveryStatus = async ({ messageId, status, providerMessageId, failureCode, now = new Date() }) => {
  requireEnabled();
  const allowed = {
    queued: ["sent", "failed"],
    sent: ["delivered", "read", "failed"],
    delivered: ["read"],
    failed: ["queued"]
  };
  if (!Object.hasOwn(allowed, status)) throw new TypeError("Invalid delivery status");
  const message = await Message.findById(messageId);
  if (!message) throw new ConversationConflictError();
  if (message.deliveryStatus === status) return message;
  if (!allowed[message.deliveryStatus]?.includes(status)) throw new TypeError("Invalid delivery status transition");

  const timestampField = { sent: "sentAt", delivered: "deliveredAt", read: "readAt", failed: "failedAt" }[status];
  const update = {
    $set: {
      deliveryStatus: status,
      ...(providerMessageId ? { providerMessageId: String(providerMessageId).slice(0, 200) } : {}),
      failureCode: status === "failed" ? String(failureCode || "delivery_failed").slice(0, 80) : "",
      ...(timestampField ? { [`statusTimestamps.${timestampField}`]: now } : {})
    }
  };
  const updated = await Message.findOneAndUpdate(
    { _id: messageId, deliveryStatus: message.deliveryStatus },
    update,
    { new: true, runValidators: true }
  );
  if (updated) return updated;
  const current = await Message.findById(messageId);
  if (current?.deliveryStatus === status) return current;
  throw new ConversationConflictError();
};

module.exports = {
  AssistantDisabledError,
  ConversationConflictError,
  HumanHandoffActiveError,
  appendMessage,
  createOrLoadConversation,
  expiryFrom,
  getRetentionDays,
  isEnabled,
  requireEnabled,
  normalizeWorkflow,
  recordConsent,
  requestHumanHandoff,
  recordConsentBatch,
  redactSensitiveText,
  setDeliveryStatus,
  updateWorkflow
};
