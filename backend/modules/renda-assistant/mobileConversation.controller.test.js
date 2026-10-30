const test = require("node:test");
const assert = require("node:assert/strict");
const assistantService = require("./rendaAssistant.service");
const mobileSession = require("./mobileSession.service");
const orchestrator = require("./orchestration/orchestrator.service");

const response = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

test("mobile handlers expose consent, require explicit acceptance, use the session header, and keep actions read-only", async (t) => {
  const calls = { append: [], turns: [], token: null };
  t.mock.method(assistantService, "requireEnabled", () => {});
  t.mock.method(assistantService, "appendMessage", async (args) => {
    calls.append.push(args);
    return { message: { text: args.text } };
  });
  t.mock.method(mobileSession, "getMobileConsentInfo", () => ({ text: "Consent copy", privacyUrl: "https://rendahomes.com/privacy-policy", policyVersion: "mobile-v1", retentionDays: 90 }));
  t.mock.method(mobileSession, "createMobileSession", async (args) => {
    if (args.consentAccepted !== true) {
      const error = new Error("Explicit consent required");
      error.statusCode = 403;
      throw error;
    }
    return { token: "t".repeat(43), conversationId: "conversation-id", expiresAt: new Date("2026-11-01T00:00:00.000Z"), policyVersion: "mobile-v1", text: "Consent copy", privacyUrl: "https://rendahomes.com/privacy-policy", retentionDays: 90 };
  });
  t.mock.method(mobileSession, "findMobileConversation", async ({ token }) => {
    calls.token = token;
    return { _id: "conversation-id" };
  });
  t.mock.method(mobileSession, "resetMobileSession", async ({ token }) => {
    calls.token = token;
    return true;
  });
  t.mock.method(orchestrator, "runAssistantTurn", async (args) => {
    calls.turns.push(args);
    return { reply: "I found a home.", listings: [], search: null };
  });
  const controller = require("./mobileConversation.controller");
  const next = (error) => { if (error) throw error; };

  const consentResponse = response();
  await controller.getConsent({}, consentResponse, next);
  assert.equal(consentResponse.body.consent.policyVersion, "mobile-v1");

  const declined = response();
  let forwardedError;
  await controller.createConversation({ body: { consentAccepted: false } }, declined, (error) => { forwardedError = error; });
  assert.equal(forwardedError.statusCode, 403);

  const created = response();
  await controller.createConversation({ body: { consentAccepted: true } }, created, next);
  assert.equal(created.statusCode, 201);
  assert.equal(created.body.conversation.sessionToken, "t".repeat(43));

  const sent = response();
  await controller.sendMessage({ body: { message: "Find a two bedroom" }, get: (header) => {
    assert.equal(header, "x-renda-assistant-session");
    return "s".repeat(43);
  } }, sent, next);
  assert.equal(calls.token, "s".repeat(43));
  assert.equal(calls.turns[0].mode, "mobile_search");
  assert.equal(sent.body.listings.length, 0);
  assert.equal(calls.append[1].direction, "outbound");

  const reset = response();
  await controller.resetConversation({ get: () => "s".repeat(43) }, reset, next);
  assert.equal(reset.body.success, true);
});
