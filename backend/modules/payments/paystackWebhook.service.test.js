const test = require("node:test");
const assert = require("node:assert/strict");
const { createEventKey, runIdempotentWebhookEvent } = require("./paystackWebhook.service");

const createEventModel = () => {
  const records = new Map();

  return {
    records,
    async create(record) {
      if (records.has(record.eventKey)) {
        const error = new Error("duplicate event key");
        error.code = 11000;
        throw error;
      }
      records.set(record.eventKey, { ...record });
    },
    async findOne({ eventKey }) {
      return records.get(eventKey) || null;
    },
    async findOneAndUpdate(filter, update) {
      const record = records.get(filter.eventKey);
      if (!record) return null;

      if (filter.lockToken && record.lockToken !== filter.lockToken) return null;
      if (filter.status && record.status !== filter.status) return null;
      if (filter.$or) {
        const reclaimable = filter.$or.some((condition) =>
          condition.status === record.status &&
          (!condition.lockExpiresAt || record.lockExpiresAt <= condition.lockExpiresAt.$lte)
        );
        if (!reclaimable) return null;
      }

      Object.assign(record, update.$set || {});
      for (const key of Object.keys(update.$unset || {})) delete record[key];
      for (const [key, amount] of Object.entries(update.$inc || {})) record[key] = (record[key] || 0) + amount;
      return record;
    }
  };
};

test("event keys are stable and distinguish transaction events", () => {
  const raw = Buffer.from('{"event":"charge.success","data":{"id":123}}');
  assert.equal(createEventKey({ event: "charge.success", data: { id: 123 } }, raw), "charge.success:123");
  assert.notEqual(
    createEventKey({ event: "charge.success", data: { id: 123 } }, raw),
    createEventKey({ event: "charge.failed", data: { id: 123 } }, raw)
  );
  assert.equal(
    createEventKey({ event: "unknown", data: {} }, raw),
    createEventKey({ event: "unknown", data: {} }, raw)
  );
});

test("a processed event executes once; an in-flight duplicate is deferred", async () => {
  const EventModel = createEventModel();
  const now = new Date("2026-10-01T00:00:00Z");
  let executions = 0;
  let release;
  const blocked = new Promise((resolve) => { release = resolve; });

  const first = runIdempotentWebhookEvent({
    EventModel,
    eventKey: "charge.success:tx-1",
    eventType: "charge.success",
    now,
    execute: async () => { executions += 1; await blocked; }
  });
  await new Promise((resolve) => setImmediate(resolve));

  const concurrent = await runIdempotentWebhookEvent({
    EventModel,
    eventKey: "charge.success:tx-1",
    eventType: "charge.success",
    now,
    execute: async () => { executions += 1; }
  });
  assert.equal(concurrent.status, "busy");

  release();
  assert.equal((await first).status, "processed");
  assert.equal((await runIdempotentWebhookEvent({
    EventModel,
    eventKey: "charge.success:tx-1",
    eventType: "charge.success",
    now,
    execute: async () => { executions += 1; }
  })).status, "processed");
  assert.equal(executions, 1);
});

test("failed processing can be retried and records no payment payload", async () => {
  const EventModel = createEventModel();
  const input = {
    EventModel,
    eventKey: "invoice.payment_failed:inv-1",
    eventType: "invoice.payment_failed",
    now: new Date("2026-10-01T00:00:00Z")
  };

  await assert.rejects(runIdempotentWebhookEvent({ ...input, execute: async () => { throw new Error("temporary failure"); } }));
  assert.equal(EventModel.records.get(input.eventKey).status, "failed");

  let executions = 0;
  const result = await runIdempotentWebhookEvent({ ...input, execute: async () => { executions += 1; } });
  assert.equal(result.status, "processed");
  assert.equal(executions, 1);
  assert.equal(EventModel.records.get(input.eventKey).lastError, "");
  assert.equal("payload" in EventModel.records.get(input.eventKey), false);
});

test("a crashed worker lease expires and allows Paystack retry to reclaim the event", async () => {
  const EventModel = createEventModel();
  const now = new Date("2026-10-01T00:10:00Z");
  const eventKey = "charge.success:tx-stale";
  await EventModel.create({
    eventKey,
    eventType: "charge.success",
    status: "processing",
    attempts: 1,
    lockToken: "abandoned-worker",
    lockExpiresAt: new Date(now.getTime() - 1000)
  });

  let executions = 0;
  const result = await runIdempotentWebhookEvent({
    EventModel,
    eventKey,
    eventType: "charge.success",
    now,
    execute: async () => { executions += 1; }
  });

  assert.equal(result.status, "processed");
  assert.equal(executions, 1);
  assert.equal(EventModel.records.get(eventKey).attempts, 2);
});
