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
const AgentApplication = require("./agentApplication.model");
const AuditRecord = require("../authorization/auditRecord.model");
const AdminActivity = require("../admin/adminActivity.model");

const uri = process.env.MONGO_URI_STAGING;
const sentEmails = [];
const emailModulePath = require.resolve("../../utils/sendEmail");
require.cache[emailModulePath] = { id: emailModulePath, filename: emailModulePath, loaded: true, exports: async (message) => { sentEmails.push(message); return { mocked: true }; } };
const applicationStoragePath = require.resolve("./agentApplicationStorage.service");
require.cache[applicationStoragePath] = {
  id: applicationStoragePath,
  filename: applicationStoragePath,
  loaded: true,
  exports: {
    DOCUMENT_FIELDS: ["identityFront", "identityBack", "professionalCredential"],
    supportedDocumentType: (file) => file.mimetype === "application/pdf" && file.originalname.toLowerCase().endsWith(".pdf"),
    validDocumentFile: (file) => file.mimetype === "application/pdf" && file.originalname.toLowerCase().endsWith(".pdf"),
    uploadAgentDocuments: async (applicationId, files) => Object.fromEntries(
      ["identityFront", "identityBack", "professionalCredential"]
        .filter((field) => files[field]?.[0])
        .map((field) => [field, { key: `agent-applications/${applicationId}/${field}/test.pdf`, originalName: "test.pdf", contentType: "application/pdf", size: 4, uploadedAt: new Date() }])
    ),
    deleteAgentDocuments: async () => {},
    createAgentDocumentViewUrl: async () => "https://private-r2.example.test/signed-document"
  }
};
const agentRoutes = require("./agent.routes");
const authRoutes = require("../auth/auth.routes");

test("staging agent application is reviewed by admin and invitation uses a one-time password setup link", { skip: !uri && "MONGO_URI_STAGING is not configured" }, async () => {
  safeDatabaseName(uri, process.env);
  assert.ok(process.env.JWT_SECRET, "JWT_SECRET must be configured for route integration tests");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const runId = crypto.randomUUID();
  const createdUserIds = [];
  const createdApplicationIds = [];
  const app = express();
  app.use(express.json());
  app.use("/api", agentRoutes);
  app.use("/api/auth", authRoutes);
  app.use((error, _req, res, _next) => res.status(error.statusCode || 500).json({ message: error.message }));
  const server = http.createServer(app);
  const applicantEmail = `agent.application.${runId}@integration.invalid`;
  const call = (method, path, token, body) => fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const callMultipart = (path, token, body) => fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body
  });

  try {
    const admin = await User.create({
      name: `Agent application admin ${runId}`,
      email: `agent.application.admin.${runId}@integration.invalid`,
      phone: `+254700${crypto.randomInt(100000, 999999)}`,
      password: crypto.randomBytes(24).toString("hex"), role: "admin", roles: ["admin"]
    });
    createdUserIds.push(admin._id);
    const adminToken = jwt.sign({ id: String(admin._id) }, process.env.JWT_SECRET, { expiresIn: "5m" });
    await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });

    const form = new FormData();
    form.set("name", "Staging Agent Applicant");
    form.set("email", applicantEmail);
    form.set("phone", "+254700123456");
    form.set("county", "Nairobi");
    form.set("town", "Westlands");
    form.set("experience", "Synthetic staging application.");
    form.set("identityType", "national_id");
    form.set("documentConsent", "true");
    form.set("identityFront", new Blob(["test"], { type: "application/pdf" }), "id-front.pdf");
    form.set("professionalCredential", new Blob(["test"], { type: "application/pdf" }), "agent-credential.pdf");
    const submitted = await callMultipart("/api/agents/applications", null, form);
    assert.equal(submitted.status, 202);
    assert.match((await submitted.json()).message, /received/i);
    const application = await AgentApplication.findOne({ email: applicantEmail });
    assert.ok(application);
    assert.equal(application.documents.identityFront.originalName, "test.pdf");
    assert.equal(application.documents.professionalCredential.contentType, "application/pdf");
    assert.equal(application.documentProcessingConsent.accepted, true);
    assert.ok(application.documentProcessingConsent.acceptedAt);
    createdApplicationIds.push(application._id);
    const activity = await AdminActivity.findOne({ eventType: "agent_application_submitted", entityId: String(application._id) }).lean();
    assert.ok(activity);
    assert.equal(activity.path, "/admin/agents");
    assert.equal(activity.details.includes(applicantEmail), false);

    const deniedAdminList = await call("GET", "/api/admin/agent-applications");
    assert.equal(deniedAdminList.status, 401);
    const listed = await call("GET", "/api/admin/agent-applications", adminToken);
    assert.equal(listed.status, 200);
    const applications = (await listed.json()).applications;
    const listedApplication = applications.find((item) => item._id === String(application._id));
    assert.ok(listedApplication);
    assert.equal(listedApplication.documents.identityFront, true);
    assert.equal("key" in listedApplication.documents, false, "admin list must not expose R2 keys");
    const deniedDocument = await call("GET", `/api/admin/agent-applications/${application._id}/documents/identityFront`);
    assert.equal(deniedDocument.status, 401);
    const documentLink = await call("GET", `/api/admin/agent-applications/${application._id}/documents/identityFront`, adminToken);
    assert.equal(documentLink.status, 200);
    assert.equal((await documentLink.json()).url, "https://private-r2.example.test/signed-document");
    assert.ok(await AuditRecord.exists({ action: "agent_application.document_viewed", resourceId: String(application._id), actor: admin._id }));

    const approved = await call("PATCH", `/api/admin/agent-applications/${application._id}/review`, adminToken, { decision: "approve", commissionRate: 12 });
    assert.equal(approved.status, 200);
    assert.equal((await approved.json()).invitationSent, true);
    assert.equal(sentEmails.length, 1);
    assert.equal(sentEmails[0].to, applicantEmail);
    assert.equal(sentEmails[0].html.includes("Temporary password"), false);

    const updatedApplication = await AgentApplication.findById(application._id);
    assert.equal(updatedApplication.status, "approved");
    assert.equal(updatedApplication.invitationStatus, "sent");
    const agent = await User.findById(updatedApplication.agent).select("role roles agentCode commissionRate isEmailVerified passwordResetToken passwordResetExpires");
    createdUserIds.push(agent._id);
    assert.equal(agent.role, "agent");
    assert.ok(agent.roles.includes("agent"));
    assert.equal(agent.commissionRate, 12);
    assert.equal(agent.isEmailVerified, false);
    assert.ok(agent.passwordResetToken);
    assert.ok(agent.passwordResetExpires > new Date());
    assert.equal(agent.passwordResetToken.length, 64);

    const inviteToken = sentEmails[0].html.match(/reset-password\/([a-f0-9]{64})/i)?.[1];
    assert.ok(inviteToken, "invitation email should contain the secure password setup link");
    const passwordSetup = await call("POST", `/api/auth/reset-password/${inviteToken}`, null, { password: "SafeTestPassword#2026" });
    assert.equal(passwordSetup.status, 200);
    assert.equal((await passwordSetup.json()).success, true);
    const activatedAgent = await User.findById(agent._id).select("isEmailVerified passwordResetToken passwordResetExpires");
    assert.equal(activatedAgent.isEmailVerified, true);
    assert.equal(activatedAgent.passwordResetToken, null);
    assert.equal(activatedAgent.passwordResetExpires, null);

    const reusedInvite = await call("POST", `/api/auth/reset-password/${inviteToken}`, null, { password: "SafeTestPassword#2026" });
    assert.equal(reusedInvite.status, 400, "a consumed invitation token must not be reusable");
  } finally {
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    await Promise.all([
      AuditRecord.deleteMany({ actor: { $in: createdUserIds }, action: { $in: ["agent_application.approved", "agent_application.rejected", "agent_application.document_viewed"] } }),
      AdminActivity.deleteMany({ eventType: "agent_application_submitted", entityId: { $in: createdApplicationIds.map(String) } }),
      AgentApplication.deleteMany({ _id: { $in: createdApplicationIds } }),
      User.deleteMany({ _id: { $in: createdUserIds } })
    ]);
    sentEmails.length = 0;
    await mongoose.disconnect();
  }
});
