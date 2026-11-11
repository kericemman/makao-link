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
const PropertyMandate = require("../organizations/propertyMandate.model");
const PropertyRequest = require("./propertyRequest.model");
const AgentMatchProposal = require("./agentMatchProposal.model");
const Viewing = require("../viewings/viewing.model");
const Lead = require("../leads/lead.model");
const AuditRecord = require("../authorization/auditRecord.model");
const agentRoutes = require("../agents/agent.routes");
const propertyRequestRoutes = require("./propertyRequest.routes");
const viewingRoutes = require("../viewings/viewing.routes");

const uri = process.env.MONGO_URI_STAGING;
const runStagingIntegration = process.env.RUN_STAGING_INTEGRATION_TESTS === "true";

test("staging agent marketplace enforces consent, service area, mandate and customer choice", { skip: !runStagingIntegration ? "Set RUN_STAGING_INTEGRATION_TESTS=true to run staging database tests" : !uri && "MONGO_URI_STAGING is not configured" }, async (t) => {
  safeDatabaseName(uri, process.env);
  assert.ok(process.env.JWT_SECRET, "JWT_SECRET must be configured for route integration tests");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

  const runId = crypto.randomUUID();
  const created = { users: [], listings: [], mandates: [], requests: [], proposals: [], viewings: [], leads: [] };
  const app = express();
  app.use(express.json());
  app.use("/api", agentRoutes);
  app.use("/api/property-requests", propertyRequestRoutes);
  app.use("/api/viewings", viewingRoutes);
  app.use((error, _req, res, _next) => res.status(error.statusCode || 500).json({ message: error.message }));
  const server = http.createServer(app);
  const makeUser = async (suffix, role) => {
    const user = await User.create({
      name: `Marketplace ${suffix}`,
      email: `marketplace.${suffix}.${runId}@integration.invalid`,
      phone: `+254700${crypto.randomInt(100000, 999999)}`,
      password: crypto.randomBytes(24).toString("hex"),
      role,
      roles: [role],
      ...(role === "agent" ? { agentMarketplaceStatus: "approved", agentServiceAreas: [{ county: "nairobi", towns: ["westlands"] }] } : {})
    });
    created.users.push(user._id);
    return user;
  };
  const tokenFor = (user) => jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET, { expiresIn: "5m" });
  const call = (method, path, token, body) => fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });

  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const agent = await makeUser("agent", "agent");
    const advertiser = await makeUser("advertiser", "landlord");
    const externalAdvertiser = await makeUser("external-advertiser", "landlord");
    const customer = await makeUser("customer", "user");
    const outOfAreaCustomer = await makeUser("outside", "user");
    const noConsentCustomer = await makeUser("no-consent", "user");
    const listing = await Listing.create({
      title: `Marketplace fixture ${runId}`,
      description: "Synthetic staging-only agent marketplace fixture.",
      purpose: "rent",
      price: 30000,
      county: "nairobi",
      town: "westlands",
      type: "apartment",
      bedrooms: 2,
      bathrooms: 1,
      contactPhone: "+254700000000",
      landlord: advertiser._id,
      status: "approved",
      availability: "available",
      isActive: true
    });
    created.listings.push(listing._id);
    const unauthorizedListing = await Listing.create({
      title: `Unauthorized marketplace fixture ${runId}`,
      description: "Synthetic staging-only listing without an agent mandate.",
      purpose: "rent",
      price: 30000,
      county: "nairobi",
      town: "westlands",
      type: "apartment",
      bedrooms: 2,
      bathrooms: 1,
      contactPhone: "+254700000000",
      landlord: externalAdvertiser._id,
      status: "approved",
      availability: "available",
      isActive: true
    });
    created.listings.push(unauthorizedListing._id);
    const mandate = await PropertyMandate.create({
      principal: advertiser._id,
      agent: agent._id,
      listing: listing._id,
      scope: "property",
      permissions: ["listings:advertise", "inquiries:manage"],
      grantedBy: advertiser._id
    });
    created.mandates.push(mandate._id);
    const createRequest = async (owner, town, agentSharing) => {
      const request = await PropertyRequest.create({
        customer: owner._id,
        purpose: "rent",
        preferredLocations: [{ county: "nairobi", town }],
        propertyTypes: ["apartment"],
        minBedrooms: 2,
        budgetMin: 20000,
        budgetMax: 40000,
        currency: "KES",
        pricePeriod: "monthly",
        requirements: "Private customer note must not be shared.",
        consent: { matching: true, agentSharing },
        status: "active"
      });
      created.requests.push(request._id);
      return request;
    };
    const shared = await createRequest(customer, "westlands", true);
    await createRequest(outOfAreaCustomer, "kilimani", true);
    await createRequest(noConsentCustomer, "westlands", false);

    const agentToken = tokenFor(agent);
    const customerToken = tokenFor(customer);
    await t.test("agent sees only consented requests in the approved service area without contact or free-text details", async () => {
      const response = await call("GET", "/api/agents/marketplace/requests", agentToken);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.deepEqual(body.requests.map((request) => request._id), [String(shared._id)]);
      const serialized = JSON.stringify(body);
      assert.equal(serialized.includes(customer.email), false);
      assert.equal(serialized.includes(customer.phone), false);
      assert.equal(serialized.includes("Private customer note"), false);
    });

    await t.test("agent can propose only an authorized eligible listing and customer can accept then request a viewing", async () => {
      const eligibleResponse = await call("GET", `/api/agents/marketplace/requests/${shared._id}/listings`, agentToken);
      assert.equal(eligibleResponse.status, 200);
      assert.deepEqual((await eligibleResponse.json()).listings.map((item) => item._id), [String(listing._id)]);
      const unauthorizedResponse = await call("POST", `/api/agents/marketplace/requests/${shared._id}/proposals`, agentToken, { listingId: String(unauthorizedListing._id) });
      assert.equal(unauthorizedResponse.status, 403);
      const proposedResponse = await call("POST", `/api/agents/marketplace/requests/${shared._id}/proposals`, agentToken, { listingId: String(listing._id), message: "This apartment fits your stated budget and location." });
      assert.equal(proposedResponse.status, 201);
      const proposal = (await proposedResponse.json()).proposal;
      created.proposals.push(proposal._id);

      const proposalsResponse = await call("GET", `/api/property-requests/${shared._id}/agent-proposals`, customerToken);
      assert.equal(proposalsResponse.status, 200);
      const proposals = (await proposalsResponse.json()).proposals;
      assert.equal(proposals.length, 1);
      assert.equal(proposals[0].agent.email, undefined);
      assert.equal(proposals[0].agent.phone, undefined);

      const acceptedResponse = await call("PATCH", `/api/property-requests/${shared._id}/agent-proposals/${proposal._id}`, customerToken, { status: "accepted" });
      assert.equal(acceptedResponse.status, 200);
      const start = new Date(Date.now() + 86_400_000);
      const viewingResponse = await call("POST", "/api/viewings", customerToken, {
        listingId: String(listing._id),
        propertyRequestId: String(shared._id),
        requestedStartAt: start.toISOString(),
        requestedEndAt: new Date(start.getTime() + 3_600_000).toISOString(),
        timezone: "Africa/Nairobi",
        contactSharingConsent: true
      });
      assert.equal(viewingResponse.status, 201);
      const viewing = (await viewingResponse.json()).viewing;
      created.viewings.push(viewing._id);
      assert.equal(String(viewing.assignedAgent._id), String(agent._id));
      const lead = await Lead.findById(viewing.lead).lean();
      created.leads.push(lead._id);
      assert.equal(String(lead.assignedAgent), String(agent._id));
    });

    await t.test("unapproved agent cannot use the marketplace", async () => {
      agent.agentMarketplaceStatus = "pending";
      await agent.save();
      assert.equal((await call("GET", "/api/agents/marketplace/requests", agentToken)).status, 403);
    });
  } finally {
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    await Promise.all([
      AuditRecord.deleteMany({ actor: { $in: created.users }, action: { $in: ["agent_match.proposed", "agent_match.accepted", "viewing.requested"] } }),
      Lead.deleteMany({ _id: { $in: created.leads } }),
      Viewing.deleteMany({ _id: { $in: created.viewings } }),
      AgentMatchProposal.deleteMany({ $or: [{ _id: { $in: created.proposals } }, { propertyRequest: { $in: created.requests } }] }),
      PropertyRequest.deleteMany({ _id: { $in: created.requests } }),
      PropertyMandate.deleteMany({ _id: { $in: created.mandates } }),
      Listing.deleteMany({ _id: { $in: created.listings } }),
      User.deleteMany({ _id: { $in: created.users } })
    ]);
    await mongoose.disconnect();
  }
});
