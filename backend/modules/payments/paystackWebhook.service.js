const crypto = require("crypto");

const PROCESSING_LEASE_MS = 5 * 60 * 1000;

const createEventKey = (event, rawBody) => {
  const type = String(event?.event || "unknown");
  const data = event?.data || {};
  const identity = event?.id || data?.id || data?.reference;
  if (identity !== undefined && identity !== null && String(identity).trim()) {
    return `${type}:${String(identity).trim()}`;
  }

  const subscriptionCode = data?.subscription?.subscription_code || data?.subscription_code;
  const period = [data?.period_start, data?.period_end, data?.created_at].filter(Boolean).join(":");
  if (subscriptionCode && period) return `${type}:${subscriptionCode}:${period}`;

  const digest = crypto.createHash("sha256").update(rawBody).digest("hex");
  return `${type}:sha256:${digest}`;
};

const claimEvent = async ({ EventModel, eventKey, eventType, now, lockToken }) => {
  try {
    await EventModel.create({
      eventKey,
      eventType,
      status: "processing",
      attempts: 1,
      lockToken,
      lockExpiresAt: new Date(now.getTime() + PROCESSING_LEASE_MS)
    });
    return "claimed";
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }

  const existing = await EventModel.findOne({ eventKey });
  if (!existing) return "busy";
  if (existing.status === "processed") return "processed";
  if (existing.status === "processing" && existing.lockExpiresAt > now) return "busy";

  const reclaimed = await EventModel.findOneAndUpdate(
    {
      eventKey,
      $or: [
        { status: "failed" },
        { status: "processing", lockExpiresAt: { $lte: now } }
      ]
    },
    {
      $set: {
        status: "processing",
        eventType,
        lockToken,
        lockExpiresAt: new Date(now.getTime() + PROCESSING_LEASE_MS),
        lastError: ""
      },
      $inc: { attempts: 1 }
    },
    { new: true }
  );

  return reclaimed ? "claimed" : "busy";
};

const runIdempotentWebhookEvent = async ({ EventModel, eventKey, eventType, execute, now = new Date() }) => {
  const lockToken = crypto.randomUUID();
  const claim = await claimEvent({ EventModel, eventKey, eventType, now, lockToken });
  if (claim !== "claimed") return { status: claim };

  try {
    await execute();
    await EventModel.findOneAndUpdate(
      { eventKey, status: "processing", lockToken },
      {
        $set: { status: "processed", processedAt: now, lockExpiresAt: null, lastError: "" },
        $unset: { lockToken: 1 }
      }
    );
    return { status: "processed" };
  } catch (error) {
    await EventModel.findOneAndUpdate(
      { eventKey, status: "processing", lockToken },
      {
        $set: {
          status: "failed",
          lockExpiresAt: null,
          lastError: String(error?.message || "Webhook processing failed").slice(0, 500)
        },
        $unset: { lockToken: 1 }
      }
    );
    throw error;
  }
};

module.exports = { createEventKey, runIdempotentWebhookEvent };
