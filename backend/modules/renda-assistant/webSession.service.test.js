const test = require("node:test");
const assert = require("node:assert/strict");
const Conversation = require("./conversation.model");
const Message = require("./message.model");
const webSession = require("./webSession.service");

const original = Object.fromEntries(["RENDA_ASSISTANT_ENABLED", "RENDA_ASSISTANT_WEB_SESSION_DAYS", "RENDA_ASSISTANT_WEB_CONSENT_POLICY_VERSION", "CLIENT_URL"].map((key) => [key, process.env[key]]));
test.after(() => {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("web session requires explicit consent and stores only a hashed cookie token", async (t) => {
  process.env.RENDA_ASSISTANT_ENABLED = "true";
  process.env.CLIENT_URL = "https://rendahomes.com/";
  let stored;
  t.mock.method(Conversation, "create", async (data) => { stored = data; return { _id: "web-conversation" }; });
  await assert.rejects(webSession.createWebSession({ consentAccepted: false }), { statusCode: 403 });
  const session = await webSession.createWebSession({ consentAccepted: true, now: new Date("2026-10-01T00:00:00.000Z") });
  assert.match(session.token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(stored.channel, "web");
  assert.equal(stored.webSessionTokenHash, webSession.hashToken(session.token));
  assert.notEqual(stored.webSessionTokenHash, session.token);
  assert.equal(stored.consentSource, "web");
  assert.equal(session.privacyUrl, "https://rendahomes.com/privacy-policy");
});

test("web lookup is channel-scoped and reset deletes only its web conversation", async (t) => {
  process.env.RENDA_ASSISTANT_ENABLED = "true";
  const token = "w".repeat(43);
  let lookup;
  t.mock.method(Conversation, "findOne", async (query) => { lookup = query; return { _id: "web-reset" }; });
  assert.equal(await webSession.findWebConversation({ token: "bad" }), null);
  await webSession.findWebConversation({ token, now: new Date("2026-10-01T00:00:00.000Z") });
  assert.equal(lookup.channel, "web");
  assert.equal(lookup.webSessionTokenHash, webSession.hashToken(token));
  let deletedMessages;
  let deletedConversation;
  t.mock.method(Message, "deleteMany", async (query) => { deletedMessages = query; });
  t.mock.method(Conversation, "deleteOne", async (query) => { deletedConversation = query; });
  assert.equal(await webSession.resetWebSession({ token }), true);
  assert.deepEqual(deletedMessages, { conversation: "web-reset", channel: "web" });
  assert.equal(deletedConversation.channel, "web");
  assert.equal(deletedConversation.webSessionTokenHash, webSession.hashToken(token));
});
