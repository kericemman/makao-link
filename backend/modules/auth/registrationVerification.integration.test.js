require("dotenv").config();
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const express = require("express");
const http = require("node:http");
const mongoose = require("mongoose");
const { safeDatabaseName } = require("../../scripts/migrateIdentityOrganizations");

const sentEmails = [];
const socialIdentityPath = require.resolve("./socialIdentity.service");
require.cache[socialIdentityPath] = {
  id: socialIdentityPath,
  filename: socialIdentityPath,
  loaded: true,
  exports: async ({ idToken }) => ({
    providerId: String(idToken),
    name: "Google OTP test user",
    email: `${String(idToken).replace(/[^a-z0-9-]/gi, "-")}@integration.invalid`,
    avatar: ""
  })
};
const sendEmailPath = require.resolve("../../utils/sendEmail");
require.cache[sendEmailPath] = {
  id: sendEmailPath,
  filename: sendEmailPath,
  loaded: true,
  exports: async (message) => { sentEmails.push(message); return { id: "mock-email" }; }
};

const User = require("../users/user.model");
const Subscription = require("../subscriptions/subscription.model");
const authRoutes = require("./auth.routes");
const uri = process.env.MONGO_URI_STAGING;
const runStagingIntegration = process.env.RUN_STAGING_INTEGRATION_TESTS === "true";

test("staging user and landlord registration both require email OTP and globally unique +254 phones", { skip: !runStagingIntegration ? "Set RUN_STAGING_INTEGRATION_TESTS=true to run staging database tests" : !uri && "MONGO_URI_STAGING is not configured" }, async () => {
  safeDatabaseName(uri, process.env);
  assert.ok(process.env.JWT_SECRET, "JWT_SECRET must be configured for route integration tests");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  await User.createIndexes();
  sentEmails.length = 0;

  const runId = crypto.randomUUID();
  const phone = () => `+2547${String(crypto.randomInt(0, 100000000)).padStart(8, "0")}`;
  const userPhone = phone();
  const landlordPhone = phone();
  const socialPhone = phone();
  const createdEmails = [];
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  const server = http.createServer(app);
  const call = async (path, body) => fetch(`http://127.0.0.1:${server.address().port}/api/auth${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const codeFromEmail = () => {
    const email = [...sentEmails].reverse().find((item) => item.subject === "Verify your RendaHomes email");
    const code = email?.html.match(/>\s*(\d{6})\s*</)?.[1];
    assert.ok(code, "mock email should include a six-digit OTP");
    return code;
  };

  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });

    const userEmail = `otp-user-${runId}@integration.invalid`;
    createdEmails.push(userEmail);
    const userSignup = await call("/user/register", { name: "OTP test user", email: userEmail, phone: userPhone, password: "SecureTestPassword1", role: "user" });
    const userSignupBody = await userSignup.json();
    assert.equal(userSignup.status, 201);
    assert.equal(userSignupBody.requiresVerification, true);
    assert.equal(userSignupBody.token, undefined);
    assert.equal(userSignup.headers.get("set-cookie"), null);
    assert.equal((await User.findOne({ email: userEmail })).isEmailVerified, false);

    const originalUserOtp = codeFromEmail();
    const incorrectOtp = originalUserOtp === "000000" ? "000001" : "000000";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const rejected = await call("/verify-email", { email: userEmail, otp: incorrectOtp });
      assert.equal(rejected.status, 400);
    }
    const lockedVerification = await call("/verify-email", { email: userEmail, otp: originalUserOtp });
    assert.equal(lockedVerification.status, 429);
    const resend = await call("/resend-email-otp", { email: userEmail });
    assert.equal(resend.status, 200);

    const userVerified = await call("/verify-email", { email: userEmail, otp: codeFromEmail() });
    const userVerifiedBody = await userVerified.json();
    assert.equal(userVerified.status, 200);
    assert.ok(userVerifiedBody.token);
    assert.equal(userVerifiedBody.user.phone, userPhone);

    const duplicatePhoneSignup = await call("/user/register", {
      name: "Duplicate phone user", email: `duplicate-${runId}@integration.invalid`,
      phone: userPhone.replace(/(\+254)(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4"), password: "SecureTestPassword1", role: "user"
    });
    assert.equal(duplicatePhoneSignup.status, 409);

    const landlordEmail = `otp-landlord-${runId}@integration.invalid`;
    createdEmails.push(landlordEmail);
    const landlordSignup = await call("/register", {
      name: "OTP test landlord", email: landlordEmail, phone: landlordPhone,
      password: "SecureTestPassword1", plan: "normal", acceptedLegalPolicies: true
    });
    const landlordSignupBody = await landlordSignup.json();
    assert.equal(landlordSignup.status, 201);
    assert.equal(landlordSignupBody.requiresVerification, true);
    assert.equal(landlordSignupBody.token, undefined);
    assert.equal((await User.findOne({ email: landlordEmail })).isEmailVerified, false);

    const landlordVerified = await call("/verify-email", { email: landlordEmail, otp: codeFromEmail() });
    const landlordVerifiedBody = await landlordVerified.json();
    assert.equal(landlordVerified.status, 200);
    assert.ok(landlordVerifiedBody.token);
    assert.equal(landlordVerifiedBody.user.role, "landlord");
    assert.equal(landlordVerifiedBody.subscription.plan, "normal");

    const socialToken = `google-${runId}`;
    const socialEmail = `${socialToken}@integration.invalid`;
    createdEmails.push(socialEmail);
    const socialWithoutPhone = await call("/social-login", { provider: "google", idToken: socialToken });
    assert.equal(socialWithoutPhone.status, 400);
    assert.equal(await User.exists({ email: socialEmail }), null);

    const socialDuplicatePhone = await call("/social-login", { provider: "google", idToken: socialToken, phone: userPhone });
    assert.equal(socialDuplicatePhone.status, 409);
    const socialSignup = await call("/social-login", { provider: "google", idToken: socialToken, phone: socialPhone });
    assert.equal(socialSignup.status, 201);
    const socialVerified = await call("/verify-email", { email: socialEmail, otp: codeFromEmail() });
    assert.equal(socialVerified.status, 200);
    assert.equal((await User.findOne({ email: socialEmail })).phone, socialPhone);

    const persisted = await User.find({ email: { $in: createdEmails } }).select("_id email phone phoneCanonical isEmailVerified +emailOtpHash +emailOtpAttempts").lean();
    assert.equal(persisted.length, 3);
    assert.ok(persisted.every((record) => record.phone === record.phoneCanonical && record.isEmailVerified));
    assert.ok(persisted.every((record) => record.emailOtpHash === null && record.emailOtpAttempts === 0));
  } finally {
    server.close();
    const records = await User.find({ email: { $in: createdEmails } }).select("_id").lean();
    const userIds = records.map((record) => record._id);
    await Subscription.deleteMany({ user: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });
    await mongoose.disconnect();
  }
});
