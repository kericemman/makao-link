const test = require("node:test");
const assert = require("node:assert/strict");
const { API_URL, getConfig, normalizeRecipient, sendText } = require("./whatChimpTransport");

const env = {
  WHATCHIMP_ENABLED: "true",
  WHATCHIMP_API_KEY: "test-secret",
  WHATCHIMP_PHONE_NUMBER_ID: "phone-id"
};

test("WhatChimp transport is disabled unless explicitly enabled", () => {
  assert.throws(() => getConfig({ ...env, WHATCHIMP_ENABLED: "false" }), { name: "WhatsAppTransportDisabledError", statusCode: 503 });
  assert.throws(() => getConfig({ ...env, WHATCHIMP_API_KEY: "" }), /configuration is incomplete/);
});

test("recipient normalization accepts international digits and rejects malformed numbers", () => {
  assert.equal(normalizeRecipient("+254 712 345 678"), "254712345678");
  assert.throws(() => normalizeRecipient("not-a-number"), /valid WhatsApp recipient/);
});

test("text sender uses documented form fields and returns only provider identifiers", async () => {
  let request;
  const result = await sendText({
    phoneNumber: "+254 712 345 678",
    text: "Hello",
    env,
    httpClient: {
      async post(...args) {
        request = args;
        return { data: { status: "1", wa_message_id: "wamid-test", message: "sent" } };
      }
    }
  });
  assert.equal(request[0], API_URL);
  assert.equal(request[1].get("apiToken"), "test-secret");
  assert.equal(request[1].get("phone_number_id"), "phone-id");
  assert.equal(request[1].get("phone_number"), "254712345678");
  assert.equal(request[1].get("message"), "Hello");
  assert.equal(request[2].maxRedirects, 0);
  assert.deepEqual(result, { status: "sent", providerMessageId: "wamid-test" });
});

test("provider rejection and ambiguous network outcome are not retried", async () => {
  await assert.rejects(sendText({
    phoneNumber: "254712345678", text: "Hello", env,
    httpClient: { async post() { return { data: { status: "0", message: "private provider detail" } }; } }
  }), (error) => error.code === "WHATCHIMP_SEND_REJECTED" && !error.retryable && !error.message.includes("private provider detail"));
  await assert.rejects(sendText({
    phoneNumber: "254712345678", text: "Hello", env,
    httpClient: { async post() { throw new Error("secret-bearing network error"); } }
  }), (error) => error.name === "WhatsAppDeliveryUnknownError" && error.retryable === false && !error.message.includes("secret-bearing"));
});
