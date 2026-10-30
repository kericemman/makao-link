const test = require("node:test");
const assert = require("node:assert/strict");
const Conversation = require("./conversation.model");
const Message = require("./message.model");
const assistantService = require("./rendaAssistant.service");
const mobileSession = require("./mobileSession.service");

const oldEnabled = process.env.RENDA_ASSISTANT_ENABLED;
const oldClientUrl = process.env.CLIENT_URL;

test.after(() => {
  if (oldEnabled === undefined) delete process.env.RENDA_ASSISTANT_ENABLED;
  else process.env.RENDA_ASSISTANT_ENABLED = oldEnabled;
  if (oldClientUrl === undefined) delete process.env.CLIENT_URL;
  else process.env.CLIENT_URL = oldClientUrl;
});

test("mobile session requires explicit consent before creating a conversation", async (t) => {
  process.env.RENDA_ASSISTANT_ENABLED = "true";
  let creates = 0;
  t.mock.method(Conversation, "create", async () => { creates += 1; });
  await assert.rejects(mobileSession.createMobileSession({ consentAccepted: false }), { statusCode: 403 });
  assert.equal(creates, 0);
});

test("mobile session stores only a hash of the random session token and stamps consent", async (t) => {
  process.env.RENDA_ASSISTANT_ENABLED = "true";
  process.env.CLIENT_URL = "https://rendahomes.com/";
  let stored;
  t.mock.method(Conversation, "create", async (data) => {
    stored = data;
    return { _id: "conversation-mobile" };
  });

  const session = await mobileSession.createMobileSession({ consentAccepted: true, now: new Date("2026-10-01T00:00:00.000Z") });
  assert.match(session.token, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(stored.mobileSessionTokenHash, session.token);
  assert.equal(stored.mobileSessionTokenHash, mobileSession.hashToken(session.token));
  assert.equal(stored.channel, "mobile_app");
  assert.equal(stored.serviceConsent, "granted");
  assert.equal(stored.consentSource, "mobile_app");
  assert.equal(stored.workflow.intent, "property_search");
  assert.equal(session.privacyUrl, "https://rendahomes.com/privacy-policy");
  assert.equal(session.policyVersion, "renda-mobile-v1");
  assert.match(session.text, /RendaHomes and OpenAI/);
  assert.match(session.text, /up to 90 days/);
});

test("mobile session lookup rejects malformed tokens and hashes valid tokens for lookup", async (t) => {
  process.env.RENDA_ASSISTANT_ENABLED = "true";
  let filter;
  t.mock.method(Conversation, "findOne", async (query) => { filter = query; return { _id: "mobile" }; });
  assert.equal(await mobileSession.findMobileConversation({ token: "bad" }), null);
  assert.equal(filter, undefined);
  const token = "a".repeat(43);
  await mobileSession.findMobileConversation({ token, now: new Date("2026-10-01T00:00:00.000Z") });
  assert.equal(filter.channel, "mobile_app");
  assert.equal(filter.mobileSessionTokenHash, mobileSession.hashToken(token));
  assert.ok(filter.mobileSessionExpiresAt.$gt instanceof Date);
  assert.ok(filter.expiresAt.$gt instanceof Date);
});

test("reset immediately deletes mobile messages and the token-bound conversation", async (t) => {
  process.env.RENDA_ASSISTANT_ENABLED = "true";
  const token = "b".repeat(43);
  t.mock.method(Conversation, "findOne", async () => ({ _id: "mobile-reset" }));
  let deletedMessages;
  let deletedConversation;
  t.mock.method(Message, "deleteMany", async (query) => { deletedMessages = query; });
  t.mock.method(Conversation, "deleteOne", async (query) => { deletedConversation = query; });
  assert.equal(await mobileSession.resetMobileSession({ token }), true);
  assert.deepEqual(deletedMessages, { conversation: "mobile-reset", channel: "mobile_app" });
  assert.equal(deletedConversation._id, "mobile-reset");
  assert.equal(deletedConversation.mobileSessionTokenHash, mobileSession.hashToken(token));
});
