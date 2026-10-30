const test = require("node:test");
const assert = require("node:assert/strict");
const Conversation = require("./conversation.model");
const Message = require("./message.model");
const service = require("./rendaAssistant.service");

const originalEnabled = process.env.RENDA_ASSISTANT_ENABLED;

test.after(() => {
  if (originalEnabled === undefined) delete process.env.RENDA_ASSISTANT_ENABLED;
  else process.env.RENDA_ASSISTANT_ENABLED = originalEnabled;
});

test("assistant storage fails closed while its feature flag is disabled", async () => {
  delete process.env.RENDA_ASSISTANT_ENABLED;
  await assert.rejects(service.createOrLoadConversation({ externalContactId: "contact-1" }), {
    name: "AssistantDisabledError",
    statusCode: 503
  });
});

test("conversation defaults deny consent and schema indexes enforce expiry and uniqueness", () => {
  const conversation = new Conversation({ externalContactId: "contact-1", expiresAt: new Date() });
  assert.equal(conversation.serviceConsent, "unknown");
  assert.equal(conversation.updatesConsent, "unknown");
  assert.equal(conversation.accountLinkStatus, "unlinked");
  assert.equal(conversation.handoffStatus, "none");

  const conversationIndexes = Conversation.schema.indexes();
  const messageIndexes = Message.schema.indexes();
  const handoffIndexes = require("./handoff.model").schema.indexes();
  const notificationIndexes = require("./statusNotification.model").schema.indexes();
  assert.ok(conversationIndexes.some(([fields, options]) => fields.expiresAt === 1 && options.expireAfterSeconds === 0));
  assert.ok(conversationIndexes.some(([fields, options]) => fields.channel === 1 && fields.externalContactId === 1 && options.unique));
  assert.ok(conversationIndexes.some(([fields, options]) => fields.mobileSessionTokenHash === 1 && options.unique));
  assert.ok(conversationIndexes.some(([fields, options]) => fields.linkChallengeHash === 1 && options.unique));
  assert.ok(conversationIndexes.some(([fields]) => fields.handoffStatus === 1));
  assert.ok(handoffIndexes.some(([fields, options]) => fields.conversation === 1 && options.unique));
  assert.ok(notificationIndexes.some(([fields, options]) => fields.conversation === 1 && fields.eventKey === 1 && options.unique));
  assert.ok(notificationIndexes.some(([fields, options]) => fields.expiresAt === 1 && options.expireAfterSeconds === 0));
  assert.ok(messageIndexes.some(([fields, options]) => fields.conversation === 1 && fields.sequence === 1 && options.unique));
  assert.ok(messageIndexes.some(([fields, options]) => fields.channel === 1 && fields.providerEventId === 1 && options.unique));
  assert.ok(Conversation.schema.path("channel").enumValues.includes("mobile_app"));
  assert.ok(Message.schema.path("channel").enumValues.includes("mobile_app"));
});

test("human handoff is persisted with a revision guard and creates a minimal queue record", async (t) => {
  process.env.RENDA_ASSISTANT_ENABLED = "true";
  let conversationUpdate;
  let handoffUpdate;
  t.mock.method(Conversation, "findOneAndUpdate", async (...args) => {
    conversationUpdate = args;
    return { _id: "conversation-handoff", handoffStatus: "pending", workflowRevision: 4 };
  });
  const Handoff = require("./handoff.model");
  t.mock.method(Handoff, "findOneAndUpdate", async (...args) => { handoffUpdate = args; return { _id: "handoff-1" }; });
  const result = await service.requestHumanHandoff({ conversationId: "conversation-handoff", expectedRevision: 3, reason: "assistant_escalation" });
  assert.equal(result.conversation.handoffStatus, "pending");
  assert.equal(conversationUpdate[0].workflowRevision, 3);
  assert.equal(conversationUpdate[1].$set.workflow.step, "human_support");
  assert.equal(conversationUpdate[1].$set.handoffReason, "assistant_escalation");
  assert.equal(handoffUpdate[1].$set.reason, "assistant_escalation");
  assert.equal("context" in handoffUpdate[1].$setOnInsert, false);
});

test("message text redacts explicit credentials, identity numbers, and card-like numbers", () => {
  const safe = service.redactSensitiveText(
    "Password is secret123, my national ID number: 12345678, card 4111 1111 1111 1111. Need a bedsitter in Thika."
  );
  assert.equal(safe.includes("secret123"), false);
  assert.equal(safe.includes("12345678"), false);
  assert.equal(safe.includes("4111 1111 1111 1111"), false);
  assert.match(safe, /bedsitter in Thika/);
});

test("message text redacts contact details that are unnecessary for property discovery", () => {
  const safe = service.redactSensitiveText("Call me on +254 712 345 678 or email renter@example.co.ke about the Nakuru flat.");
  assert.equal(safe.includes("712 345 678"), false);
  assert.equal(safe.includes("renter@example.co.ke"), false);
  assert.match(safe, /Nakuru flat/);
});

test("atomic sequence allocation keeps simultaneous messages uniquely ordered", async (t) => {
  process.env.RENDA_ASSISTANT_ENABLED = "true";
  let sequence = 0;
  const storedMessages = new Map();
  t.mock.method(Conversation, "findById", async () => ({ _id: "conversation-1", channel: "whatsapp" }));
  t.mock.method(Conversation, "findOneAndUpdate", async (_filter, update) => {
    sequence += update.$inc.messageSequence;
    return { _id: "conversation-1", channel: "whatsapp", messageSequence: sequence };
  });
  t.mock.method(Message, "findOne", async ({ providerEventId }) => storedMessages.get(providerEventId) || null);
  t.mock.method(Message, "create", async (message) => {
    if (message.providerEventId && storedMessages.has(message.providerEventId)) {
      const error = new Error("duplicate event");
      error.code = 11000;
      throw error;
    }
    const saved = { ...message, _id: `message-${message.sequence}` };
    if (message.providerEventId) storedMessages.set(message.providerEventId, saved);
    return saved;
  });

  const results = await Promise.all([
    service.appendMessage({ conversationId: "conversation-1", direction: "inbound", text: "Hello", providerEventId: "evt-1" }),
    service.appendMessage({ conversationId: "conversation-1", direction: "inbound", text: "Keen on a home", providerEventId: "evt-2" })
  ]);

  assert.deepEqual(results.map(({ message }) => message.sequence).sort(), [1, 2]);
  assert.equal(new Set(results.map(({ message }) => message.sequence)).size, 2);
});

test("mobile assistant replies are recorded as synchronously sent, not queued for a WhatsApp provider", async (t) => {
  process.env.RENDA_ASSISTANT_ENABLED = "true";
  let stored;
  t.mock.method(Conversation, "findById", async () => ({ _id: "mobile-conversation", channel: "mobile_app" }));
  t.mock.method(Conversation, "findOneAndUpdate", async (_filter, update) => ({
    _id: "mobile-conversation",
    channel: "mobile_app",
    messageSequence: update.$inc.messageSequence
  }));
  t.mock.method(Message, "create", async (message) => { stored = message; return message; });
  await service.appendMessage({ conversationId: "mobile-conversation", direction: "outbound", text: "Found a home" });
  assert.equal(stored.channel, "mobile_app");
  assert.equal(stored.deliveryStatus, "sent");
  assert.ok(stored.statusTimestamps.sentAt instanceof Date);
});

test("duplicate provider event IDs return the original message without another stored message", async (t) => {
  process.env.RENDA_ASSISTANT_ENABLED = "true";
  let sequence = 0;
  const storedMessages = new Map();
  let creates = 0;
  t.mock.method(Conversation, "findById", async () => ({ _id: "conversation-2", channel: "whatsapp" }));
  t.mock.method(Conversation, "findOneAndUpdate", async (_filter, update) => {
    sequence += update.$inc.messageSequence;
    return { _id: "conversation-2", channel: "whatsapp", messageSequence: sequence };
  });
  t.mock.method(Message, "findOne", async ({ providerEventId }) => storedMessages.get(providerEventId) || null);
  t.mock.method(Message, "create", async (message) => {
    creates += 1;
    if (storedMessages.has(message.providerEventId)) {
      const error = new Error("duplicate event");
      error.code = 11000;
      throw error;
    }
    const saved = { ...message, _id: "message-original" };
    storedMessages.set(message.providerEventId, saved);
    return saved;
  });

  const first = await service.appendMessage({ conversationId: "conversation-2", direction: "inbound", text: "Hello", providerEventId: "evt-same" });
  const duplicate = await service.appendMessage({ conversationId: "conversation-2", direction: "inbound", text: "Hello again", providerEventId: "evt-same" });

  assert.equal(first.duplicate, false);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.message._id, first.message._id);
  assert.equal(creates, 1);
});

test("workflow writes require the caller's current revision and reject invalid bounds", async (t) => {
  process.env.RENDA_ASSISTANT_ENABLED = "true";
  t.mock.method(Conversation, "findOneAndUpdate", async () => null);
  await assert.rejects(
    service.updateWorkflow({ conversationId: "conversation-1", expectedRevision: 0, workflow: { intent: "support" } }),
    { name: "ConversationConflictError", statusCode: 409 }
  );
  await assert.rejects(
    service.updateWorkflow({ conversationId: "conversation-1", expectedRevision: 0, workflow: { intent: "unknown", search: { minPrice: 500, maxPrice: 100 } } }),
    { name: "TypeError" }
  );
});
