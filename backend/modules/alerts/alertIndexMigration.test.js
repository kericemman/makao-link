const test = require("node:test");
const assert = require("node:assert/strict");
const { INDEX_NAME, migrateWebsiteInquiryIndex } = require("../../scripts/migrateAppAlertWebsiteInquiryIndex");

const desiredIndex = {
  name: INDEX_NAME,
  key: { websiteInquiry: 1 },
  unique: true,
  partialFilterExpression: { websiteInquiry: { $type: "objectId" } }
};

const mockCollection = ({ indexes = [], duplicates = 0, linked = 0 } = {}) => {
  const calls = [];
  return {
    calls,
    indexes: async () => indexes,
    aggregate: () => ({ toArray: async () => duplicates ? [{ groups: duplicates }] : [] }),
    countDocuments: async () => linked,
    dropIndex: async (name) => calls.push(["drop", name]),
    createIndex: async (key, options) => { calls.push(["create", key, options]); return options.name; }
  };
};

test("dry-run reports the current index and duplicate count without changing indexes", async () => {
  const collection = mockCollection({ indexes: [{ name: "websiteInquiry_1", key: { websiteInquiry: 1 } }], linked: 4 });
  const result = await migrateWebsiteInquiryIndex({ collection });
  assert.equal(result.action, "would_replace");
  assert.equal(result.linkedAlerts, 4);
  assert.deepEqual(collection.calls, []);
});

test("apply refuses duplicate inquiry links before dropping an existing index", async () => {
  const collection = mockCollection({ indexes: [{ name: "websiteInquiry_1", key: { websiteInquiry: 1 } }], duplicates: 1 });
  await assert.rejects(migrateWebsiteInquiryIndex({ collection, apply: true }), /Duplicate website inquiry links/);
  assert.deepEqual(collection.calls, []);
});

test("apply replaces a simple index with a unique partial index", async () => {
  const collection = mockCollection({ indexes: [{ name: "websiteInquiry_1", key: { websiteInquiry: 1 } }] });
  const result = await migrateWebsiteInquiryIndex({ collection, apply: true });
  assert.equal(result.action, "created_unique_partial_index");
  assert.equal(collection.calls[0][0], "drop");
  assert.deepEqual(collection.calls[1], ["create", { websiteInquiry: 1 }, {
    name: INDEX_NAME,
    unique: true,
    partialFilterExpression: { websiteInquiry: { $type: "objectId" } }
  }]);
});

test("an existing correct index makes the migration idempotent", async () => {
  const collection = mockCollection({ indexes: [desiredIndex] });
  const result = await migrateWebsiteInquiryIndex({ collection, apply: true });
  assert.equal(result.action, "already_correct");
  assert.deepEqual(collection.calls, []);
});
