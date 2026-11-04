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
const Organization = require("../organizations/organization.model");
const Membership = require("../organizations/organizationMembership.model");
const Subscription = require("../subscriptions/subscription.model");
require("../alerts/alert.model");
const Lead = require("./lead.model");
const Viewing = require("../viewings/viewing.model");
const leadRoutes = require("./lead.routes");

const uri = process.env.MONGO_URI_STAGING;

test("staging lead routes enforce organization branch scope and agent assignment", { skip: !uri && "MONGO_URI_STAGING is not configured" }, async (t) => {
  safeDatabaseName(uri, process.env);
  assert.ok(process.env.JWT_SECRET, "JWT_SECRET must be configured for route integration tests");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

  const runId = crypto.randomUUID();
  const created = { users: [], listings: [], organizations: [], memberships: [], subscriptions: [], leads: [], viewings: [] };
  const app = express();
  app.use(express.json());
  app.use("/api/leads", leadRoutes);
  const server = http.createServer(app);

  const makeUser = async (suffix, role = "user") => {
    const user = await User.create({
      name: `Lead Integration ${suffix}`,
      email: `lead.${suffix}.${runId}@integration.invalid`,
      phone: `+254700${crypto.randomInt(100000, 999999)}`,
      password: crypto.randomBytes(24).toString("hex"),
      role,
      roles: [role]
    });
    created.users.push(user._id);
    return user;
  };
  const remember = async (key, document) => {
    await document.save();
    created[key].push(document._id);
    return document;
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

    const owner = await makeUser("owner", "landlord");
    const eastAgent = await makeUser("east-agent");
    const westAgent = await makeUser("west-agent");
    const outsider = await makeUser("outsider");
    const customer = await makeUser("customer");
    const organization = await remember("organizations", new Organization({
      name: `Lead integration ${runId}`,
      owner: owner._id,
      branches: [{ name: "East" }, { name: "West" }]
    }));
    const [east, west] = organization.branches;
    await remember("subscriptions", new Subscription({ user: owner._id, plan: "pro", status: "active" }));
    const eastMembership = await remember("memberships", new Membership({
      organization: organization._id,
      user: eastAgent._id,
      role: "agent",
      permissions: ["listings:read", "inquiries:read", "inquiries:manage", "deals:manage"],
      scope: "branches",
      branchIds: [east._id],
      status: "active"
    }));
    await remember("memberships", new Membership({
      organization: organization._id,
      user: westAgent._id,
      role: "agent",
      permissions: ["listings:read", "inquiries:read", "inquiries:manage", "deals:manage"],
      scope: "branches",
      branchIds: [west._id],
      status: "active"
    }));

    const makeLead = async (branch, assignedAgent) => {
      const listing = await remember("listings", new Listing({
        title: `Lead fixture ${runId}`,
        description: "Synthetic staging-only lead authorization fixture.",
        purpose: "rent",
        price: 25000,
        county: "nairobi",
        town: "westlands",
        type: "apartment",
        bedrooms: 2,
        bathrooms: 1,
        contactPhone: "+254700000000",
        landlord: owner._id,
        organization: organization._id,
        branch: branch._id
      }));
      const lead = await remember("leads", new Lead({
        sourceModel: "AppAlert",
        sourceRecord: new mongoose.Types.ObjectId(),
        listing: listing._id,
        advertiser: owner._id,
        customer: customer._id,
        assignedAgent,
        sourceChannel: "mobile_app"
      }));
      return { listing, lead };
    };
    const eastFixture = await makeLead(east, eastAgent._id);
    const westFixture = await makeLead(west, westAgent._id);
    const viewing = await remember("viewings", new Viewing({
      listing: eastFixture.listing._id,
      customer: customer._id,
      advertiser: owner._id,
      lead: eastFixture.lead._id,
      requestedStartAt: new Date(Date.now() + 86_400_000),
      requestedEndAt: new Date(Date.now() + 90_000_000),
      timezone: "Africa/Nairobi",
      consent: { contactSharing: true },
      status: "requested"
    }));
    await Lead.updateOne({ _id: eastFixture.lead._id }, { $addToSet: { viewings: viewing._id } });

    const ownerToken = tokenFor(owner);
    const eastToken = tokenFor(eastAgent);
    const outsiderToken = tokenFor(outsider);
    const context = `?organizationId=${organization._id}`;

    await t.test("agent sees assigned leads only within its active branch scope", async () => {
      const response = await call("GET", `/api/leads${context}`, eastToken);
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.deepEqual(result.leads.map((lead) => lead._id), [String(eastFixture.lead._id)]);
      assert.equal((await call("GET", `/api/leads/${westFixture.lead._id}${context}`, eastToken)).status, 404);
    });

    await t.test("owner can assign only an agent with matching property scope", async () => {
      const base = `/api/leads/${eastFixture.lead._id}/assignments${context}`;
      const invalid = await call("POST", base, ownerToken, { agentId: String(westAgent._id) });
      assert.equal(invalid.status, 400);
      const valid = await call("POST", base, ownerToken, { agentId: String(eastAgent._id) });
      assert.equal(valid.status, 200);
      assert.equal(String((await valid.json()).lead.assignedAgent._id), String(eastAgent._id));
      assert.equal(String((await Viewing.findById(viewing._id).lean()).assignedAgent), String(eastAgent._id));
    });

    await t.test("non-member cannot access leads and revocation removes agent access immediately", async () => {
      assert.equal((await call("GET", `/api/leads${context}`, outsiderToken)).status, 404);
      eastMembership.status = "revoked";
      eastMembership.revokedAt = new Date();
      await eastMembership.save();
      assert.equal((await call("GET", `/api/leads${context}`, eastToken)).status, 404);
    });
  } finally {
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    await Promise.all([
      Lead.deleteMany({ _id: { $in: created.leads } }),
      Viewing.deleteMany({ _id: { $in: created.viewings } }),
      Listing.deleteMany({ _id: { $in: created.listings } }),
      Membership.deleteMany({ _id: { $in: created.memberships } }),
      Organization.deleteMany({ _id: { $in: created.organizations } }),
      Subscription.deleteMany({ _id: { $in: created.subscriptions } }),
      User.deleteMany({ _id: { $in: created.users } })
    ]);
    await mongoose.disconnect();
  }
});
