require("dotenv").config();
const mongoose = require("mongoose");
mongoose.set("autoIndex", false);
const AppAlert = require("../modules/alerts/alert.model");
const { safeDatabaseName } = require("./migrateIdentityOrganizations");

const INDEX_NAME = "websiteInquiry_1_unique_objectId";
const isWebsiteInquiryIndex = (index) =>
  Object.keys(index.key || {}).length === 1 && index.key.websiteInquiry === 1;
const isDesiredIndex = (index) =>
  isWebsiteInquiryIndex(index) && index.unique === true &&
  index.partialFilterExpression?.websiteInquiry?.$type === "objectId";

const inspectWebsiteInquiryIndex = async (collection) => {
  const indexes = (await collection.indexes()).filter(isWebsiteInquiryIndex);
  const duplicateGroups = await collection.aggregate([
    { $match: { websiteInquiry: { $type: "objectId" } } },
    { $group: { _id: "$websiteInquiry", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $count: "groups" }
  ]).toArray();
  const linkedAlerts = await collection.countDocuments({ websiteInquiry: { $type: "objectId" } });
  return {
    indexes,
    duplicateGroups: duplicateGroups[0]?.groups || 0,
    linkedAlerts,
    desiredPresent: indexes.some(isDesiredIndex)
  };
};

const migrateWebsiteInquiryIndex = async ({ collection, apply = false }) => {
  const state = await inspectWebsiteInquiryIndex(collection);
  if (state.desiredPresent) return { ...state, action: "already_correct" };
  if (!apply) return { ...state, action: state.duplicateGroups ? "blocked_by_duplicates" : "would_replace" };
  if (state.duplicateGroups) throw new Error("Duplicate website inquiry links exist; reconcile them before creating the unique index.");

  const replaceable = state.indexes.filter((index) => !isDesiredIndex(index));
  if (replaceable.some((index) => index.unique || index.sparse || index.partialFilterExpression)) {
    throw new Error("An unexpected websiteInquiry index exists; manual review is required.");
  }

  for (const index of replaceable) await collection.dropIndex(index.name);
  try {
    await collection.createIndex(
      { websiteInquiry: 1 },
      { name: INDEX_NAME, unique: true, partialFilterExpression: { websiteInquiry: { $type: "objectId" } } }
    );
    return { ...state, action: "created_unique_partial_index" };
  } catch (error) {
    for (const index of replaceable) {
      await collection.createIndex(index.key, { name: index.name }).catch(() => {});
    }
    throw error;
  }
};

const main = async () => {
  if (process.env.RENDA_APP_ALERT_INDEX_MIGRATION_TARGET !== "staging") {
    throw new Error("Set RENDA_APP_ALERT_INDEX_MIGRATION_TARGET=staging to select the non-production target.");
  }
  const databaseName = safeDatabaseName(process.env.MONGO_URI_STAGING, {
    ...process.env,
    RENDA_IDENTITY_MIGRATION_TARGET: "staging"
  });
  await mongoose.connect(process.env.MONGO_URI_STAGING);
  const result = await migrateWebsiteInquiryIndex({ collection: AppAlert.collection, apply: process.argv.includes("--apply") });
  console.log(JSON.stringify({
    mode: process.argv.includes("--apply") ? "apply" : "dry-run",
    target: "staging",
    databaseName,
    linkedAlerts: result.linkedAlerts,
    duplicateGroups: result.duplicateGroups,
    indexAction: result.action
  }));
};

if (require.main === module) {
  main().catch((error) => {
    console.error("AppAlert index migration failed:", error.message);
    process.exitCode = 1;
  }).finally(async () => {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  });
}

module.exports = { INDEX_NAME, inspectWebsiteInquiryIndex, isDesiredIndex, migrateWebsiteInquiryIndex };
