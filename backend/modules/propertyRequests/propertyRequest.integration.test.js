require("dotenv").config();
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const express = require("express");
const http = require("node:http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { safeDatabaseName } = require("../../scripts/migrateIdentityOrganizations");
const User = require("../users/user.model");
const PropertyRequest = require("./propertyRequest.model");
const ListingMatch = require("./listingMatch.model");
const propertyRequestRoutes = require("./propertyRequest.routes");

const uri = process.env.MONGO_URI_STAGING;
const runStagingIntegration = process.env.RUN_STAGING_INTEGRATION_TESTS === "true";

test("staging property request handoff persists idempotently and remains customer-scoped", { skip: !runStagingIntegration ? "Set RUN_STAGING_INTEGRATION_TESTS=true to run staging database tests" : !uri && "MONGO_URI_STAGING is not configured" }, async (t) => {
  safeDatabaseName(uri, process.env);
  assert.ok(process.env.JWT_SECRET, "JWT_SECRET must be configured for route integration tests");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

  const runId = crypto.randomUUID();
  const createdUsers = [];
  const app = express();
  app.use(express.json());
  app.use("/api/property-requests", propertyRequestRoutes);
  const server = http.createServer(app);

  const createUser = async (suffix) => {
    const user = await User.create({
      name: `Request Integration ${suffix}`,
      email: `request.${suffix}.${runId}@integration.invalid`,
      phone: `+2547${String(crypto.randomInt(0, 100000000)).padStart(8, "0")}`,
      password: crypto.randomBytes(24).toString("hex"),
      role: "user",
      roles: ["user"]
    });
    createdUsers.push(user._id);
    return user;
  };
  const tokenFor = (user) => jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET, { expiresIn: "5m" });
  const request = async (method, path, token, body, key) => fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(key ? { "Idempotency-Key": key } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });

  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const customer = await createUser("customer");
    const otherCustomer = await createUser("other");
    const customerToken = tokenFor(customer);
    const otherToken = tokenFor(otherCustomer);
    const county = `NoCounty-${runId}`;
    const town = `NoListing-${runId}`;
    const payload = {
      purpose: "rent",
      pricePeriod: "monthly",
      budgetMin: 20000,
      budgetMax: 45000,
      preferredLocations: [{ county, town }],
      propertyTypes: ["apartment"],
      minBedrooms: 2,
      requirements: "Staging integration request",
      consent: { matching: true }
    };
    const key = crypto.randomUUID();

    const firstResponse = await request("POST", "/api/property-requests", customerToken, payload, key);
    assert.equal(firstResponse.status, 201);
    const first = await firstResponse.json();
    const requestId = first.propertyRequest._id;
    assert.ok(requestId);

    await t.test("retry after a lost acknowledgement returns the original request", async () => {
      const duplicateResponse = await request("POST", "/api/property-requests", customerToken, payload, key);
      assert.equal(duplicateResponse.status, 200);
      const duplicate = await duplicateResponse.json();
      assert.equal(duplicate.duplicate, true);
      assert.equal(duplicate.propertyRequest._id, requestId);
      assert.equal(await PropertyRequest.countDocuments({ customer: customer._id }), 1);
    });

    await t.test("reusing the same key for changed criteria is rejected", async () => {
      const changed = await request("POST", "/api/property-requests", customerToken, { ...payload, budgetMax: 50000 }, key);
      assert.equal(changed.status, 409);
      assert.equal(await PropertyRequest.countDocuments({ customer: customer._id }), 1);
    });

    await t.test("matching no results is persisted and retry targets the same owned request", async () => {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const response = await request("POST", `/api/property-requests/${requestId}/matches`, customerToken, {});
        assert.equal(response.status, 200);
        const result = await response.json();
        assert.equal(result.count, 0);
      }
      const stored = await PropertyRequest.findById(requestId).lean();
      assert.equal(String(stored.customer), String(customer._id));
      assert.ok(stored.lastMatchedAt);
      assert.equal(await ListingMatch.countDocuments({ propertyRequest: requestId, invalidatedAt: null }), 0);
    });

    await t.test("another customer cannot read or match the request", async () => {
      assert.equal((await request("GET", `/api/property-requests/${requestId}`, otherToken)).status, 404);
      assert.equal((await request("POST", `/api/property-requests/${requestId}/matches`, otherToken, {})).status, 404);
    });

    await t.test("request and match state survive the account list refresh", async () => {
      const response = await request("GET", "/api/property-requests", customerToken);
      assert.equal(response.status, 200);
      const list = await response.json();
      const saved = list.propertyRequests.find((item) => item._id === requestId);
      assert.ok(saved);
      assert.ok(saved.lastMatchedAt);
      assert.deepEqual(list.matchesByRequest[requestId] || [], []);
    });
  } finally {
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    const fixtureRequests = await PropertyRequest.find({ customer: { $in: createdUsers } }).select("_id").lean();
    const fixtureRequestIds = fixtureRequests.map((item) => item._id);
    await Promise.all([
      ListingMatch.deleteMany({ propertyRequest: { $in: fixtureRequestIds } }),
      PropertyRequest.deleteMany({ _id: { $in: fixtureRequestIds } }),
      User.deleteMany({ _id: { $in: createdUsers } })
    ]);
    await mongoose.disconnect();
  }
});
