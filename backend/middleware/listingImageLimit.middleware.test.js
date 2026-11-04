const test = require("node:test");
const assert = require("node:assert/strict");
const Subscription = require("../modules/subscriptions/subscription.model");
const listingImageLimit = require("./listingImageLimit.middleware");

const run = (request) => new Promise((resolve, reject) => {
  listingImageLimit(request, {}, (error) => error ? reject(error) : resolve(request.maxListingImages));
});

test("listing image limits are 15 for Free and 30 for active paid plans", async (t) => {
  t.mock.method(Subscription, "findOne", ({ user }) => ({
    select: async () => user === "free-owner"
      ? { plan: "normal", status: "free" }
      : { plan: "basic", status: "active" }
  }));

  assert.equal(await run({ user: { _id: "free-owner" } }), 15);
  assert.equal(await run({ user: { _id: "paid-owner" } }), 30);
});
