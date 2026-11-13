const test = require("node:test");
const assert = require("node:assert/strict");
const Message = require("./landlordOnboardingMessage.model");
const { normalizeManualEmail, sendManualLandlordEmail } = require("./landlordOnboardingContact.service");

const validInput = {
  userId: "landlord-1",
  actorId: "admin-1",
  requestId: "manual-request-123456",
  subject: "RendaHomes account support",
  message: "Can we help you finish your listing?"
};

const makeModels = ({ duplicate = false } = {}) => {
  const records = [];
  const updates = [];
  return {
    records,
    updates,
    UserModel: {
      findById: () => ({ select: () => ({ lean: async () => ({ _id: "landlord-1", name: "Test Landlord", email: "landlord@example.com", role: "landlord" }) }) })
    },
    MessageModel: {
      async create(record) {
        if (duplicate) throw Object.assign(new Error("duplicate"), { code: 11000 });
        records.push(record);
        return { _id: "message-1" };
      },
      findOne: (filter) => ({ select: () => ({ lean: async () => filter.requestId ? { status: "sent" } : null }) }),
      async updateOne(_filter, update) { updates.push(update.$set); }
    }
  };
};

test("manual email draft rejects malformed request IDs, header injection and oversized content", () => {
  assert.ok(normalizeManualEmail(validInput));
  assert.equal(normalizeManualEmail({ ...validInput, subject: "hello\nBcc: attacker@example.com" }), null);
  assert.equal(normalizeManualEmail({ ...validInput, message: "x".repeat(4001) }), null);
  assert.equal(normalizeManualEmail({ ...validInput, requestId: "short" }), null);
});

test("manual contact model enforces one unresolved email send per landlord", () => {
  assert.ok(Message.schema.indexes().some(([keys, options]) =>
    keys.user === 1 && keys.channel === 1 && options.unique === true && options.partialFilterExpression?.hasUnresolvedDelivery === true
  ));
});

test("manual email persists only a digest and does not retry an ambiguous provider result", async () => {
  const models = makeModels();
  let sends = 0;
  const result = await sendManualLandlordEmail({
    ...validInput,
    models,
    env: { RESEND_API_KEY: "configured" },
    send: async () => { sends += 1; return undefined; }
  });

  assert.equal(result.status, "unknown");
  assert.equal(sends, 1);
  assert.equal(models.records[0].status, "sending");
  assert.match(models.records[0].contentDigest, /^[a-f0-9]{64}$/);
  assert.equal(Object.hasOwn(models.records[0], "message"), false);
  assert.equal(Object.hasOwn(models.records[0], "subject"), false);
  assert.deepEqual(models.updates[0], { status: "unknown", errorCode: "provider_result_unknown" });
});

test("a repeated idempotency key acknowledges an existing send without sending again", async () => {
  const models = makeModels({ duplicate: true });
  let sends = 0;
  const result = await sendManualLandlordEmail({
    ...validInput,
    models,
    env: { RESEND_API_KEY: "configured" },
    send: async () => { sends += 1; return { data: { id: "mail-1" } }; }
  });

  assert.deepEqual(result, { status: "sent", alreadyProcessed: true });
  assert.equal(sends, 0);
});

test("manual email blocks a new send while a prior provider outcome is uncertain", async () => {
  const models = makeModels();
  models.MessageModel.findOne = () => ({ select: () => ({ lean: async () => ({ status: "unknown" }) }) });
  let sends = 0;
  const result = await sendManualLandlordEmail({
    ...validInput,
    requestId: "manual-request-654321",
    models,
    env: { RESEND_API_KEY: "configured" },
    send: async () => { sends += 1; return { data: { id: "mail-1" } }; }
  });
  assert.equal(result.status, "delivery_unknown");
  assert.equal(sends, 0);
  assert.equal(models.records.length, 0);
});

test("manual email returns provider-unavailable without touching landlord records", async () => {
  const models = makeModels();
  const result = await sendManualLandlordEmail({ ...validInput, models, env: {} });
  assert.deepEqual(result, { status: "email_not_configured" });
  assert.equal(models.records.length, 0);
});
