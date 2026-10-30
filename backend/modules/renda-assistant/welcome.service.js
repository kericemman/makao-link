const assistantService = require("./rendaAssistant.service");
const { isHandoffPending } = require("./notifications.service");
const Conversation = require("./conversation.model");
const validator = require("validator");

const CONSENT_POLICY_VERSION = () => String(process.env.RENDA_ASSISTANT_CONSENT_POLICY_VERSION || "renda-wa-v1").trim();
const SERVICE_CONSENT_PHRASE = "I agree to Renda Assistant processing my messages for property search";
const UPDATES_CONSENT_PHRASE = "I agree to receive RendaHomes WhatsApp updates";
const CONSENT_INSTRUCTIONS = `Welcome to RendaHomes WhatsApp. To use the property assistant, your messages will be processed by RendaHomes and OpenAI to answer property-search requests. Do not send passwords, payment details, or identity documents. To consent, reply exactly: "${SERVICE_CONSENT_PHRASE}". This is optional. You can withdraw anytime by replying STOP.`;

const normalizeCommand = (text) => String(text || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-KE");

const parseConsentCommand = (text) => {
  const command = normalizeCommand(text);
  if (["stop", "unsubscribe", "quit", "end"].includes(command)) {
    return { changes: { service: "withdrawn", updates: "withdrawn" }, reply: "You are opted out of RendaHomes assistant processing and optional WhatsApp updates." };
  }
  if (command === normalizeCommand(SERVICE_CONSENT_PHRASE)) {
    return { changes: { service: "granted" }, reply: "Consent recorded. You can now search public RendaHomes listings. Reply 1 to find a home, 2 to list a property, or 3 for support." };
  }
  if (command === normalizeCommand(UPDATES_CONSENT_PHRASE)) {
    return { changes: { updates: "granted" }, reply: "You are subscribed to RendaHomes WhatsApp updates. Reply STOP any time to opt out." };
  }
  if (command === "i withdraw consent for renda assistant") {
    return { changes: { service: "withdrawn" }, reply: "Renda Assistant is paused for this WhatsApp conversation. Reply with the exact consent phrase in the welcome message if you want to resume." };
  }
  if (command === "i withdraw consent for rendahomes updates") {
    return { changes: { updates: "withdrawn" }, reply: "RendaHomes WhatsApp updates are turned off." };
  }
  return null;
};

const getWelcomeMessage = (conversation = {}) => {
  if (conversation.serviceConsent !== "granted") return CONSENT_INSTRUCTIONS;
  if (conversation.workflow?.intent === "property_search" && conversation.workflow?.step !== "welcome") {
    return "Welcome back. We can continue your home search. Tell me your preferred location, budget, and property type, or reply START to begin again.";
  }
  if (conversation.workflow?.intent === "list_property") {
    return "Welcome back. Continue property listing securely in the landlord portal at landlord.rendahomes.com, or reply START to choose another task.";
  }
  return "Welcome back to RendaHomes. What would you like to do?\n1. Find a home\n2. List a property securely on the landlord website\n3. Get support\nReply STOP to opt out of automated WhatsApp messages.";
};

const handleConsentMessage = async ({ conversationId, text, now = new Date() }) => {
  const command = parseConsentCommand(text);
  if (!command) return null;
  await assistantService.recordConsentBatch({
    conversationId,
    changes: command.changes,
    source: "user_message",
    policyVersion: CONSENT_POLICY_VERSION(),
    now
  });
  return { handled: true, changes: command.changes, reply: command.reply };
};

const parseIntentSelection = (text) => {
  const value = normalizeCommand(text);
  if (["1", "find a home", "search homes", "property search"].includes(value)) return "property_search";
  if (["2", "list a property", "list my property"].includes(value)) return "list_property";
  if (["3", "support", "get support", "talk to support"].includes(value)) return "support";
  return null;
};

const handleIntentSelection = async ({ conversationId, conversation, text, now = new Date() }) => {
  if (conversation?.serviceConsent !== "granted") return { handled: false, reply: getWelcomeMessage(conversation) };
  if (isHandoffPending(conversation)) {
    return { handled: true, intent: "support", handoffPending: true, reply: "Your request is with RendaHomes support. Automated assistance is paused for this conversation." };
  }
  const command = normalizeCommand(text);
  if (["start", "restart", "start over", "reset"].includes(command)) {
    await assistantService.updateWorkflow({
      conversationId,
      expectedRevision: conversation.workflowRevision || 0,
      workflow: {},
      now
    });
    return { handled: true, intent: "unknown", reply: "Let's start again. Reply 1 to find a home, 2 to list a property, or 3 for support." };
  }
  if (["back", "change", "change that", "correct that"].includes(command)) {
    return { handled: false, reply: "No problem. Tell me what you would like to change, or reply START to begin again." };
  }
  const intent = parseIntentSelection(text);
  if (!intent) return { handled: false, reply: "Please reply 1 to find a home, 2 to list a property, or 3 for support." };

  if (intent === "support") {
    await assistantService.requestHumanHandoff({
      conversationId,
      expectedRevision: conversation.workflowRevision || 0,
      reason: "user_requested",
      now
    });
    return { handled: true, intent, handoffPending: true, reply: "I have noted that you need support. Automated assistance is paused for this conversation. Please use the support page on rendahomes.com while the team follows up." };
  }

  await assistantService.updateWorkflow({
    conversationId,
    expectedRevision: conversation.workflowRevision || 0,
    workflow: {
      ...(conversation.workflow || {}),
      intent,
      step: intent === "property_search" ? "search_preferences" : intent === "list_property" ? "secure_landlord_link" : "human_support"
    },
    now
  });
  const reply = {
    property_search: "Great, I can help find available homes. Tell me your preferred county or town, budget, and property type.",
    list_property: "Property listing and KYC are handled securely in the landlord portal: sign in or register at landlord.rendahomes.com. Never send ID documents or passwords in this chat.",
    support: "I have noted that you need support. A support handoff is not connected yet; please use the support page on rendahomes.com for now."
  }[intent];
  return { handled: true, intent, reply };
};

const saveOptionalContactDetails = async ({ conversationId, name, email, now = new Date() }) => {
  assistantService.requireEnabled();
  const update = {};
  if (name !== undefined && name !== null && String(name).trim()) {
    const normalizedName = String(name).trim().replace(/\s+/g, " ");
    if (normalizedName.length > 100 || /[\u0000-\u001f\u007f]/.test(normalizedName)) throw new TypeError("Invalid name");
    update.contactName = normalizedName;
  }
  if (email !== undefined && email !== null && String(email).trim()) {
    const normalizedEmail = String(email).trim().toLowerCase();
    if (normalizedEmail.length > 254 || !validator.isEmail(normalizedEmail)) throw new TypeError("Invalid email address");
    update.contactEmail = normalizedEmail;
  }
  if (!Object.keys(update).length) throw new TypeError("Provide a valid name or email");

  const conversation = await Conversation.findOneAndUpdate(
    { _id: conversationId, serviceConsent: "granted", expiresAt: { $gt: now } },
    { $set: { ...update, expiresAt: assistantService.expiryFrom(now) } },
    { new: true, runValidators: true }
  ).select("_id contactName contactEmail");
  if (!conversation) throw new assistantService.ConversationConflictError();
  return conversation;
};

module.exports = {
  CONSENT_INSTRUCTIONS,
  SERVICE_CONSENT_PHRASE,
  UPDATES_CONSENT_PHRASE,
  getWelcomeMessage,
  handleConsentMessage,
  handleIntentSelection,
  normalizeCommand,
  parseConsentCommand,
  parseIntentSelection,
  saveOptionalContactDetails
};
