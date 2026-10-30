const test = require("node:test");
const assert = require("node:assert/strict");
const Conversation = require("../conversation.model");
const Message = require("../message.model");
const Handoff = require("../handoff.model");
const Listing = require("../../listings/listings.model");
const { runAssistantTurn, validateFinalAnswer, getConfiguration } = require("./orchestrator.service");

const envNames = ["RENDA_ASSISTANT_ENABLED", "OPENAI_API_KEY", "RENDA_ASSISTANT_MODEL", "RENDA_ASSISTANT_TIMEOUT_MS", "LANDLORD_CLIENT_URL", "CLIENT_URL"];
const originalEnv = Object.fromEntries(envNames.map((name) => [name, process.env[name]]));

test.after(() => {
  for (const name of envNames) {
    if (originalEnv[name] === undefined) delete process.env[name];
    else process.env[name] = originalEnv[name];
  }
});

const configure = () => {
  process.env.RENDA_ASSISTANT_ENABLED = "true";
  process.env.OPENAI_API_KEY = "test-only-not-a-real-key";
  process.env.RENDA_ASSISTANT_MODEL = "test-model";
  process.env.RENDA_ASSISTANT_TIMEOUT_MS = "12000";
};

const stubContext = (t) => {
  t.mock.method(Conversation, "findById", () => ({
    lean: async () => ({
      _id: "507f1f77bcf86cd799439011",
      expiresAt: new Date(Date.now() + 60_000),
      serviceConsent: "granted",
      workflow: { intent: "property_search", search: { county: "Nairobi" } }
    })
  }));
  t.mock.method(Message, "find", () => ({
    sort() { return this; },
    limit() { return this; },
    select() { return this; },
    lean: async () => [{ direction: "inbound", text: "Looking around Nairobi", sequence: 1 }]
  }));
};

test("assistant response uses strict structured output and disables API-side storage", async (t) => {
  configure();
  stubContext(t);
  const requests = [];
  const client = { responses: { create: async (request) => {
    requests.push(request);
    return requests.length === 1
      ? { status: "completed", id: "response-1", output: [] }
      : { status: "completed", output_text: JSON.stringify({ reply: "How many bedrooms do you need?", listingIds: [], planKeys: [], draftId: null, needsHumanSupport: false }) };
  } } };

  const result = await runAssistantTurn({ conversationId: "507f1f77bcf86cd799439011", userText: "Need a home", client });
  assert.deepEqual(result, { reply: "How many bedrooms do you need?", listingIds: [], planKeys: [], draftId: null, needsHumanSupport: false, landlordOnboarding: null, listingDraft: null, listings: [] });
  assert.equal(requests.length, 2);
  assert.equal(requests[0].store, false);
  assert.equal(requests[1].store, false);
  assert.equal("previous_response_id" in requests[1], false);
  assert.equal(requests[1].text.format.strict, true);
  assert.equal(requests[0].input[0].role, "user");
});

test("mobile search mode exposes only public search tools and returns backend search metadata", async (t) => {
  configure();
  process.env.CLIENT_URL = "https://public.example";
  stubContext(t);
  const listingId = "507f1f77bcf86cd799439099";
  const calls = [];
  const listingQuery = {
    select() { return this; },
    sort() { return this; },
    skip() { return this; },
    limit() { return this; },
    lean: async () => [{ _id: listingId, title: "Two bedroom home", price: 45000, purpose: "rent", county: "Nairobi", town: "Kilimani" }]
  };
  t.mock.method(Listing, "find", () => listingQuery);
  t.mock.method(Listing, "countDocuments", async () => 1);
  const client = { responses: { create: async (request) => {
    calls.push(request);
    return calls.length === 1
      ? { status: "completed", output: [{
          type: "function_call",
          name: "search_public_listings",
          call_id: "mobile-search-1",
          arguments: JSON.stringify({ search: null, purpose: "rent", type: null, county: "Nairobi", town: "Kilimani", minPrice: null, maxPrice: 50000, bedrooms: 2, bathrooms: null, guests: null })
        }] }
      : { status: "completed", output_text: JSON.stringify({ reply: "I found a matching home.", listingIds: [listingId] }) };
  } } };

  const result = await runAssistantTurn({ conversationId: "507f1f77bcf86cd799439011", userText: "Find a two bedroom in Kilimani", mode: "mobile_search", client });
  assert.deepEqual(calls[0].tools.map((tool) => tool.name), [
    "search_public_listings",
    "get_public_listing_details",
    "get_live_search_metadata",
    "get_conversation_context"
  ]);
  assert.deepEqual(Object.keys(calls[1].text.format.schema.properties), ["reply", "listingIds"]);
  assert.equal(calls[0].instructions.includes("inside the RendaHomes mobile app"), true);
  assert.equal(calls[1].instructions.includes("inside the RendaHomes mobile app"), true);
  assert.equal(calls[0].store, false);
  assert.deepEqual(result.search, {
    criteria: { search: null, purpose: "rent", type: null, county: "Nairobi", town: "Kilimani", minPrice: null, maxPrice: 50000, bedrooms: 2, bathrooms: null, guests: null },
    match: "exact",
    broadenedBy: [],
    total: 1
  });
  assert.equal(result.listings[0]._id, listingId);
  assert.equal(result.listings[0].url, `https://public.example/listings/${listingId}`);
  assert.equal("landlordOnboarding" in result, false);
  assert.equal("listingDraft" in result, false);
});

test("mobile search rejects non-verified listing IDs and unsupported response fields", async (t) => {
  configure();
  stubContext(t);
  const client = { responses: { create: async (request) => request.tools
    ? { status: "completed", output: [] }
    : { status: "completed", output_text: JSON.stringify({ reply: "Here is a link https://example.com", listingIds: [], planKeys: [] }) } } };
  await assert.rejects(runAssistantTurn({ conversationId: "507f1f77bcf86cd799439011", userText: "Find a home", mode: "mobile_search", client }), /Mobile assistant response/);
});

test("model tool calls are capped, executed from the allowlist, and results are replayed without response storage", async (t) => {
  configure();
  stubContext(t);
  const calls = [];
  const client = { responses: { create: async (request) => {
    calls.push(request);
    if (calls.length === 1) return {
      status: "completed",
      output: [{
        type: "function_call",
        name: "get_conversation_context",
        call_id: "call-1",
        arguments: "{}"
      }]
    };
    assert.match(request.input[2].content, /property_search/);
    return { status: "completed", output_text: JSON.stringify({ reply: "You are searching in Nairobi.", listingIds: [], planKeys: [], draftId: null, needsHumanSupport: false }) };
  } } };
  const result = await runAssistantTurn({ conversationId: "507f1f77bcf86cd799439011", userText: "What did I say?", client });
  assert.equal(result.reply, "You are searching in Nairobi.");
  assert.equal(calls[0].tools.length, 6);
  assert.equal(calls[1].store, false);
});

test("landlord plan tool returns only backend-verified plan details and secure portal/legal URLs", async (t) => {
  configure();
  stubContext(t);
  const calls = [];
  const client = { responses: { create: async (request) => {
    calls.push(request);
    if (calls.length === 1) return {
      status: "completed",
      output: [{ type: "function_call", name: "get_landlord_plan_options", call_id: "plans-1", arguments: "{}" }]
    };
    assert.match(request.input[2].content, /Basic/);
    assert.match(request.input[2].content, /listingLimit/);
    return { status: "completed", output_text: JSON.stringify({ reply: "Basic includes seven active listings.", listingIds: [], planKeys: ["basic"], draftId: null, needsHumanSupport: false }) };
  } } };

  process.env.LANDLORD_CLIENT_URL = "https://landlord.example";
  process.env.CLIENT_URL = "https://public.example";
  const result = await runAssistantTurn({ conversationId: "507f1f77bcf86cd799439011", userText: "I want to list as a landlord", client });
  assert.equal(result.landlordOnboarding.plans.length, 1);
  assert.equal(result.landlordOnboarding.plans[0].listingLimit, 7);
  assert.equal(result.landlordOnboarding.plans[0].registrationUrl, "https://landlord.example/register?plan=basic");
  assert.equal(result.landlordOnboarding.legal.termsUrl, "https://public.example/terms-of-service");
});

test("assistant is disabled by default and requires explicit model/key configuration", async () => {
  delete process.env.RENDA_ASSISTANT_ENABLED;
  await assert.rejects(runAssistantTurn({ conversationId: "invalid", userText: "hello", client: {} }), { name: "AssistantDisabledError" });
  delete process.env.OPENAI_API_KEY;
  delete process.env.RENDA_ASSISTANT_MODEL;
  assert.throws(() => getConfiguration(), /OpenAI is not configured/);
  process.env.RENDA_ASSISTANT_ENABLED = "true";
  process.env.RENDA_ASSISTANT_MODEL = "test-model";
  process.env.OPENAI_API_KEY = "placeholder";
  assert.equal(getConfiguration().model, "test-model");
});

test("assistant refuses to send conversation text to the model without explicit service consent", async (t) => {
  configure();
  t.mock.method(Conversation, "findById", () => ({
    lean: async () => ({ _id: "507f1f77bcf86cd799439011", expiresAt: new Date(Date.now() + 60_000), serviceConsent: "unknown" })
  }));
  let apiCalls = 0;
  const client = { responses: { create: async () => { apiCalls += 1; } } };
  await assert.rejects(runAssistantTurn({ conversationId: "507f1f77bcf86cd799439011", userText: "hello", client }), {
    name: "AssistantConsentRequiredError",
    statusCode: 403
  });
  assert.equal(apiCalls, 0);
});

test("assistant pauses before contacting the model while a human handoff is pending", async (t) => {
  configure();
  t.mock.method(Conversation, "findById", () => ({
    lean: async () => ({
      _id: "507f1f77bcf86cd799439011",
      expiresAt: new Date(Date.now() + 60_000),
      serviceConsent: "granted",
      handoffStatus: "pending",
      workflow: { intent: "support", step: "human_support" }
    })
  }));
  let apiCalls = 0;
  await assert.rejects(runAssistantTurn({
    conversationId: "507f1f77bcf86cd799439011",
    userText: "Can you help?",
    client: { responses: { create: async () => { apiCalls += 1; } } }
  }), { name: "HumanHandoffActiveError", statusCode: 409 });
  assert.equal(apiCalls, 0);
});

test("assistant escalation persists a human handoff before returning its answer", async (t) => {
  configure();
  stubContext(t);
  let handoff = null;
  t.mock.method(Conversation, "findOneAndUpdate", async (_filter, update) => {
    handoff = update.$set;
    return { _id: "507f1f77bcf86cd799439011", handoffStatus: "pending", workflowRevision: 1 };
  });
  t.mock.method(Handoff, "findOneAndUpdate", async () => ({ _id: "handoff-1" }));
  let calls = 0;
  const client = { responses: { create: async () => {
    calls += 1;
    return calls === 1
      ? { status: "completed", output: [] }
      : { status: "completed", output_text: JSON.stringify({ reply: "I will connect you to support.", listingIds: [], planKeys: [], draftId: null, needsHumanSupport: true }) };
  } } };
  const result = await runAssistantTurn({ conversationId: "507f1f77bcf86cd799439011", userText: "I need a human", client });
  assert.equal(result.needsHumanSupport, true);
  assert.equal(handoff.handoffStatus, "pending");
  assert.equal(handoff.handoffReason, "assistant_escalation");
});

test("assistant stops before executing more than the bounded number of tool calls", async (t) => {
  configure();
  stubContext(t);
  const client = { responses: { create: async () => ({
    status: "completed",
    output: Array.from({ length: 4 }, (_, index) => ({
      type: "function_call",
      name: "get_conversation_context",
      call_id: `call-${index}`,
      arguments: "{}"
    }))
  }) } };
  await assert.rejects(runAssistantTurn({ conversationId: "507f1f77bcf86cd799439011", userText: "hello", client }), /too many tools/);
});

test("assistant cannot create a property draft before the user selects landlord listing", async (t) => {
  configure();
  stubContext(t);
  const args = Object.fromEntries(Object.keys(require("./listingDraftTool").listingDraftTool.parameters.properties).map((key) => [key, null]));
  const calls = [];
  const client = { responses: { create: async (request) => {
    calls.push(request);
    if (calls.length === 1) return {
      status: "completed",
      output: [{ type: "function_call", name: "save_landlord_listing_draft", call_id: "draft-1", arguments: JSON.stringify(args) }]
    };
    assert.match(request.input[2].content, /has not selected the property-listing flow/);
    return { status: "completed", output_text: JSON.stringify({ reply: "Choose landlord listing first.", listingIds: [], planKeys: [], draftId: null, needsHumanSupport: false }) };
  } } };
  const result = await runAssistantTurn({ conversationId: "507f1f77bcf86cd799439011", userText: "Here are my property details", client });
  assert.equal(result.listingDraft, null);
});

test("final response cannot cite listings that were not returned by a public search tool", () => {
  assert.throws(() => validateFinalAnswer({ reply: "Found one", listingIds: ["fabricated"], planKeys: [], draftId: null, needsHumanSupport: false }, new Set()), /unverified listing/);
  assert.throws(() => validateFinalAnswer({ reply: "ok", listingIds: [], planKeys: ["pro"], draftId: null, needsHumanSupport: false }, new Set(), new Set()), /unverified landlord plan/);
  assert.throws(() => validateFinalAnswer({ reply: "ok", listingIds: [], planKeys: [], draftId: "fabricated", needsHumanSupport: false }, new Set(), new Set(), new Set()), /unverified listing draft/);
  assert.throws(() => validateFinalAnswer({ reply: "https://fake.example", listingIds: [], planKeys: [], draftId: null, needsHumanSupport: false }, new Set()), /verified URLs/);
  assert.throws(() => validateFinalAnswer({ reply: "ok", listingIds: [], planKeys: [], draftId: null, needsHumanSupport: false, action: "book" }, new Set()), /required schema/);
});
