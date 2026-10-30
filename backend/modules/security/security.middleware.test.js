const test = require("node:test");
const assert = require("node:assert/strict");
const { createRateLimiter } = require("../../middleware/security.middleware");

const request = (ip) => ({ ip, headers: {}, socket: { remoteAddress: ip } });

const response = () => {
  const result = { statusCode: 200, headers: {}, body: null };
  result.set = (name, value) => { result.headers[name] = value; return result; };
  result.status = (code) => { result.statusCode = code; return result; };
  result.json = (body) => { result.body = body; return result; };
  return result;
};

const run = (middleware, ip) => {
  const res = response();
  let passed = false;
  middleware(request(ip), res, () => { passed = true; });
  return { res, passed };
};

test("rate limiter expires a client's window and allows a fresh request", (t) => {
  let now = 1_000;
  t.mock.method(Date, "now", () => now);
  const limiter = createRateLimiter({ windowMs: 1_000, max: 1, message: "limited" });

  assert.equal(run(limiter, "192.0.2.1").passed, true);
  assert.equal(run(limiter, "192.0.2.1").res.statusCode, 429);
  now += 1_001;
  assert.equal(run(limiter, "192.0.2.1").passed, true);
});

test("rate limiter removes expired clients and bounds tracked client state", (t) => {
  let now = 1_000;
  t.mock.method(Date, "now", () => now);
  const limiter = createRateLimiter({ windowMs: 1_000, max: 1, maxEntries: 2, cleanupIntervalMs: 1_000, message: "limited" });

  run(limiter, "192.0.2.1");
  run(limiter, "192.0.2.2");
  now += 1_001;
  assert.equal(run(limiter, "192.0.2.3").passed, true);
  assert.equal(run(limiter, "192.0.2.1").passed, true);
});

test("rate limiter evicts the oldest key when its state cap is reached", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, max: 1, maxEntries: 2, message: "limited" });

  run(limiter, "192.0.2.1");
  run(limiter, "192.0.2.2");
  assert.equal(run(limiter, "192.0.2.3").passed, true);
  assert.equal(run(limiter, "192.0.2.1").passed, true);
});
