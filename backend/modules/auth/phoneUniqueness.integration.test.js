require("dotenv").config();
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../users/user.model");
const { safeDatabaseName } = require("../../scripts/migrateIdentityOrganizations");

const uri = process.env.MONGO_URI_STAGING;

test("staging phone index enforces canonical uniqueness across account roles", { skip: !uri && "MONGO_URI_STAGING is not configured" }, async (t) => {
  safeDatabaseName(uri, process.env);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  await User.createIndexes();
  const suffix = String(crypto.randomInt(0, 100000000)).padStart(8, "0");
  const canonical = `+2547${suffix}`;
  const emailPrefix = `phone-${crypto.randomBytes(6).toString("hex")}`;
  const created = [];

  try {
    const first = await User.create({
      name: "Phone uniqueness test customer",
      email: `${emailPrefix}-user@example.test`,
      password: crypto.randomBytes(32).toString("hex"),
      phone: `${canonical.slice(0, 4)} ${canonical.slice(4, 7)} ${canonical.slice(7, 10)} ${canonical.slice(10)}`,
      role: "user"
    });
    created.push(first._id);
    assert.equal(first.phone, canonical);
    assert.equal(first.phoneCanonical, canonical);

    await assert.rejects(
      User.create({
        name: "Phone uniqueness test landlord",
        email: `${emailPrefix}-landlord@example.test`,
        password: crypto.randomBytes(32).toString("hex"),
        phone: canonical,
        role: "landlord"
      }),
      (error) => error.code === 11000
    );
  } finally {
    await User.deleteMany({ _id: { $in: created } });
    await mongoose.disconnect();
  }
});
