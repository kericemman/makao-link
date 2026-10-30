const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const Conversation = require("./conversation.model");
const { createAccountLinkChallenge, confirmAccountLink, AccountLinkError, CHALLENGE_TTL_MS } = require("./accountLink.service");

const originalEnabled = process.env.RENDA_ASSISTANT_ENABLED;
test.after(() => {
  if (originalEnabled === undefined) delete process.env.RENDA_ASSISTANT_ENABLED;
  else process.env.RENDA_ASSISTANT_ENABLED = originalEnabled;
});

test.beforeEach(() => { process.env.RENDA_ASSISTANT_ENABLED = "true"; });

test("link challenge is high entropy, short-lived, and only its hash is stored", async (t) => {
  let update;
  t.mock.method(Conversation, "findOneAndUpdate", async (_filter, value) => {
    update = value;
    return { _id: "507f1f77bcf86cd799439011" };
  });
  const now = new Date("2026-01-01T00:00:00Z");
  const challenge = await createAccountLinkChallenge({ conversationId: "507f1f77bcf86cd799439011", now });
  assert.match(challenge.token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(challenge.expiresAt.getTime(), now.getTime() + CHALLENGE_TTL_MS);
  assert.equal(update.$set.linkChallengeHash, crypto.createHash("sha256").update(challenge.token).digest("hex"));
  assert.notEqual(update.$set.linkChallengeHash, challenge.token);
  assert.equal(update.$set.accountLinkStatus, "pending");
});

test("account link requires authenticated user identity and explicit confirmation", async (t) => {
  let filter;
  let update;
  t.mock.method(Conversation, "findOneAndUpdate", (_filter, value) => {
    filter = _filter;
    update = value;
    return { select: async () => ({ _id: "conversation-1", linkedUser: "507f191e810c19729de860ea", accountLinkStatus: "verified" }) };
  });
  const token = crypto.randomBytes(32).toString("base64url");
  const result = await confirmAccountLink({ token, userId: "507f191e810c19729de860ea", confirmed: true });
  assert.equal(result.accountLinkStatus, "verified");
  assert.equal(filter.linkChallengeHash, crypto.createHash("sha256").update(token).digest("hex"));
  assert.equal(update.$set.linkedUser, "507f191e810c19729de860ea");
  assert.ok(update.$unset.linkChallengeHash);
  await assert.rejects(confirmAccountLink({ token, userId: "507f191e810c19729de860ea", confirmed: false }), AccountLinkError);
});

test("expired, replayed, malformed, and unknown challenges fail generically", async (t) => {
  let calls = 0;
  t.mock.method(Conversation, "findOneAndUpdate", () => {
    calls += 1;
    return { select: async () => null };
  });
  const token = crypto.randomBytes(32).toString("base64url");
  await assert.rejects(confirmAccountLink({ token, userId: "507f191e810c19729de860ea", confirmed: true }), AccountLinkError);
  await assert.rejects(confirmAccountLink({ token: "bad", userId: "507f191e810c19729de860ea", confirmed: true }), AccountLinkError);
  assert.equal(calls, 1);
});
