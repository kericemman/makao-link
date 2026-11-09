const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createWebhookController, secureTokenEquals } = require("./whatchimpWebhook.controller");
const createWebhookRouter = require("./whatchimpWebhook.routes");
const service = require("./whatchimpWebhook.service");
const { processOne } = require("./whatchimpWebhook.worker");
const { processOneOutbound } = require("./whatchimpWebhook.worker");
const { redactWebhookToken } = require("./whatchimpWebhook.logging");
const outboxService = require("./whatchimpOutbox.service");
const EventModelFactory = require("./whatchimpEvent.model");
const mongoose = require("mongoose");
const DiagnosticEvent = require("./whatchimpDiagnosticEvent.model");

const TEST_TOKEN = "t".repeat(48);
const syntheticEvent = Object.freeze({
  eventId: "synthetic-event-001", messageId: "synthetic-message-001", contactId: "254700000001",
  direction: "inbound", contentType: "text", text: "Synthetic test only", occurredAt: "2026-01-01T10:00:00.000Z"
});
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

const memoryModel = () => {
  const rows = new Map();
  return {
    rows,
    async create(value) {
      const key = value.messageIdHash || value.diagnosticHash;
      if (rows.has(key)) throw Object.assign(new Error("duplicate"), { code: 11000 });
      const row = { _id: key, ...value };
      rows.set(key, row);
      return row;
    },
    async findOneAndUpdate(filter, update) {
      const row = [...rows.values()].find((item) => filter.$or.some((condition) => {
        if (item.status !== condition.status) return false;
        if (condition.nextAttemptAt && item.nextAttemptAt > condition.nextAttemptAt.$lte) return false;
        if (condition.processingStartedAt && item.processingStartedAt > condition.processingStartedAt.$lte) return false;
        if (condition.attempts && item.attempts >= condition.attempts.$lt) return false;
        return true;
      }));
      if (!row) return null;
      Object.assign(row, update.$set);
      row.attempts += update.$inc.attempts;
      return row;
    },
    async updateOne(filter, update) {
      const row = [...rows.values()].find((item) => String(item._id) === String(filter._id) && item.status === filter.status);
      if (row) { Object.assign(row, update.$set); for (const key of Object.keys(update.$unset || {})) delete row[key]; }
      return { modifiedCount: row ? 1 : 0 };
    }
  };
};

test("token authentication compares equal-length bytes in constant-time primitive", () => {
  assert.equal(secureTokenEquals(TEST_TOKEN, TEST_TOKEN), true);
  assert.equal(secureTokenEquals("wrong", TEST_TOKEN), false);
  assert.equal(secureTokenEquals(undefined, TEST_TOKEN), false);
  assert.equal(secureTokenEquals("x".repeat(31), "x".repeat(31)), false);
});

test("receiver stays disabled by default and rejects missing/invalid URL token", async () => {
  const disabled = response();
  await createWebhookController({ enabled: () => false })({ params: { token: TEST_TOKEN } }, disabled);
  assert.equal(disabled.statusCode, 503);
  for (const token of [undefined, "wrong"]) {
    const res = response();
    await createWebhookController({ enabled: () => true, expectedToken: () => TEST_TOKEN })({ params: { token }, body: Buffer.from("{}") }, res);
    assert.equal(res.statusCode, 401);
  }
});

test("valid synthetic normalized event is durably queued; duplicate delivery is acknowledged once", async () => {
  const EventModel = memoryModel();
  const controller = createWebhookController({
    enabled: () => true, expectedToken: () => TEST_TOKEN, EventModel,
    parsePayload: async () => syntheticEvent
  });
  const req = { params: { token: TEST_TOKEN }, body: Buffer.from("synthetic fixture, not provider verified") };
  const first = response();
  await controller(req, first);
  const duplicate = response();
  await controller(req, duplicate);
  assert.equal(first.statusCode, 200);
  assert.equal(first.body.duplicate, false);
  assert.equal(duplicate.body.duplicate, true);
  assert.equal(EventModel.rows.size, 1);
  assert.equal([...EventModel.rows.values()][0].messageIdHash, service.hashMessageId(syntheticEvent.messageId));
  assert.equal(JSON.stringify([...EventModel.rows.values()]).includes(syntheticEvent.messageId), false);
});

test("concurrent duplicate deliveries create one durable queue item", async () => {
  const EventModel = memoryModel();
  const event = service.normalizeInternalEvent(syntheticEvent);
  const results = await Promise.all(Array.from({ length: 8 }, () => service.persistEvent({ event, EventModel })));
  assert.equal(EventModel.rows.size, 1);
  assert.equal(results.filter((item) => !item.duplicate).length, 1);
});

test("request log URL redaction removes the complete bearer token", () => {
  const tokenized = `/api/webhooks/whatchimp/${TEST_TOKEN}?x=1`;
  const logged = redactWebhookToken(tokenized);
  assert.equal(logged.includes(TEST_TOKEN), false);
  assert.equal(logged, "/api/webhooks/whatchimp/[redacted]?x=1");
});

test("diagnostic capture records schema metadata only and expires in 48 hours", async () => {
  const DiagnosticModel = memoryModel();
  const rawBody = Buffer.from(JSON.stringify({ subscriber: { id: "private-value" }, message: "private message", sent: true }));
  const result = await service.persistDiagnostic({ rawBody, token: TEST_TOKEN, EventModel: DiagnosticModel, now: new Date("2026-01-01T00:00:00Z") });
  const row = [...DiagnosticModel.rows.values()][0];
  assert.equal(result.duplicate, false);
  assert.deepEqual(Object.keys(row).filter((key) => !["_id"].includes(key)).sort(), ["diagnosticFields", "diagnosticHash", "expiresAt", "payloadBytes"]);
  assert.equal(row.text, undefined);
  assert.equal(row.contactId, undefined);
  assert.deepEqual(row.diagnosticFields, ["subscriber.id:string", "message:string", "sent:boolean"]);
  assert.equal(row.expiresAt.getTime(), new Date("2026-01-03T00:00:00Z").getTime());
  assert.equal(JSON.stringify(row).includes("private-value"), false);
  assert.equal(JSON.stringify(row).includes("private message"), false);
});

test("diagnostic parser rejects malformed JSON, arrays and over-limit bodies", () => {
  assert.throws(() => service.summarizeDiagnosticPayload(Buffer.from("{")), SyntaxError);
  assert.throws(() => service.summarizeDiagnosticPayload(Buffer.from("[]")), /JSON object/);
  assert.throws(() => service.summarizeDiagnosticPayload(Buffer.alloc(64 * 1024 + 1)), /body size/);
});

test("diagnostic model uses existing connection and dedicated collection with unique and TTL indexes", () => {
  assert.equal(DiagnosticEvent.db, mongoose.connection);
  assert.equal(DiagnosticEvent.collection.name, "whatchimp_diagnostic_events");
  const indexes = DiagnosticEvent.diagnosticEventSchema.indexes();
  assert.ok(indexes.some(([keys, options]) => keys.diagnosticHash === 1 && options.unique));
  assert.ok(indexes.some(([keys, options]) => keys.expiresAt === 1 && options.expireAfterSeconds === 0));
  assert.deepEqual(Object.keys(DiagnosticEvent.schema.paths).filter((key) => ["contactId", "phone", "text", "message"].includes(key)), []);
});

test("enabled diagnostic receiver writes only to the dedicated diagnostic store", async () => {
  const diagnosticRows = [];
  const businessWrites = [];
  const diagnosticEventModel = {
    async init() {},
    async create(value) {
      diagnosticRows.push(value);
      return value;
    }
  };
  const EventModel = {
    async create(value) {
      businessWrites.push(value);
      throw new Error("diagnostic flow must not use the inbound message store");
    }
  };
  const handler = createWebhookController({
    enabled: () => true, diagnosticEnabled: () => true, expectedToken: () => TEST_TOKEN,
    EventModel,
    diagnosticEventModel,
    parsePayload: async () => assert.fail("diagnostic capture must not invoke the provider/business parser")
  });
  const res = response();
  const raw = Buffer.from('{"text":"do not retain","phone":"+254700000000"}');
  await handler({ params: { token: TEST_TOKEN }, body: raw }, res);
  assert.equal(res.statusCode, 202);
  assert.equal(businessWrites.length, 0);
  assert.equal(diagnosticRows.length, 1);
  assert.deepEqual(Object.keys(diagnosticRows[0]).sort(), ["diagnosticFields", "diagnosticHash", "expiresAt", "payloadBytes"]);
  assert.equal(diagnosticRows[0].payloadBytes, raw.length);
  assert.equal(JSON.stringify(diagnosticRows[0]).includes("do not retain"), false);
  assert.equal(JSON.stringify(diagnosticRows[0]).includes("+254700000000"), false);
  const rejected = response();
  await createWebhookController({ enabled: () => true, diagnosticEnabled: () => true, expectedToken: () => TEST_TOKEN, diagnosticEventModel: { init: async () => { throw new Error("database unavailable"); } } })(
    { params: { token: TEST_TOKEN }, body: Buffer.from("{}") }, rejected
  );
  assert.equal(rejected.statusCode, 503);
});

test("invalid schema is rejected and missing provider mapping fails closed", async () => {
  for (const parsePayload of [undefined, async () => ({ ...syntheticEvent, text: "" })]) {
    const res = response();
    await createWebhookController({ enabled: () => true, expectedToken: () => TEST_TOKEN, parsePayload })(
      { params: { token: TEST_TOKEN }, body: Buffer.from("synthetic") }, res
    );
    assert.equal(res.statusCode, parsePayload ? 400 : 503);
  }
});

test("persistence failures return retryable 503 and do not acknowledge", async () => {
  const res = response();
  await createWebhookController({
    enabled: () => true, expectedToken: () => TEST_TOKEN, parsePayload: async () => syntheticEvent,
    EventModel: { create: async () => { throw new Error("db unavailable"); } }
  })({ params: { token: TEST_TOKEN }, body: Buffer.from("synthetic") }, res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.code, "WHATCHIMP_WEBHOOK_STORAGE_UNAVAILABLE");
});

test("worker recovers queued durable events and marks processing success", async () => {
  const EventModel = memoryModel();
  await service.persistEvent({ event: service.normalizeInternalEvent(syntheticEvent), EventModel });
  let seen;
  assert.equal(await processOne({ EventModel, processEvent: async (event) => { seen = event; } }), true);
  assert.equal(seen.messageIdHash, service.hashMessageId(syntheticEvent.messageId));
  assert.equal([...EventModel.rows.values()][0].status, "processed");
  assert.equal(await processOne({ EventModel, processEvent: async () => {} }), false);
});

test("worker restart recovers only a stale inbound processing lease", async () => {
  const EventModel = memoryModel();
  const staleAt = new Date("2026-01-01T00:00:00Z");
  const event = service.normalizeInternalEvent(syntheticEvent);
  const key = service.hashMessageId(event.messageId);
  EventModel.rows.set(key, {
    _id: key, messageIdHash: key, kind: "message", contactId: event.contactId, text: event.text,
    occurredAt: event.occurredAt, status: "processing", attempts: 1, processingStartedAt: staleAt,
    nextAttemptAt: staleAt, expiresAt: new Date("2026-02-01T00:00:00Z")
  });
  let processed = 0;
  const result = await processOne({ EventModel, now: new Date(staleAt.getTime() + service.PROCESSING_LEASE_MS + 1), processEvent: async () => { processed++; } });
  assert.equal(result, true);
  assert.equal(processed, 1);
  assert.equal(EventModel.rows.get(key).status, "processed");
});

test("worker marks retryable failures with bounded exponential backoff", async () => {
  const EventModel = memoryModel();
  const now = new Date("2026-01-01T00:00:00Z");
  await service.persistEvent({ event: service.normalizeInternalEvent(syntheticEvent), EventModel, now });
  await assert.rejects(processOne({ EventModel, now, processEvent: async () => { throw Object.assign(new Error("retry"), { code: "TEMP", retryable: true }); } }));
  const [row] = EventModel.rows.values();
  assert.equal(row.status, "failed");
  assert.equal(row.lastErrorCode, "TEMP");
  assert.equal(row.nextAttemptAt.getTime() - now.getTime(), 1000);
  assert.equal(service.retryDelayMs(99), 60 * 60 * 1000);
});

test("outbound outbox deduplicates concurrent enqueue with unique idempotency hash", async () => {
  const rows = new Map();
  const OutboxModel = {
    async create(value) {
      if (rows.has(value.idempotencyHash)) throw Object.assign(new Error("duplicate"), { code: 11000 });
      const row = { _id: value.idempotencyHash, ...value };
      rows.set(value.idempotencyHash, row);
      return row;
    },
    findOne(filter) { return { select() { return { lean: async () => rows.get(filter.idempotencyHash) }; } }; }
  };
  const results = await Promise.all(Array.from({ length: 5 }, () => outboxService.enqueue({
    idempotencyKey: "test-response-1", recipient: "+254700000001", text: "Mock only", OutboxModel
  })));
  assert.equal(rows.size, 1);
  assert.equal(results.filter((item) => !item.duplicate).length, 1);
});

test("outbound worker atomically claims once and quarantines ambiguous sends without retry", async () => {
  const rows = new Map();
  const OutboxModel = {
    async create(value) { const row = { _id: "outbox-1", ...value }; rows.set(row._id, row); return row; },
    async updateMany(filter, update) {
      for (const row of rows.values()) if (row.status === filter.status && row.sendingStartedAt <= filter.sendingStartedAt.$lte) Object.assign(row, update.$set);
      return { modifiedCount: 0 };
    },
    findOneAndUpdate(filter, update) {
      const row = [...rows.values()].find((item) => item.status === filter.status);
      if (row) { Object.assign(row, update.$set); row.attempts = (row.attempts || 0) + update.$inc.attempts; }
      return { select() { return Promise.resolve(row || null); } };
    },
    async updateOne(filter, update) {
      const row = rows.get(filter._id);
      if (row?.status === filter.status) { Object.assign(row, update.$set); delete row.sendingStartedAt; }
      return { modifiedCount: row ? 1 : 0 };
    }
  };
  await outboxService.enqueue({ idempotencyKey: "once", recipient: "254700000001", text: "Mock only", OutboxModel });
  let sends = 0;
  const result = await processOneOutbound({
    OutboxModel,
    send: async () => { sends += 1; throw Object.assign(new Error("ambiguous timeout"), { retryable: false }); }
  });
  assert.deepEqual(result, { processed: true, status: "unknown" });
  assert.equal(sends, 1);
  assert.equal(rows.get("outbox-1").status, "unknown");
  assert.deepEqual(await processOneOutbound({ OutboxModel, send: async () => { sends += 1; } }), { processed: false });
  assert.equal(sends, 1);
});

test("stale outbound send claims become unknown and are never re-enqueued automatically", async () => {
  const rows = new Map([["crashed", { _id: "crashed", status: "sending", sendingStartedAt: new Date("2026-01-01T00:00:00Z") }]]);
  const OutboxModel = {
    async updateMany(filter, update) {
      let count = 0;
      for (const row of rows.values()) if (row.status === filter.status && row.sendingStartedAt <= filter.sendingStartedAt.$lte) {
        Object.assign(row, update.$set); count++;
      }
      return { modifiedCount: count };
    },
    findOneAndUpdate() { return { select() { return Promise.resolve(null); } }; }
  };
  const now = new Date("2026-01-01T00:10:00Z");
  await processOneOutbound({ OutboxModel, now, send: async () => assert.fail("stale sends must not be retried") });
  assert.equal(rows.get("crashed").status, "unknown");
});

test("concurrent outbound workers cannot claim the same queued idempotency record", async () => {
  const row = { _id: "shared", status: "queued", recipient: "254700000001", text: "Mock", attempts: 0 };
  const OutboxModel = {
    async updateMany() { return { modifiedCount: 0 }; },
    findOneAndUpdate(filter, update) {
      let claimed = null;
      if (row.status === filter.status) {
        Object.assign(row, update.$set);
        row.attempts += update.$inc.attempts;
        claimed = { ...row };
      }
      return { select() { return Promise.resolve(claimed); } };
    },
    async updateOne(filter, update) {
      if (row._id === filter._id && row.status === filter.status) Object.assign(row, update.$set);
      return { modifiedCount: 1 };
    }
  };
  let sends = 0;
  const outcomes = await Promise.all([
    processOneOutbound({ OutboxModel, send: async () => { sends++; return { providerMessageId: "mock" }; } }),
    processOneOutbound({ OutboxModel, send: async () => { sends++; return { providerMessageId: "mock" }; } })
  ]);
  assert.equal(outcomes.filter((item) => item.status === "sent").length, 1);
  assert.equal(sends, 1);
});

test("route registers only tokenized POST callback and bounded raw body parser", () => {
  const router = createWebhookRouter();
  const route = router.stack.find((layer) => layer.route?.path === "/whatchimp/:token");
  assert.ok(route);
  assert.equal(route.route.methods.post, true);
  assert.equal(route.route.methods.get, undefined);
});

test("Nginx webhook location suppresses URI-bearing logs and configures edge throttling", () => {
  const location = fs.readFileSync(path.resolve(__dirname, "../../../deploy/whatchimp-api-location.conf"), "utf8");
  const limits = fs.readFileSync(path.resolve(__dirname, "../../../deploy/whatchimp-api-rate-limit.conf"), "utf8");
  assert.match(limits, /limit_req_zone \$binary_remote_addr zone=whatchimp_api:/);
  assert.match(location, /location ~ \^\/api\/webhooks\/whatchimp/);
  assert.match(limits, /rate=10r\/s;/);
  assert.match(location, /zone=whatchimp_api burst=50 nodelay;/);
  assert.match(location, /client_max_body_size 64k;/);
  assert.match(location, /access_log off;/);
  assert.match(location, /error_log \/dev\/null crit;/);
  assert.match(location, /proxy_pass http:\/\/127\.0\.0\.1:5000;/);
  const existing = fs.readFileSync(path.resolve(__dirname, "../../../deploy/hostinger-nginx.conf"), "utf8");
  assert.match(existing, /server_name updates\.rendahomes\.com;/);
});
