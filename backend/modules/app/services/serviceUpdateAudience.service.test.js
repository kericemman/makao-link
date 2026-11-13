const test = require("node:test");
const assert = require("node:assert/strict");
const { getServiceUpdateRecipients, mergeServiceUpdateSubscribers, sourceFilter } = require("./serviceUpdateAudience.service");

const query = (value) => ({ select() { return this; }, lean: async () => value });

test("website update audience automatically includes verified landlords and deduplicates addresses", async () => {
  const UserModel = {
    find(filter) {
      assert.equal(filter.isEmailVerified, true);
      return query([{ email: "Owner@Example.com" }, { email: "website@example.com" }]);
    }
  };
  const SubscriberModel = {
    find(filter) {
      if (filter.email) return query([]);
      return query([{ email: "website@example.com" }, { email: "other@example.com" }]);
    }
  };

  const recipients = await getServiceUpdateRecipients({ audience: "website", SubscriberModel, UserModel });
  assert.deepEqual(recipients.sort(), ["other@example.com", "owner@example.com", "website@example.com"]);
});

test("inactive landlord service-update preference is honored without affecting newsletter records", async () => {
  const UserModel = { find: () => query([{ email: "optout@example.com" }]) };
  const SubscriberModel = {
    find(filter) {
      if (filter.email) return query([{ email: "optout@example.com", isActive: false }]);
      return query([]);
    }
  };

  assert.deepEqual(await getServiceUpdateRecipients({ audience: "website", SubscriberModel, UserModel }), []);
});

test("mobile-only update audience does not query landlord or article-newsletter records", async () => {
  let userQueryCount = 0;
  const UserModel = { find: () => { userQueryCount += 1; return query([]); } };
  const SubscriberModel = { find: (filter) => {
    assert.deepEqual(filter, sourceFilter("mobile_app"));
    return query([{ email: "mobile@example.com" }]);
  } };

  assert.deepEqual(await getServiceUpdateRecipients({ audience: "mobile_app", SubscriberModel, UserModel }), ["mobile@example.com"]);
  assert.equal(userQueryCount, 0);
});

test("subscriber list includes verified landlord accounts by default but preserves service-update opt-outs", () => {
  const subscribers = mergeServiceUpdateSubscribers({
    subscribers: [{ email: "optout@example.com", source: "website", sources: ["website"], isActive: false }],
    landlords: [
      { email: "new-landlord@example.com", createdAt: new Date("2026-01-01") },
      { email: "optout@example.com" }
    ]
  });
  const landlord = subscribers.find((item) => item.email === "new-landlord@example.com");
  const optedOut = subscribers.find((item) => item.email === "optout@example.com");
  assert.equal(landlord.isActive, true);
  assert.equal(landlord.landlordAccounts, true);
  assert.equal(optedOut.isActive, false);
  assert.equal(optedOut.landlordAccounts, true);
});
