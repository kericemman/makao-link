const test = require("node:test");
const assert = require("node:assert/strict");
const {
  STATUS_TEXT,
  normalizeKenyanWhatsAppContact,
  queueUserStatusNotification,
  queueWhatsAppContactStatusNotification
} = require("./notifications.service");

const consented = (id, overrides = {}) => ({
  _id: id,
  serviceConsent: "granted",
  updatesConsent: "granted",
  expiresAt: new Date(Date.now() + 60_000),
  workflow: { intent: "property_search" },
  ...overrides
});

const createModels = (conversations) => {
  const rows = new Map();
  const queries = [];
  return {
    rows,
    queries,
    ConversationModel: {
      find: (filter) => {
        queries.push(filter);
        return { select() { return this; }, lean: async () => conversations };
      }
    },
    NotificationModel: {
      findOne: (filter) => ({ select() { return this; }, lean: async () => rows.get(`${filter.conversation}:${filter.eventKey}`) || null }),
      findOneAndUpdate: async (filter, update) => {
        const key = `${filter.conversation}:${filter.eventKey}`;
        if (!rows.has(key)) rows.set(key, { _id: `notification-${rows.size + 1}`, ...update.$setOnInsert });
        return rows.get(key);
      }
    }
  };
};

const oldFlag = process.env.RENDA_ASSISTANT_STATUS_NOTIFICATIONS_ENABLED;
test.after(() => {
  if (oldFlag === undefined) delete process.env.RENDA_ASSISTANT_STATUS_NOTIFICATIONS_ENABLED;
  else process.env.RENDA_ASSISTANT_STATUS_NOTIFICATIONS_ENABLED = oldFlag;
});

test("normalizes Kenyan phone numbers to canonical WhatsApp contact IDs", () => {
  assert.equal(normalizeKenyanWhatsAppContact("0712 345 678"), "254712345678");
  assert.equal(normalizeKenyanWhatsAppContact("+254 712 345 678"), "254712345678");
  assert.equal(normalizeKenyanWhatsAppContact("712345678"), "254712345678");
  assert.equal(normalizeKenyanWhatsAppContact("123"), null);
});

test("status outbox is disabled by default and creates no provider traffic", async () => {
  delete process.env.RENDA_ASSISTANT_STATUS_NOTIFICATIONS_ENABLED;
  let reads = 0;
  const result = await queueUserStatusNotification({
    userId: "landlord-1", eventType: "listing_approved", entityId: "listing-1",
    ConversationModel: { find: () => { reads += 1; } }
  });
  assert.deepEqual(result, { disabled: true, queued: 0 });
  assert.equal(reads, 0);
});

test("queues deduplicated status events only for opted-in, non-handoff conversations", async () => {
  process.env.RENDA_ASSISTANT_STATUS_NOTIFICATIONS_ENABLED = "true";
  const models = createModels([
    consented("allowed"),
    consented("support", { workflow: { intent: "support", step: "human_support" } }),
    consented("claimed", { handoffStatus: "claimed" }),
    consented("expired", { expiresAt: new Date(Date.now() - 1) }),
    consented("no-updates", { updatesConsent: "withdrawn" })
  ]);
  const options = {
    userId: "landlord-1", eventType: "listing_approved", entityId: "listing-1",
    ConversationModel: models.ConversationModel, NotificationModel: models.NotificationModel
  };
  const first = await queueUserStatusNotification(options);
  const second = await queueUserStatusNotification(options);
  assert.equal(first.queued, 1);
  assert.equal(first.suppressed, 4);
  assert.equal(second.queued, 0);
  assert.equal(models.rows.size, 1);
  const record = [...models.rows.values()][0];
  assert.equal(record.status, "awaiting_provider");
  assert.equal(record.text, STATUS_TEXT.listing_approved);
  assert.equal(record.eventKey, "listing_approved:listing-1");
  assert.equal(models.queries[0].updatesConsent, "granted");
  assert.equal(models.queries[0].serviceConsent, "granted");
  assert.equal(models.queries[0].linkedUser, "landlord-1");
  const renewedApproval = await queueUserStatusNotification({ ...options, eventVersion: "review-2" });
  assert.equal(renewedApproval.queued, 1);
  assert.equal(models.rows.size, 2);
});

test("matches stay updates only to an opted-in WhatsApp conversation for that Kenyan number", async () => {
  process.env.RENDA_ASSISTANT_STATUS_NOTIFICATIONS_ENABLED = "true";
  const models = createModels([consented("guest-conversation")]);
  const result = await queueWhatsAppContactStatusNotification({
    phone: "0712-345-678", eventType: "stay_confirmed", entityId: "stay-1",
    ConversationModel: models.ConversationModel, NotificationModel: models.NotificationModel
  });
  assert.equal(result.queued, 1);
  assert.deepEqual(models.queries[0].externalContactId.$in, ["254712345678", "+254712345678"]);
  assert.equal([...models.rows.values()][0].eventType, "stay_confirmed");
});

test("rejects unsupported status events rather than composing arbitrary notification text", async () => {
  process.env.RENDA_ASSISTANT_STATUS_NOTIFICATIONS_ENABLED = "true";
  const models = createModels([consented("allowed")]);
  await assert.rejects(queueUserStatusNotification({
    userId: "landlord-1", eventType: "free_form", entityId: "event-1",
    ConversationModel: models.ConversationModel, NotificationModel: models.NotificationModel
  }), /Invalid assistant status notification event/);
});
