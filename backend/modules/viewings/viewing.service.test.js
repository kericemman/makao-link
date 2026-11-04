const test = require("node:test");
const assert = require("node:assert/strict");
const { transitionViewing } = require("./viewing.service");

const sample = (overrides = {}) => ({
  _id: "viewing-1", status: "requested", __v: 3,
  requestedStartAt: new Date(Date.now() + 86_400_000), requestedEndAt: new Date(Date.now() + 90_000_000),
  proposedStartAt: null, proposedEndAt: null, ...overrides
});

test("requested viewing can only be confirmed from its requested state", () => {
  const viewing = sample();
  const result = transitionViewing(viewing, "confirm", "advertiser-1");
  assert.equal(result.expectedStatus, "requested");
  assert.equal(result.expectedVersion, 3);
  assert.equal(result.updates.status, "confirmed");
  assert.equal(result.updates.confirmedStartAt.getTime(), viewing.requestedStartAt.getTime());
  assert.throws(() => transitionViewing(sample({ status: "declined" }), "confirm", "advertiser-1"), { statusCode: 409 });
});

test("a reschedule proposal is validated and confirmation uses the proposed interval", () => {
  const startAt = new Date(Date.now() + 172_800_000);
  const endAt = new Date(startAt.getTime() + 3_600_000);
  const proposal = transitionViewing(sample({ status: "confirmed" }), "propose_reschedule", "customer-1", { startAt, endAt, message: "Please move this." });
  assert.equal(proposal.updates.status, "reschedule_proposed");
  assert.equal(proposal.updates.proposalBy, "customer-1");
  const acceptance = transitionViewing(sample({ status: "reschedule_proposed", proposedStartAt: startAt, proposedEndAt: endAt }), "confirm", "advertiser-1");
  assert.equal(acceptance.updates.confirmedStartAt, startAt);
  assert.equal(acceptance.updates.proposedStartAt, null);
  assert.throws(() => transitionViewing(sample(), "propose_reschedule", "user-1", { startAt: "invalid", endAt }), { statusCode: 400 });
});

test("declined, cancelled and completed viewings cannot be reopened", () => {
  assert.throws(() => transitionViewing(sample({ status: "declined" }), "confirm", "advertiser-1"), { statusCode: 409 });
  assert.throws(() => transitionViewing(sample({ status: "cancelled" }), "cancel", "customer-1"), { statusCode: 409 });
  assert.throws(() => transitionViewing(sample({ status: "completed" }), "complete", "advertiser-1", { outcome: "viewed" }), { statusCode: 409 });
});

test("completed viewing requires an explicit outcome", () => {
  assert.throws(() => transitionViewing(sample({ status: "confirmed" }), "complete", "advertiser-1", { outcome: "unknown" }), { statusCode: 400 });
  const result = transitionViewing(sample({ status: "confirmed" }), "complete", "advertiser-1", { outcome: "viewed" });
  assert.equal(result.updates.status, "completed");
  assert.equal(result.updates.completedOutcome, "viewed");
});
