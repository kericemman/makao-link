require("dotenv").config();
process.env.RENDA_ASSISTANT_STATUS_NOTIFICATIONS_ENABLED = "false";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const express = require("express");
const http = require("node:http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { safeDatabaseName } = require("../../scripts/migrateIdentityOrganizations");
const User = require("../users/user.model");
const Listing = require("../listings/listings.model");
const PropertyRequest = require("../propertyRequests/propertyRequest.model");
const ListingMatch = require("../propertyRequests/listingMatch.model");
const Viewing = require("./viewing.model");
const Lead = require("../leads/lead.model");
const AuditRecord = require("../authorization/auditRecord.model");
const viewingRoutes = require("./viewing.routes");

const uri = process.env.MONGO_URI_STAGING;
const runStagingIntegration = process.env.RUN_STAGING_INTEGRATION_TESTS === "true";

test("staging viewing attribution is customer-owned and match-scoped", { skip: !runStagingIntegration ? "Set RUN_STAGING_INTEGRATION_TESTS=true to run staging database tests" : !uri && "MONGO_URI_STAGING is not configured" }, async () => {
  safeDatabaseName(uri, process.env);
  assert.ok(process.env.JWT_SECRET, "JWT_SECRET must be configured for route integration tests");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

  const runId = crypto.randomUUID();
  const created = { users: [], listings: [], requests: [], matches: [], viewings: [] };
  const app = express();
  app.use(express.json());
  app.use("/api/viewings", viewingRoutes);
  const server = http.createServer(app);

  const makeUser = async (suffix) => {
    const user = await User.create({
      name: `Viewing Attribution ${suffix}`,
      email: `viewing.${suffix}.${runId}@integration.invalid`,
      phone: `+2547${String(crypto.randomInt(0, 100000000)).padStart(8, "0")}`,
      password: crypto.randomBytes(24).toString("hex"),
      role: suffix === "landlord" ? "landlord" : "user",
      roles: [suffix === "landlord" ? "landlord" : "user"]
    });
    created.users.push(user._id);
    return user;
  };
  const tokenFor = (user) => jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET, { expiresIn: "5m" });
  const call = async (token, body) => fetch(`http://127.0.0.1:${server.address().port}/api/viewings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify(body)
  });

  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const customer = await makeUser("customer");
    const otherCustomer = await makeUser("other");
    const landlord = await makeUser("landlord");
    const listing = await Listing.create({
      title: `Viewing attribution fixture ${runId}`,
      description: "Synthetic staging-only listing.",
      purpose: "rent",
      price: 45000,
      county: "nairobi",
      town: "westlands",
      type: "apartment",
      bedrooms: 2,
      bathrooms: 1,
      contactPhone: "+254700000003",
      landlord: landlord._id,
      status: "approved",
      availability: "available",
      isActive: true
    });
    created.listings.push(listing._id);
    const propertyRequest = await PropertyRequest.create({
      customer: customer._id,
      purpose: "rent",
      preferredLocations: [{ county: "nairobi" }],
      propertyTypes: ["apartment"],
      minBedrooms: 2,
      budgetMax: 50000,
      pricePeriod: "monthly",
      consent: { matching: true },
      status: "matched"
    });
    created.requests.push(propertyRequest._id);
    const match = await ListingMatch.create({
      propertyRequest: propertyRequest._id,
      listing: listing._id,
      matchingVersion: 1,
      score: 90,
      classification: "exact",
      reasons: ["Synthetic integration match"]
    });
    created.matches.push(match._id);

    const start = new Date(Date.now() + 86_400_000);
    const body = {
      listingId: String(listing._id),
      propertyRequestId: String(propertyRequest._id),
      requestedStartAt: start.toISOString(),
      requestedEndAt: new Date(start.getTime() + 3_600_000).toISOString(),
      timezone: "Africa/Nairobi",
      contactSharingConsent: true
    };
    const response = await call(tokenFor(customer), body);
    assert.equal(response.status, 201);
    const result = await response.json();
    const viewingId = result.viewing._id;
    created.viewings.push(viewingId);

    const storedViewing = await Viewing.findById(viewingId).select("+propertyRequest").lean();
    assert.equal(String(storedViewing.propertyRequest), String(propertyRequest._id));
    const lead = await Lead.findOne({ sourceModel: "Viewing", sourceRecord: viewingId }).select("+propertyRequests").lean();
    assert.ok(lead);
    assert.deepEqual(lead.propertyRequests.map(String), [String(propertyRequest._id)]);

    const unauthorized = await call(tokenFor(otherCustomer), body);
    assert.equal(unauthorized.status, 404);
    assert.equal(await Viewing.countDocuments({ listing: listing._id }), 1);

    const unmatchedRequest = await PropertyRequest.create({
      customer: customer._id,
      purpose: "rent",
      budgetMax: 50000,
      pricePeriod: "monthly",
      consent: { matching: true },
      status: "active"
    });
    created.requests.push(unmatchedRequest._id);
    const stale = await call(tokenFor(customer), { ...body, propertyRequestId: String(unmatchedRequest._id) });
    assert.equal(stale.status, 409);
    assert.equal(await Viewing.countDocuments({ listing: listing._id }), 1);
  } finally {
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    await Promise.all([
      AuditRecord.deleteMany({ actor: { $in: created.users }, action: "viewing.requested" }),
      Lead.deleteMany({ listing: { $in: created.listings } }),
      Viewing.deleteMany({ _id: { $in: created.viewings } }),
      ListingMatch.deleteMany({ _id: { $in: created.matches } }),
      PropertyRequest.deleteMany({ _id: { $in: created.requests } }),
      Listing.deleteMany({ _id: { $in: created.listings } }),
      User.deleteMany({ _id: { $in: created.users } })
    ]);
    await mongoose.disconnect();
  }
});
