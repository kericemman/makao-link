const Conversation = require("./conversation.model");
const StatusNotification = require("./statusNotification.model");
const { expiryFrom } = require("./rendaAssistant.service");

const STATUS_TEXT = Object.freeze({
  listing_approved: "RendaHomes update: your property listing has been approved. Sign in to your landlord dashboard to manage it.",
  listing_rejected: "RendaHomes update: your property listing needs changes. Sign in to your landlord dashboard to review the feedback.",
  kyc_approved: "RendaHomes update: your landlord verification is approved.",
  kyc_rejected: "RendaHomes update: your landlord verification needs changes. Sign in to your landlord dashboard to review the feedback.",
  subscription_active: "RendaHomes update: your subscription is active. Sign in to your landlord dashboard to manage your plan.",
  stay_requested: "RendaHomes update: a guest has requested a short stay at your property. Sign in to review the request.",
  stay_confirmed: "RendaHomes update: your short-stay request has been confirmed by the host.",
  stay_declined: "RendaHomes update: your short-stay request was declined by the host. Contact the host to discuss alternatives.",
  stay_cancelled: "RendaHomes update: your short-stay request has been cancelled.",
  stay_completed: "RendaHomes update: your short stay is marked complete."
});

const normalizeKenyanWhatsAppContact = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;
  return null;
};

const isHandoffPending = (conversation) => conversation?.workflow?.intent === "support" ||
  conversation?.workflow?.step === "human_support" || conversation?.handoffStatus === "pending" || conversation?.handoffStatus === "claimed";

const saveNotifications = async ({ conversations, eventType, entityId, eventVersion = "", now, NotificationModel }) => {
  const text = STATUS_TEXT[eventType];
  const version = String(eventVersion || "").trim();
  const eventKey = `${eventType}:${String(entityId || "").trim()}${version ? `:${version}` : ""}`;
  if (!text || !entityId || eventKey.length > 180) throw new TypeError("Invalid assistant status notification event");
  const eligible = conversations.filter((conversation) =>
    conversation.updatesConsent === "granted" && conversation.serviceConsent === "granted" &&
    conversation.expiresAt > now && !isHandoffPending(conversation)
  );
  const results = await Promise.all(eligible.map(async (conversation) => {
    try {
      const existing = await NotificationModel.findOne({ conversation: conversation._id, eventKey }).select("_id").lean();
      if (existing) return { duplicate: true, queued: false };
      const notification = await NotificationModel.findOneAndUpdate(
        { conversation: conversation._id, eventKey },
        { $setOnInsert: {
          conversation: conversation._id,
          eventKey,
          eventType,
          text,
          status: "awaiting_provider",
          expiresAt: expiryFrom(now)
        } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return { notification, queued: true };
    } catch (error) {
      if (error?.code !== 11000) throw error;
      return { duplicate: true, queued: false };
    }
  }));
  return { queued: results.filter((result) => result.queued).length, suppressed: conversations.length - eligible.length, results };
};

const queueUserStatusNotification = async ({ userId, eventType, entityId, eventVersion, now = new Date(), ConversationModel = Conversation, NotificationModel = StatusNotification } = {}) => {
  if (process.env.RENDA_ASSISTANT_STATUS_NOTIFICATIONS_ENABLED !== "true") return { disabled: true, queued: 0 };
  if (!userId) throw new TypeError("A notification recipient is required");
  const conversations = await ConversationModel.find({
    linkedUser: userId,
    serviceConsent: "granted",
    updatesConsent: "granted",
    expiresAt: { $gt: now }
  }).select("_id serviceConsent updatesConsent expiresAt workflow handoffStatus").lean();
  return saveNotifications({ conversations, eventType, entityId, eventVersion, now, NotificationModel });
};

const queueWhatsAppContactStatusNotification = async ({ phone, eventType, entityId, eventVersion, now = new Date(), ConversationModel = Conversation, NotificationModel = StatusNotification } = {}) => {
  if (process.env.RENDA_ASSISTANT_STATUS_NOTIFICATIONS_ENABLED !== "true") return { disabled: true, queued: 0 };
  const contactId = normalizeKenyanWhatsAppContact(phone);
  if (!contactId) return { queued: 0, suppressed: 1, reason: "invalid_contact" };
  const conversations = await ConversationModel.find({
    externalContactId: { $in: [contactId, `+${contactId}`] },
    serviceConsent: "granted",
    updatesConsent: "granted",
    expiresAt: { $gt: now }
  }).select("_id serviceConsent updatesConsent expiresAt workflow handoffStatus").lean();
  return saveNotifications({ conversations, eventType, entityId, eventVersion, now, NotificationModel });
};

const queueStatusNotificationSafely = async (options) => {
  try {
    return await queueUserStatusNotification(options);
  } catch (error) {
    console.error("Failed to queue Renda Assistant status notification:", error.message);
    return { queued: 0, error: true };
  }
};

const queueContactStatusNotificationSafely = async (options) => {
  try {
    return await queueWhatsAppContactStatusNotification(options);
  } catch (error) {
    console.error("Failed to queue Renda Assistant contact notification:", error.message);
    return { queued: 0, error: true };
  }
};

module.exports = {
  STATUS_TEXT,
  isHandoffPending,
  normalizeKenyanWhatsAppContact,
  queueContactStatusNotificationSafely,
  queueStatusNotificationSafely,
  queueUserStatusNotification,
  queueWhatsAppContactStatusNotification,
  saveNotifications
};
