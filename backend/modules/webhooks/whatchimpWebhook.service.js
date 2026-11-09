const crypto = require("crypto");
const mongoose = require("mongoose");
const EventModelFactory = require("./whatchimpEvent.model");
const DiagnosticEvent = require("./whatchimpDiagnosticEvent.model");
const { normalizeInboundEvent } = require("../renda-assistant/transport/transport.contract");

const EVENT_RETENTION_DAYS = 30;
const DIAGNOSTIC_RETENTION_HOURS = 48;
const MAX_ATTEMPTS = 8;
const PROCESSING_LEASE_MS = 5 * 60 * 1000;
const hashMessageId = (id) => crypto.createHash("sha256").update(String(id)).digest("hex");
const retryDelayMs = (attempt, baseMs = 1000, capMs = 60 *  60 * 1000) => Math.min(capMs, baseMs * (2 ** Math.max(0, attempt - 1)));

const normalizeInternalEvent = (event) => {
  const normalized = normalizeInboundEvent(event);
  return Object.freeze({ ...normalized, messageId: normalized.messageId });
};

const persistEvent = async ({ event, now = new Date(), EventModel = EventModelFactory.createEventModel(mongoose.connection) }) => {
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + EVENT_RETENTION_DAYS);
  try {
    const record = await EventModel.create({
      kind: "message",
      messageIdHash: hashMessageId(event.messageId),
      contactId: event.contactId,
      text: event.text,
      occurredAt: event.occurredAt,
      status: "queued",
      attempts: 0,
      nextAttemptAt: now,
      expiresAt
    });
    return { accepted: true, duplicate: false, record };
  } catch (error) {
    if (error?.code !== 11000) throw error;
    return { accepted: true, duplicate: true };
  }
};

const summarizeDiagnosticPayload = (rawBody) => {
  if (!Buffer.isBuffer(rawBody) || rawBody.length === 0 || rawBody.length > 64 * 1024) throw new TypeError("Invalid diagnostic body size");
  const payload = JSON.parse(rawBody.toString("utf8"));
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new TypeError("Expected a JSON object");
  const fields = [];
  const safeSegment = (value) => String(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[number]")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 40) || "field";
  const visit = (value, path, depth) => {
    if (fields.length >= 100) return;
    if (value === null || typeof value !== "object") {
      fields.push(`${path}:${value === null ? "null" : typeof value}`);
      return;
    }
    if (depth >= 6) {
      fields.push(`${path}:${Array.isArray(value) ? "array" : "object"}`);
      return;
    }
    const entries = Array.isArray(value) ? value.slice(0, 1).map((item, index) => [String(index), item]) : Object.entries(value);
    if (entries.length === 0) fields.push(`${path}:${Array.isArray(value) ? "array" : "object"}`);
    for (const [key, child] of entries) {
      const nextPath = path ? `${path}.${safeSegment(key)}` : safeSegment(key);
      visit(child, nextPath.slice(0, 160), depth + 1);
    }
  };
  visit(payload, "", 0);
  return { payloadBytes: rawBody.length, diagnosticFields: fields };
};

const persistDiagnostic = async ({ rawBody, summary: suppliedSummary, token, now = new Date(), EventModel = DiagnosticEvent } = {}) => {
  if (typeof token !== "string" || token.length < 32) throw new TypeError("Diagnostic token is not configured");
  const summary = suppliedSummary || summarizeDiagnosticPayload(rawBody);
  const diagnosticHash = crypto.createHmac("sha256", token).update(rawBody).digest("hex");
  const expiresAt = new Date(now.getTime() + DIAGNOSTIC_RETENTION_HOURS * 60 * 60 * 1000);
  try {
    if (typeof EventModel.init === "function") await EventModel.init();
    await EventModel.create({ diagnosticHash, ...summary, expiresAt });
    return { accepted: true, duplicate: false };
  } catch (error) {
    if (error?.code !== 11000) throw error;
    return { accepted: true, duplicate: true };
  }
};

const claimNextEvent = async ({ now = new Date(), EventModel = EventModelFactory.createEventModel(mongoose.connection) } = {}) => {
  const staleBefore = new Date(now.getTime() - PROCESSING_LEASE_MS);
  const query = EventModel.findOneAndUpdate(
    {
      $or: [
        { status: "queued", nextAttemptAt: { $lte: now } },
        { status: "failed", nextAttemptAt: { $lte: now }, attempts: { $lt: MAX_ATTEMPTS } },
        { status: "processing", processingStartedAt: { $lte: staleBefore }, attempts: { $lt: MAX_ATTEMPTS } }
      ]
    },
    { $set: { status: "processing", processingStartedAt: now }, $inc: { attempts: 1 } },
    { new: true, sort: { nextAttemptAt: 1, createdAt: 1 } }
  );
  return typeof query.select === "function" ? query.select("+contactId +text") : query;
};

const finishEvent = async ({ record, EventModel = EventModelFactory.createEventModel(mongoose.connection) }) => EventModel.updateOne(
  { _id: record._id, status: "processing" },
  { $set: { status: "processed", lastErrorCode: "" }, $unset: { processingStartedAt: 1 } }
);

const failEvent = async ({ record, errorCode = "PROCESSING_FAILED", retryable = true, now = new Date(), EventModel = EventModelFactory.createEventModel(mongoose.connection) } = {}) => {
  const exhausted = record.attempts >= MAX_ATTEMPTS;
  const status = !retryable || exhausted ? "dead" : "failed";
  const nextAttemptAt = new Date(now.getTime() + retryDelayMs(record.attempts));
  return EventModel.updateOne(
    { _id: record._id, status: "processing" },
    { $set: { status, lastErrorCode: String(errorCode).slice(0, 80), nextAttemptAt }, $unset: { processingStartedAt: 1 } }
  );
};

module.exports = {
  EVENT_RETENTION_DAYS,
  DIAGNOSTIC_RETENTION_HOURS,
  MAX_ATTEMPTS,
  PROCESSING_LEASE_MS,
  claimNextEvent,
  failEvent,
  finishEvent,
  hashMessageId,
  normalizeInternalEvent,
  persistDiagnostic,
  persistEvent,
  retryDelayMs,
  summarizeDiagnosticPayload
};
