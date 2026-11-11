require("dotenv").config();
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const express = require("express");
const http = require("node:http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { safeDatabaseName } = require("../../scripts/migrateIdentityOrganizations");

const uri = process.env.MONGO_URI_STAGING;
const runStagingIntegration = process.env.RUN_STAGING_ASSISTED_TESTS === "true";
const uploadedEmails = [];
const uploadPath = require.resolve("../listings/listingMedia.storage");
require.cache[uploadPath] = {
  id: uploadPath,
  filename: uploadPath,
  loaded: true,
  exports: {
    uploadListingImages: async (_adminId, files) => ({
      images: files.map((_file, index) => `staged://integration/${index}`),
      assets: files.map((file, index) => ({
        index,
        stagingKey: `staging/integration/${crypto.randomUUID()}.jpg`,
        originalName: file.originalname,
        contentType: file.mimetype,
        size: file.size,
        status: "staged",
        uploadedAt: new Date()
      }))
    }),
    serializeListingImages: async (value) => value,
    deletePrivateImages: async () => {}
  }
};

const emailPath = require.resolve("../../utils/sendEmail");
require.cache[emailPath] = {
  id: emailPath,
  filename: emailPath,
  loaded: true,
  exports: async (message) => { uploadedEmails.push(message); return { id: "mock-email" }; }
};

const User = require("../users/user.model");
const Subscription = require("../subscriptions/subscription.model");
const Listing = require("../listings/listings.model");
const Draft = require("./assistedListingDraft.model");
const PartnerApplication = require("../services/partnerApplication.model");
const AdminActivity = require("./adminActivity.model");
const adminRoutes = require("./admin.routes");

test("staging admin-assisted landlord and provider routes preserve review/payment gates", {
  skip: !uri ? "MONGO_URI_STAGING is not configured" : !runStagingIntegration && "Set RUN_STAGING_ASSISTED_TESTS=true to write isolated synthetic staging fixtures"
}, async () => {
  safeDatabaseName(uri, process.env);
  assert.ok(process.env.JWT_SECRET, "JWT_SECRET must be configured for staging route tests");
  const originalResendKey = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = "mocked-staging-email-provider";
  const runId = crypto.randomUUID();
  const cleanups = { userIds: [], applicationIds: [], draftIds: [], listingIds: [], subscriptionIds: [] };
  let connected = false;
  let admin;
  let server;

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    connected = true;
    admin = await User.create({
      name: `Assisted workflow test admin ${runId}`,
      email: `assisted.admin.${runId}@integration.invalid`,
      phone: `+2547${String(crypto.randomInt(0, 100000000)).padStart(8, "0")}`,
      password: crypto.randomBytes(24).toString("hex"),
      role: "admin",
      roles: ["admin"]
    });
    cleanups.userIds.push(admin._id);
    const token = jwt.sign({ id: String(admin._id) }, process.env.JWT_SECRET, { expiresIn: "5m" });
    const app = express();
    app.use(express.json());
    app.use("/api/admin", adminRoutes);
    app.use((error, _req, res, _next) => res.status(error.statusCode || 500).json({ message: error.message }));
    server = http.createServer(app);
    const call = (method, path, body) => fetch(`http://127.0.0.1:${server.address().port}/api/admin${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }) },
      ...(body === undefined ? {} : { body: body instanceof FormData ? body : JSON.stringify(body) })
    });

    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });

    const draftForm = new FormData();
    const landlordEmail = `assisted.landlord.${runId}@integration.invalid`;
    draftForm.set("name", "Staging Landlord");
    draftForm.set("email", landlordEmail);
    draftForm.set("phone", `+2547${String(crypto.randomInt(0, 100000000)).padStart(8, "0")}`);
    draftForm.set("package", "normal");
    draftForm.set("title", "Staging two-bedroom home");
    draftForm.set("description", "Synthetic integration test listing for the assisted approval journey.");
    draftForm.set("purpose", "rent");
    draftForm.set("price", "25000");
    draftForm.set("county", "nairobi");
    draftForm.set("town", "westlands");
    draftForm.set("type", "apartment");
    draftForm.set("bedrooms", "2");
    draftForm.set("bathrooms", "1");
    draftForm.set("contactPhone", "+254712345678");
    draftForm.set("amenities", JSON.stringify({ waterAvailable: true }));
    draftForm.set("images", new Blob(["synthetic image bytes"], { type: "image/jpeg" }), "test.jpg");

    const createdDraftResponse = await call("POST", "/assisted-listing-drafts", draftForm);
    const createdDraftBody = await createdDraftResponse.json();
    assert.equal(createdDraftResponse.status, 201, createdDraftBody.message);
    const draftId = createdDraftBody.draft._id;
    cleanups.draftIds.push(draftId);

    const approvalResponse = await call("PATCH", `/assisted-listing-drafts/${draftId}/approve`, { reviewNote: "Staging approval test." });
    const approval = await approvalResponse.json();
    assert.equal(approvalResponse.status, 200, approval.message);
    assert.equal(approval.accountSetupEmailSent, true);
    cleanups.userIds.push(approval.landlordId);
    cleanups.listingIds.push(approval.listingId);

    const [landlord, subscription, listing, approvedDraft] = await Promise.all([
      User.findById(approval.landlordId),
      Subscription.findOne({ user: approval.landlordId }),
      Listing.findById(approval.listingId),
      Draft.findById(draftId)
    ]);
    cleanups.subscriptionIds.push(subscription?._id);
    assert.equal(landlord.email, landlordEmail);
    assert.equal(landlord.isEmailVerified, false);
    assert.equal(Boolean(landlord.passwordResetToken), true);
    assert.equal(subscription.plan, "normal");
    assert.equal(subscription.status, "free");
    assert.equal(listing.status, "pending");
    assert.equal(listing.listingSource, "admin_assisted");
    assert.equal(String(listing.landlord), String(landlord._id));
    assert.equal(approvedDraft.status, "approved");
    assert.equal(uploadedEmails.some((message) => message.to === landlordEmail), true);

    const providerResponse = await call("POST", "/service-applications/assisted", {
      companyName: `Staging Movers ${runId}`,
      contactPerson: "Staging Contact",
      email: `provider.${runId}@integration.invalid`,
      phone: "+254712345678",
      category: "movers",
      description: "Synthetic provider application for staging route verification.",
      location: "Nairobi"
    });
    const providerBody = await providerResponse.json();
    assert.equal(providerResponse.status, 201, providerBody.message);
    cleanups.applicationIds.push(providerBody.application._id);
    const provider = await PartnerApplication.findById(providerBody.application._id);
    assert.equal(provider.intakeSource, "admin_assisted");
    assert.equal(provider.paymentStatus, "pending");
    assert.equal(provider.status, "pending_review");
    assert.match(providerBody.message, /payment and admin review are still required/i);
  } finally {
    if (server?.listening) await new Promise((resolve) => server.close(resolve));
    if (connected) {
      await Promise.all([
        Draft.deleteMany({ _id: { $in: cleanups.draftIds } }),
        Listing.deleteMany({ _id: { $in: cleanups.listingIds } }),
        Subscription.deleteMany({ _id: { $in: cleanups.subscriptionIds.filter(Boolean) } }),
        PartnerApplication.deleteMany({ _id: { $in: cleanups.applicationIds } }),
        ...(admin ? [AdminActivity.deleteMany({ actor: admin._id })] : []),
        User.deleteMany({ _id: { $in: cleanups.userIds } })
      ]);
      await mongoose.disconnect();
    }
    if (originalResendKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalResendKey;
  }
});
