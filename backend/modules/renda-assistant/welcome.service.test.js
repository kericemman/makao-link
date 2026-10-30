const test = require("node:test");
const assert = require("node:assert/strict");
const Conversation = require("./conversation.model");
const Handoff = require("./handoff.model");
const {
  CONSENT_INSTRUCTIONS,
  SERVICE_CONSENT_PHRASE,
  UPDATES_CONSENT_PHRASE,
  getWelcomeMessage,
  handleConsentMessage,
  handleIntentSelection,
  parseConsentCommand,
  parseIntentSelection,
  saveOptionalContactDetails
} = require("./welcome.service");

const originalEnabled = process.env.RENDA_ASSISTANT_ENABLED;
test.after(() => {
  if (originalEnabled === undefined) delete process.env.RENDA_ASSISTANT_ENABLED;
  else process.env.RENDA_ASSISTANT_ENABLED = originalEnabled;
});

test("welcome asks for explicit service consent and does not treat vague agreement as consent", () => {
  assert.match(getWelcomeMessage({ serviceConsent: "unknown" }), /OpenAI/);
  assert.equal(parseConsentCommand("I agree"), null);
  assert.deepEqual(parseConsentCommand(SERVICE_CONSENT_PHRASE).changes, { service: "granted" });
  assert.deepEqual(parseConsentCommand(UPDATES_CONSENT_PHRASE).changes, { updates: "granted" });
});

test("STOP withdraws both consent scopes in one atomic update", async (t) => {
  let update;
  t.mock.method(Conversation, "findByIdAndUpdate", async (_id, value) => {
    update = value;
    return { _id: "conversation-1" };
  });
  const result = await handleConsentMessage({ conversationId: "conversation-1", text: " STOP " });
  assert.deepEqual(update.$set.serviceConsent, "withdrawn");
  assert.deepEqual(update.$set.updatesConsent, "withdrawn");
  assert.equal(result.handled, true);
  assert.match(result.reply, /opted out/);
});

test("intent choices require service consent and persist a resumable workflow step", async (t) => {
  process.env.RENDA_ASSISTANT_ENABLED = "true";
  let args;
  t.mock.method(Conversation, "findOneAndUpdate", async (...values) => {
    args = values;
    return { _id: "conversation-1", workflowRevision: 3 };
  });
  const denied = await handleIntentSelection({
    conversationId: "conversation-1",
    conversation: { serviceConsent: "unknown" },
    text: "1"
  });
  assert.equal(denied.handled, false);
  assert.equal(args, undefined);

  const result = await handleIntentSelection({
    conversationId: "conversation-1",
    conversation: { serviceConsent: "granted", workflowRevision: 2, workflow: { search: { county: "Nairobi" } } },
    text: "1"
  });
  assert.equal(result.intent, "property_search");
  assert.equal(args[1].$set.workflow.intent, "property_search");
  assert.equal(args[1].$set.workflow.search.county, "Nairobi");
  assert.equal(parseIntentSelection("3"), "support");
});

test("support selection persists handoff and pauses future automated intent choices", async (t) => {
  process.env.RENDA_ASSISTANT_ENABLED = "true";
  let handoffWrite;
  t.mock.method(Conversation, "findOneAndUpdate", async (_filter, update) => {
    handoffWrite = update;
    return { _id: "conversation-support", handoffStatus: "pending", workflowRevision: 5 };
  });
  t.mock.method(Handoff, "findOneAndUpdate", async () => ({ _id: "handoff-support" }));
  const result = await handleIntentSelection({
    conversationId: "conversation-support",
    conversation: { serviceConsent: "granted", workflowRevision: 4, workflow: { intent: "unknown" } },
    text: "3"
  });
  assert.equal(result.handoffPending, true);
  assert.equal(handoffWrite.$set.handoffStatus, "pending");
  const paused = await handleIntentSelection({
    conversationId: "conversation-support",
    conversation: { serviceConsent: "granted", handoffStatus: "pending", workflow: { intent: "support", step: "human_support" } },
    text: "START"
  });
  assert.equal(paused.handoffPending, true);
});

test("restart clears workflow and resume copy reflects the stored intent", async (t) => {
  let update;
  t.mock.method(Conversation, "findOneAndUpdate", async (_filter, value) => {
    update = value;
    return { _id: "conversation-1" };
  });
  process.env.RENDA_ASSISTANT_ENABLED = "true";
  const restarted = await handleIntentSelection({
    conversationId: "conversation-1",
    conversation: { serviceConsent: "granted", workflowRevision: 1 },
    text: "START"
  });
  assert.deepEqual(update.$set.workflow, { intent: "unknown", step: "welcome", search: { purpose: "", propertyType: "", county: "", town: "", minPrice: null, maxPrice: null, bedrooms: null } });
  assert.equal(restarted.intent, "unknown");
  assert.match(getWelcomeMessage({ serviceConsent: "granted", workflow: { intent: "list_property" } }), /Welcome back/);
});

test("optional name and email are validated and stored only after service consent", async (t) => {
  t.mock.method(Conversation, "findOneAndUpdate", () => ({
    select: async () => ({ _id: "conversation-1", contactName: "Amina Wanjiku", contactEmail: "amina@example.co.ke" })
  }));
  process.env.RENDA_ASSISTANT_ENABLED = "true";
  const result = await saveOptionalContactDetails({ conversationId: "conversation-1", name: " Amina   Wanjiku ", email: "AMINA@example.co.ke" });
  assert.equal(result.contactEmail, "amina@example.co.ke");
  assert.equal(result.contactName, "Amina Wanjiku");
  await assert.rejects(saveOptionalContactDetails({ conversationId: "conversation-1", email: "not-an-email" }), /Invalid email/);
  await assert.rejects(saveOptionalContactDetails({ conversationId: "conversation-1" }), /Provide a valid/);
});
