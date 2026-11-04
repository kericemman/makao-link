const test = require("node:test");
const assert = require("node:assert/strict");
const { withAuthorizationTransaction } = require("./transaction.service");

const fakeMongoose = (withTransaction) => {
  const state = { ended: false };
  return {
    state,
    startSession: async () => ({
      withTransaction,
      endSession: async () => { state.ended = true; }
    })
  };
};

test("authorization transaction returns only after its callback commits", async () => {
  const client = fakeMongoose(async (work) => work());
  assert.equal(await withAuthorizationTransaction(async () => "committed", client), "committed");
  assert.equal(client.state.ended, true);
});

test("authorization transaction propagates audit failures and always closes the session", async () => {
  const failure = new Error("audit unavailable");
  const client = fakeMongoose(async (work) => work());
  await assert.rejects(withAuthorizationTransaction(async () => { throw failure; }, client), /audit unavailable/);
  assert.equal(client.state.ended, true);
});
