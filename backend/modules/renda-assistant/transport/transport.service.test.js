const test = require("node:test");
const assert = require("node:assert/strict");
const MockTransport = require("./mockTransport");
const { normalizeInboundEvent } = require("./transport.contract");
const { sendWithRetry } = require("./retry");
const inboundFixture = require("./fixtures/inbound-text.json");

test("mock transport returns normalized inbound text and rejects non-text provider data", async () => {
  const transport = new MockTransport({ inboundEvents: [inboundFixture] });
  const event = await transport.receiveNext();
  assert.equal(event.eventId, "fixture-event-001");
  assert.equal(event.direction, "inbound");
  assert.ok(event.occurredAt instanceof Date);
  assert.equal(await transport.receiveNext(), null);
  assert.throws(() => normalizeInboundEvent({ ...inboundFixture, contentType: "image" }), /Only inbound text/);
});

test("mock outbound send is idempotent and records deterministic delivery state", async () => {
  const transport = new MockTransport();
  const message = { contactId: "contact-1", text: "Hello", idempotencyKey: "reply-1" };
  const first = await transport.sendText(message);
  const duplicate = await transport.sendText(message);
  assert.equal(first.status, "sent");
  assert.equal(first.duplicate, false);
  assert.equal(duplicate.duplicate, true);
  assert.equal(transport.sentMessages.length, 1);
});

test("bounded retry retries transient errors then reports attempts", async () => {
  let calls = 0;
  const delays = [];
  const result = await sendWithRetry(async () => {
    calls += 1;
    if (calls < 3) throw new Error("temporary");
    return { status: "sent", providerMessageId: "mock-3" };
  }, {}, { sleep: async (ms) => delays.push(ms) });
  assert.equal(result.attempts, 3);
  assert.deepEqual(delays, [250, 500]);
});

test("bounded retry stops on permanent failure and enforces attempt ceiling", async () => {
  let calls = 0;
  await assert.rejects(sendWithRetry(async () => {
    calls += 1;
    throw Object.assign(new Error("permanent"), { retryable: false });
  }, {}, { sleep: async () => assert.fail("must not retry") }), /permanent/);
  assert.equal(calls, 1);
  await assert.rejects(sendWithRetry(async () => ({ status: "sent" }), {}, { maxAttempts: 6 }), /maxAttempts/);
});
