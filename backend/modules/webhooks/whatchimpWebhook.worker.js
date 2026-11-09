const webhookService = require("./whatchimpWebhook.service");
const outboxService = require("./whatchimpOutbox.service");

const processOne = async ({ processEvent, EventModel, now = new Date() } = {}) => {
  if (typeof processEvent !== "function") throw new TypeError("A verified event processor is required");
  const event = await webhookService.claimNextEvent({ EventModel, now });
  if (!event) return false;
  try {
    await processEvent({ messageIdHash: event.messageIdHash, contactId: event.contactId, text: event.text, occurredAt: event.occurredAt });
    await webhookService.finishEvent({ record: event, EventModel });
  } catch (error) {
    await webhookService.failEvent({
      record: event,
      EventModel,
      retryable: error?.retryable !== false,
      errorCode: error?.code || "PROCESSING_FAILED",
      now
    });
    throw error;
  }
  return true;
};

const createQueueWorker = ({ processEvent, EventModel, intervalMs = 1000, onError = () => {} } = {}) => {
  let timer;
  let stopped = true;
  let running = false;
  const tick = async () => {
    if (stopped || running) return;
    running = true;
    try {
      while (!stopped && await processOne({ processEvent, EventModel })) {}
    } catch (error) {
      onError(error);
    } finally {
      running = false;
    }
  };
  return {
    start() {
      if (!stopped) return;
      stopped = false;
      timer = setInterval(tick, intervalMs);
      timer.unref?.();
      void tick();
    },
    async stop() {
      stopped = true;
      clearInterval(timer);
      while (running) await new Promise((resolve) => setTimeout(resolve, 10));
    }
  };
};

const processOneOutbound = async ({ send = require("../renda-assistant/transport/whatChimpTransport").sendText, OutboxModel, now = new Date() } = {}) => {
  await outboxService.quarantineStaleClaims({ OutboxModel, now });
  const record = await outboxService.claimNext({ OutboxModel, now });
  if (!record) return { processed: false };
  try {
    const result = await send({ phoneNumber: record.recipient, text: record.text });
    await outboxService.markSent({ record, providerMessageId: result?.providerMessageId, OutboxModel });
    return { processed: true, status: "sent" };
  } catch (error) {
    if (error?.code === "WHATCHIMP_SEND_REJECTED") {
      await outboxService.markFailed({ record, errorCode: error.code, OutboxModel });
      return { processed: true, status: "failed" };
    }
    await outboxService.markUncertain({ record, errorCode: error?.code || "DELIVERY_UNKNOWN", OutboxModel });
    return { processed: true, status: "unknown" };
  }
};

module.exports = { createQueueWorker, processOne, processOneOutbound };
