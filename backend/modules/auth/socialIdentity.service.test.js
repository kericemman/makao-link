const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { createSocialIdentityVerifier } = require("./socialIdentity.service");

const originalEnv = { ...process.env };
const now = Date.now();
const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "test-key", use: "sig", alg: "RS256" };

const sign = (claims) => jwt.sign(
  { iat: Math.floor(now / 1000), exp: Math.floor(now / 1000) + 300, ...claims },
  privateKey,
  { algorithm: "RS256", keyid: "test-key" }
);

test.beforeEach(() => {
  process.env.GOOGLE_OAUTH_CLIENT_IDS = "web-client, mobile-client";
});

test.after(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
});

test("Google identity is derived from a verified provider token, not request profile fields", async () => {
  const verifier = createSocialIdentityVerifier({ now: () => now, getJson: async () => ({ keys: [jwk] }) });
  const identity = await verifier({
    provider: "google",
    idToken: sign({
      iss: "https://accounts.google.com",
      aud: "mobile-client",
      sub: "google-subject",
      email: "verified@example.com",
      email_verified: true,
      name: "Verified Name",
      picture: "https://images.example.com/avatar.jpg"
    })
  });

  assert.deepEqual(identity, {
    provider: "google",
    providerId: "google-subject",
    email: "verified@example.com",
    name: "Verified Name",
    avatar: "https://images.example.com/avatar.jpg"
  });
});

test("Google rejects invalid audience, unverified email, and expired tokens", async () => {
  const verifier = createSocialIdentityVerifier({ now: () => now, getJson: async () => ({ keys: [jwk] }) });
  const base = { iss: "https://accounts.google.com", sub: "subject", email: "user@example.com", email_verified: true };

  await assert.rejects(verifier({ provider: "google", idToken: sign({ ...base, aud: "attacker-client" }) }), { statusCode: 401 });
  await assert.rejects(verifier({ provider: "google", idToken: sign({ ...base, aud: "web-client", email_verified: false }) }), { statusCode: 401 });
  await assert.rejects(
    verifier({ provider: "google", idToken: jwt.sign({ ...base, aud: "web-client", exp: Math.floor(now / 1000) - 10 }, privateKey, { algorithm: "RS256", keyid: "test-key" }) }),
    { statusCode: 401 }
  );
});

test("unsupported providers and missing Google configuration are rejected", async () => {
  const verifier = createSocialIdentityVerifier({ getJson: async () => ({ keys: [jwk] }) });
  await assert.rejects(verifier({ provider: "apple", idToken: "x" }), { statusCode: 400 });

  delete process.env.GOOGLE_OAUTH_CLIENT_IDS;
  await assert.rejects(
    verifier({ provider: "google", idToken: sign({ iss: "https://accounts.google.com", aud: "web-client", sub: "subject" }) }),
    { statusCode: 503 }
  );
});
