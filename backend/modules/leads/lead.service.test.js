const test = require("node:test");
const assert = require("node:assert/strict");
const { canTransitionLead } = require("./lead.service");

test("lead progression permits forward contact, viewing and outcome states", () => {
  assert.equal(canTransitionLead("new", "contacted"), true);
  assert.equal(canTransitionLead("contacted", "viewing_requested"), true);
  assert.equal(canTransitionLead("viewing_confirmed", "viewed"), true);
  assert.equal(canTransitionLead("viewed", "closed_successful"), true);
});

test("closed leads cannot be reopened and unknown stages are rejected", () => {
  assert.equal(canTransitionLead("closed_successful", "contacted"), false);
  assert.equal(canTransitionLead("closed_unsuccessful", "viewing_requested"), false);
  assert.equal(canTransitionLead("new", "made_up"), false);
});
