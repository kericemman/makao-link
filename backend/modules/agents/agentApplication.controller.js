const mongoose = require("mongoose");
const AgentApplication = require("./agentApplication.model");
const User = require("../users/user.model");
const sendEmail = require("../../utils/sendEmail");
const { agentApplicationRejectedEmail } = require("../../utils/emailTemplates");
const { recordAuthorizationChange } = require("../authorization/audit.service");
const { withAuthorizationTransaction } = require("../authorization/transaction.service");
const { createOrGrantAgentRole, createResetInvite, sendAgentInvitation } = require("./agentAccount.service");
const { recordAdminActivity } = require("../admin/adminActivity.service");
const { DOCUMENT_FIELDS, createAgentDocumentViewUrl, deleteAgentDocuments, uploadAgentDocuments } = require("./agentApplicationStorage.service");
const { normalizeKenyanPhone } = require("../../utils/kenyanPhone");

const genericSubmission = { success: true, message: "Application received. RendaHomes will contact you after review." };

exports.submitApplication = async (req, res, next) => {
  try {
    const allowed = new Set(["name", "email", "phone", "county", "town", "experience", "identityType", "documentConsent"]);
    if (Object.keys(req.body || {}).some((key) => !allowed.has(key))) return res.status(400).json({ message: "Unsupported application field." });
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    let phone;
    try {
      phone = normalizeKenyanPhone(req.body.phone);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
    const county = String(req.body.county || "").trim();
    const town = String(req.body.town || "").trim();
    const experience = String(req.body.experience || "").trim();
    const identityType = String(req.body.identityType || "national_id");
    if (req.body.documentConsent !== "true") return res.status(400).json({ message: "Consent is required to process identity and qualification documents." });
    if (name.length < 2 || name.length > 100) return res.status(400).json({ message: "Enter your name (2 to 100 characters)." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ message: "Enter a valid email address." });
    if (county.length > 80 || town.length > 80 || experience.length > 1500) return res.status(400).json({ message: "One or more fields are too long." });
    if (!["national_id", "passport"].includes(identityType)) return res.status(400).json({ message: "Choose a supported identity document type." });
    if (!req.files?.identityFront?.[0] || !req.files?.professionalCredential?.[0]) {
      return res.status(400).json({ message: "Upload the front of your ID or passport and proof of agent registration or qualification." });
    }

    const application = new AgentApplication({
      name, email, phone, county, town, experience, identityType,
      documentProcessingConsent: { accepted: true, acceptedAt: new Date(), policyVersion: "agent-application-v1" }
    });
    let documents = {};
    try {
      documents = await uploadAgentDocuments(application._id, req.files);
      application.documents = documents;
      await application.save();
    } catch (error) {
      if (Object.keys(documents).length) {
        await deleteAgentDocuments(documents).catch(() => {});
      }
      if (error.code === 11000) return res.status(202).json(genericSubmission);
      throw error;
    }
    await recordAdminActivity({
      eventType: "agent_application_submitted",
      description: "New agent application received",
      details: `${name}${county ? ` • ${county}` : ""}`,
      path: "/admin/agents",
      entityType: "agent_application",
      entityId: String(application._id)
    }).catch((error) => console.error("Agent application activity record failed:", error.message));
    res.status(202).json(genericSubmission);
  } catch (error) { next(error); }
};

exports.getApplicationDocumentLink = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Agent application not found." });
    const allowedFields = new Set(["identityFront", "identityBack", "professionalCredential"]);
    if (!allowedFields.has(req.params.document)) return res.status(404).json({ message: "Agent application document not found." });
    const application = await AgentApplication.findById(req.params.id).select(`documents.${req.params.document}`);
    const document = application?.documents?.[req.params.document];
    if (!document) return res.status(404).json({ message: "Agent application document not found." });
    await recordAuthorizationChange(req, {
      action: "agent_application.document_viewed",
      resourceType: "agent_application",
      resourceId: application._id,
      changes: { documentType: req.params.document }
    });
    const url = await createAgentDocumentViewUrl(document);
    res.set("Cache-Control", "no-store").json({ success: true, url, expiresIn: 300 });
  } catch (error) { next(error); }
};

exports.listApplications = async (_req, res, next) => {
  try {
    const records = await AgentApplication.find({ $or: [{ status: "pending" }, { status: "approved", invitationStatus: { $in: ["not_sent", "failed"] } }] })
      .populate("agent", "name email role roles agentCode")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 }).limit(300).lean();
    const applications = records.map((application) => ({
      ...application,
      documents: Object.fromEntries(DOCUMENT_FIELDS.map((field) => [field, Boolean(application.documents?.[field]?.key)]))
    }));
    res.json({ success: true, applications });
  } catch (error) { next(error); }
};

exports.reviewApplication = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Agent application not found." });
    if (!req.body || Object.keys(req.body).some((key) => !["decision", "reviewNote", "commissionRate"].includes(key))) return res.status(400).json({ message: "Unsupported review field." });
    const decision = req.body.decision;
    const reviewNote = String(req.body.reviewNote || "").trim();
    const commissionRate = req.body.commissionRate === undefined ? 10 : Number(req.body.commissionRate);
    if (!["approve", "reject"].includes(decision)) return res.status(400).json({ message: "Choose approve or reject." });
    if (reviewNote.length > 1000 || !Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100) return res.status(400).json({ message: "Review details are invalid." });

    if (decision === "reject") {
      const application = await withAuthorizationTransaction(async (session) => {
        const current = await AgentApplication.findOne({ _id: req.params.id, status: "pending" }).session(session);
        if (!current) return null;
        current.status = "rejected";
        current.reviewNote = reviewNote;
        current.reviewedBy = req.user._id;
        current.reviewedAt = new Date();
        await current.save({ session });
        await recordAuthorizationChange(req, { action: "agent_application.rejected", resourceType: "agent_application", resourceId: current._id, changes: { reviewNote }, session });
        return current;
      });
      if (!application) return res.status(409).json({ message: "This application has already been reviewed." });
      try {
        await sendEmail({ to: application.email, subject: "RendaHomes agent application update", html: agentApplicationRejectedEmail({ name: application.name, reviewNote }) });
      } catch (error) { console.error("Agent application decision email failed:", error.message); }
      return res.json({ success: true, application, invitationSent: false, message: "Application rejected." });
    }

    const approved = await withAuthorizationTransaction(async (session) => {
      const application = await AgentApplication.findOne({ _id: req.params.id, status: "pending" }).session(session);
      if (!application) return null;
      const { agent, setupUrl } = await createOrGrantAgentRole({
        name: application.name,
        email: application.email,
        phone: application.phone,
        commissionRate,
        createdByAdmin: req.user._id,
        session
      });
      application.status = "approved";
      application.reviewNote = reviewNote;
      application.reviewedBy = req.user._id;
      application.reviewedAt = new Date();
      application.agent = agent._id;
      application.invitationStatus = "not_sent";
      await application.save({ session });
      await recordAuthorizationChange(req, { action: "agent_application.approved", resourceType: "agent_application", resourceId: application._id, organization: null, changes: { agentId: String(agent._id), commissionRate }, session });
      return { application, agent, setupUrl };
    });
    if (!approved) return res.status(409).json({ message: "This application has already been reviewed." });

    let invitationSent = false;
    try {
      await sendAgentInvitation(approved);
      invitationSent = true;
    } catch (error) {
      console.error("Agent invitation email failed:", error.message);
    }
    approved.application.invitationStatus = invitationSent ? "sent" : "failed";
    approved.application.invitationSentAt = invitationSent ? new Date() : null;
    await approved.application.save();
    res.json({ success: true, application: approved.application, invitationSent, message: invitationSent ? "Application approved and invitation sent." : "Agent access created, but the invitation email failed. You can retry it from this page." });
  } catch (error) { next(error); }
};

exports.resendInvitation = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Agent application not found." });
    const application = await AgentApplication.findOne({ _id: req.params.id, status: "approved" }).populate("agent");
    if (!application?.agent) return res.status(404).json({ message: "Approved agent account not found." });
    const setupUrl = application.agent.isEmailVerified ? "" : await createResetInvite(application.agent);
    await sendAgentInvitation({ agent: application.agent, setupUrl });
    application.invitationStatus = "sent";
    application.invitationSentAt = new Date();
    await application.save();
    res.json({ success: true, message: "Agent invitation sent." });
  } catch (error) {
    console.error("Agent invitation retry failed:", error.message);
    next(error);
  }
};
