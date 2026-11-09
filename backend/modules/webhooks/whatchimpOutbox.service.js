const crypto = require("crypto");
const Outbox = require("./whatchimpOutbox.model");
const { normalizeRecipient } = require("../renda-assistant/transport/whatChimpTransport");

const OUTBOX_RETENTION_DAYS = 30;
const SENDING_LEASE_MS = 5 * 60 * 1000;
const hashKey = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");

const enqueue = async ({ idempotencyKey, recipient, text, now = new Date(), OutboxModel = Outbox } = {}) => {
  if (typeof idempotencyKey !== "string" || !idempotencyKey.trim() || idempotencyKey.length > 200) throw new TypeError("A valid idempotency key is required");
  const normalizedRecipient = normalizeRecipient(recipient);
  const normalizedText = String(text || "").trim();
  if (!normalizedText || normalizedText.length > 4000) throw new TypeError("Message text must contain 1 to 4,000 characters");
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + OUTBOX_RETENTION_DAYS);
  const idempotencyHash = hashKey(idempotencyKey);
  try {
    const record = await OutboxModel.create({ idempotencyHash, recipient: normalizedRecipient, text: normalizedText, status: "queued", expiresAt });
    return { record, duplicate: false };
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const record = await OutboxModel.findOne({ idempotencyHash }).select("status providerMessageId failureCode").lean();
    if (!record) throw error;
    return { record, duplicate: true };
  }
};

const claimNext = async ({ now = new Date(), OutboxModel = Outbox } = {}) => OutboxModel.findOneAndUpdate(
  { status: "queued" },
  { $set: { status: "sending", sendingStartedAt: now }, $inc: { attempts: 1 } },
  { new: true, sort: { createdAt: 1 } }
).select("+recipient +text");

const markSent = async ({ record, providerMessageId, OutboxModel = Outbox } = {}) => OutboxModel.updateOne(
  { _id: record._id, status: "sending" },
  { $set: { status: "sent", providerMessageId: String(providerMessageId || "").slice(0, 200) }, $unset: { sendingStartedAt: 1 } }
);

const markUncertain = async ({ record, errorCode = "DELIVERY_UNKNOWN", OutboxModel = Outbox } = {}) => OutboxModel.updateOne(
  { _id: record._id, status: "sending" },
  { $set: { status: "unknown", failureCode: String(errorCode).slice(0, 80) }, $unset: { sendingStartedAt: 1 } }
);

const markFailed = async ({ record, errorCode = "SEND_REJECTED", OutboxModel = Outbox } = {}) => OutboxModel.updateOne(
  { _id: record._id, status: "sending" },
  { $set: { status: "failed", failureCode: String(errorCode).slice(0, 80) }, $unset: { sendingStartedAt: 1 } }
);

const quarantineStaleClaims = async ({ now = new Date(), OutboxModel = Outbox } = {}) => OutboxModel.updateMany(
  { status: "sending", sendingStartedAt: { $lte: new Date(now.getTime() - SENDING_LEASE_MS) } },
  { $set: { status: "unknown", failureCode: "WORKER_INTERRUPTED_DURING_SEND" }, $unset: { sendingStartedAt: 1 } }
);

module.exports = { OUTBOX_RETENTION_DAYS, SENDING_LEASE_MS, claimNext, enqueue, hashKey, markFailed, markSent, markUncertain, quarantineStaleClaims };
