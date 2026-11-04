require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../modules/users/user.model");
const { safeDatabaseName } = require("./migrateIdentityOrganizations");

const apply = process.argv.includes("--apply");
const productionTarget = process.argv.includes("--target=production");
const confirmedProduction = process.argv.includes("--confirm-production-phone-backfill");

const canonicalizeExistingPhone = (value) => {
  const digits = String(value || "").trim().replace(/\D/g, "");
  if (/^254[17]\d{8}$/.test(digits)) return `+${digits}`;
  if (/^0[17]\d{8}$/.test(digits)) return `+254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) return `+254${digits}`;
  return null;
};

async function main() {
  const uri = productionTarget ? process.env.MONGO_URI : process.env.MONGO_URI_STAGING;
  let database;
  if (productionTarget) {
    if (!confirmedProduction || process.env.NODE_ENV !== "production" || !uri || uri === process.env.MONGO_URI_STAGING) {
      throw new Error("Production target requires NODE_ENV=production, MONGO_URI, and --confirm-production-phone-backfill.");
    }
    try {
      const parsed = new URL(uri);
      database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
      if (!parsed.username || !parsed.hostname || !database) throw new Error("missing production database identity");
    } catch {
      throw new Error("MONGO_URI must identify the explicitly selected production database.");
    }
  } else {
    database = safeDatabaseName(uri, process.env);
  }
  await mongoose.connect(uri);

  const users = await User.find({}).select("phone +phoneCanonical").lean();
  const byCanonical = new Map();
  const changes = [];
  const invalidAccountIds = [];
  let missing = 0;
  let invalid = 0;

  for (const user of users) {
    const raw = String(user.phone || "").trim();
    if (!raw || raw === "N/A") {
      missing += 1;
      continue;
    }
    const canonical = canonicalizeExistingPhone(raw);
    if (!canonical) {
      invalid += 1;
      invalidAccountIds.push(String(user._id));
      continue;
    }
    const ids = byCanonical.get(canonical) || [];
    ids.push(user._id);
    byCanonical.set(canonical, ids);
    if (raw !== canonical || user.phoneCanonical !== canonical) changes.push({ id: user._id, canonical });
  }

  const duplicateGroups = [...byCanonical.values()].filter((ids) => ids.length > 1);
  const duplicateAccountIds = duplicateGroups.map((ids) => ids.map(String));
  const summary = {
    mode: apply ? "apply" : "dry-run",
    target: productionTarget ? "production" : "staging",
    database,
    users: users.length,
    missingOrPlaceholder: missing,
    invalid: invalid,
    valuesToNormalize: changes.length,
    duplicateCanonicalGroups: duplicateGroups.length
  };
  process.stdout.write(`${JSON.stringify({ ...summary, duplicateAccountIds, invalidAccountIds })}\n`);

  if (!apply) return;
  if (duplicateGroups.length || invalid) {
    throw new Error("Refusing to apply phone backfill until duplicates and invalid values are resolved.");
  }

  await User.createIndexes();
  for (const change of changes) {
    await User.collection.updateOne(
      { _id: change.id },
      { $set: { phone: change.canonical, phoneCanonical: change.canonical } }
    );
  }
  process.stdout.write(JSON.stringify({ mode: "applied", normalized: changes.length, uniquePhoneIndex: "ready" }) + "\n");
}

main()
  .catch((error) => {
    process.stderr.write(`Canonical phone migration failed: ${error.message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  });
