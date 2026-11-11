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
const Listing = require("../listings/listings.model");
const PropertyRequest = require("./propertyRequest.model");
const ListingMatch = require("./listingMatch.model");
const propertyRequestRoutes = require("./propertyRequest.routes");

const uri = process.env.MONGO_URI_STAGING;
const runStagingIntegration = process.env.RUN_STAGING_INTEGRATION_TESTS === "true";

test("staging Renda Match ranks exact listings and persists explainable versioned results", { skip: !runStagingIntegration ? "Set RUN_STAGING_INTEGRATION_TESTS=true to run staging database tests" : !uri && "MONGO_URI_STAGING is not configured" }, async () => {
  safeDatabaseName(uri, process.env);
  assert.ok(process.env.JWT_SECRET, "JWT_SECRET must be configured for route integration tests");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

  const runId = crypto.randomUUID();
  const created = { users: [], listings: [], requests: [], matches: [] };
  const app = express();
  app.use(express.json());
  app.use("/api/property-requests", propertyRequestRoutes);
  const server = http.createServer(app);
  let advertiser;

  const addListing = async ({ town, price, status = "approved", availability = "available" }) => {
    const listing = await Listing.create({
      title: `Match fixture ${runId}`,
      description: "Synthetic staging-only Renda Match fixture.",
      purpose: "rent",
      price,
      county: "nairobi",
      town,
      type: "villa",
      bedrooms: 99,
      bathrooms: 1,
      contactPhone: "+254700000000",
      landlord: advertiser._id,
      status,
      availability,
      isActive: true
    });
    created.listings.push(listing._id);
    return listing;
  };

  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const customer = await User.create({
      name: "Match Integration Customer",
      email: `match.${runId}@integration.invalid`,
      phone: `+254700${crypto.randomInt(100000, 999999)}`,
      password: crypto.randomBytes(24).toString("hex"),
      role: "user",
      roles: ["user"]
    });
    created.users.push(customer._id);
    advertiser = await User.create({
      name: "Match Integration Advertiser",
      email: `advertiser.${runId}@integration.invalid`,
      phone: `+254700${crypto.randomInt(100000, 999999)}`,
      password: crypto.randomBytes(24).toString("hex"),
      role: "landlord",
      roles: ["landlord"]
    });
    created.users.push(advertiser._id);
    const preferredTown = "westlands";
    const alternateTown = "kilimani";
    const preferred = await addListing({ town: preferredTown, price: 880000 });
    const alternate = await addListing({ town: alternateTown, price: 880000 });
    await addListing({ town: preferredTown, price: 920000 });
    await addListing({ town: preferredTown, price: 870000, availability: "taken" });
    await addListing({ town: preferredTown, price: 870000, status: "pending" });

    const token = jwt.sign({ id: String(customer._id) }, process.env.JWT_SECRET, { expiresIn: "5m" });
    const createResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/property-requests`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        purpose: "rent",
        pricePeriod: "monthly",
        budgetMin: 870000,
        budgetMax: 900000,
        preferredLocations: [{ county: "Nairobi", town: preferredTown }, { county: "NAIROBI", town: alternateTown }],
        propertyTypes: ["villa"],
        minBedrooms: 99,
        consent: { matching: true }
      })
    });
    assert.equal(createResponse.status, 201);
    const createdBody = await createResponse.json();
    const requestId = createdBody.propertyRequest._id;
    created.requests.push(requestId);

    const matchResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/property-requests/${requestId}/matches`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: "{}"
    });
    assert.equal(matchResponse.status, 200);
    const result = await matchResponse.json();
    assert.equal(result.count, 2);
    assert.deepEqual(result.matches.map((listing) => listing._id), [String(preferred._id), String(alternate._id)]);
    assert.ok(result.matches.every((listing) => listing.match.classification === "exact" && listing.match.reasons.includes("Within your budget")));

    const savedMatches = await ListingMatch.find({ propertyRequest: requestId, invalidatedAt: null }).sort({ score: -1 }).lean();
    created.matches.push(...savedMatches.map((match) => match._id));
    assert.equal(savedMatches.length, 2);
    assert.ok(savedMatches.every((match) => match.matchingVersion === 2));
    assert.equal((await PropertyRequest.findById(requestId).lean()).status, "matched");

    const alternativeRequestResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/property-requests`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        purpose: "rent",
        pricePeriod: "monthly",
        budgetMin: 870000,
        budgetMax: 900000,
        preferredLocations: [{ county: "Nairobi", town: "parklands" }],
        propertyTypes: ["villa"],
        minBedrooms: 99,
        consent: { matching: true }
      })
    });
    assert.equal(alternativeRequestResponse.status, 201);
    const alternativeRequest = (await alternativeRequestResponse.json()).propertyRequest;
    created.requests.push(alternativeRequest._id);
    const alternativeResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/property-requests/${alternativeRequest._id}/matches`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: "{}"
    });
    assert.equal(alternativeResponse.status, 200);
    const alternativeResult = await alternativeResponse.json();
    const fixtureAlternativeIds = alternativeResult.matches.map((listing) => listing._id).filter((id) => [String(preferred._id), String(alternate._id)].includes(id));
    assert.deepEqual(new Set(fixtureAlternativeIds), new Set([String(preferred._id), String(alternate._id)]));
    assert.ok(alternativeResult.matches.every((listing) => listing.match.classification === "alternative"));
    assert.ok(alternativeResult.matches.every((listing) => listing.match.reasons.some((reason) => reason.startsWith("Different town in your selected county:"))));
    const savedAlternatives = await ListingMatch.find({ propertyRequest: alternativeRequest._id, invalidatedAt: null }).lean();
    assert.ok(savedAlternatives.length >= 2);
    assert.ok(savedAlternatives.every((match) => match.classification === "alternative" && match.matchingVersion === 2));
  } finally {
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    await Promise.all([
      ListingMatch.deleteMany({ $or: [{ _id: { $in: created.matches } }, { propertyRequest: { $in: created.requests } }] }),
      PropertyRequest.deleteMany({ _id: { $in: created.requests } }),
      Listing.deleteMany({ _id: { $in: created.listings } }),
      User.deleteMany({ _id: { $in: created.users } })
    ]);
    await mongoose.disconnect();
  }
});
