const crypto = require("crypto");
const User = require("../users/user.model");
const Message = require("./landlordOnboardingMessage.model");
const sendEmail = require("../../utils/sendEmail");
const { landlordManualOnboardingEmail } = require("../../utils/emailTemplates");
const { effectiveRoles } = require("../authorization/authorization.service");

const normalizeManualEmail = ({ requestId, subject, message } = {}) => {
  const normalizedRequestId = String(requestId || "").trim();
  const normalizedSubject = String(subject || "").trim();
  const normalizedMessage = String(message || "").trim();
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(normalizedRequestId)) return null;
  if (!normalizedSubject || normalizedSubject.length > 160 || /[\r\n]/.test(normalizedSubject)) return null;
  if (!normalizedMessage || normalizedMessage.length > 4000) return null;
  return { requestId: normalizedRequestId, subject: normalizedSubject, message: normalizedMessage };
};

const sendManualLandlordEmail = async ({ userId, actorId, requestId, subject, message, models = {}, send = sendEmail, env = process.env, now = new Date() } = {}) => {
  const normalized = normalizeManualEmail({ requestId, subject, message });
  if (!normalized) return { status: "invalid_message" };
  if (!env.RESEND_API_KEY) return { status: "email_not_configured" };

  const UserModel = models.UserModel || User;
  const MessageModel = models.MessageModel || Message;
  const user = await UserModel.findById(userId).select("name email role roles").lean();
  if (!user || !effectiveRoles(user).includes("landlord") || !user.email) return { status: "landlord_not_found" };
  const unresolved = await MessageModel.findOne({
    user: user._id,
    channel: "email",
    status: { $in: ["sending", "unknown"] }
  }).select("status").lean();
  if (unresolved) return { status: "delivery_unknown" };

  const contentDigest = crypto.createHash("sha256")
    .update(`${normalized.subject}\n${normalized.message}`)
    .digest("hex");
  let dispatch;
  try {
    dispatch = await MessageModel.create({
      requestId: normalized.requestId,
      user: user._id,
      actor: actorId,
      channel: "email",
      status: "sending",
      hasUnresolvedDelivery: true,
      contentDigest
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
    const existing = await MessageModel.findOne({ requestId: normalized.requestId }).select("status").lean();
    if (existing?.status === "sent") return { status: "sent", alreadyProcessed: true };
    return { status: existing?.status || "unknown", alreadyProcessed: true };
  }

  try {
    const html = landlordManualOnboardingEmail({
      name: user.name,
      subject: normalized.subject,
      message: normalized.message
    });
    const result = await send({ to: user.email, subject: normalized.subject, html });
    if (result?.error) {
      await MessageModel.updateOne({ _id: dispatch._id, status: "sending" }, { $set: { status: "failed", hasUnresolvedDelivery: false, errorCode: "provider_rejected" } });
      return { status: "failed" };
    }
    if (!result?.data?.id) {
      await MessageModel.updateOne({ _id: dispatch._id, status: "sending" }, { $set: { status: "unknown", errorCode: "provider_result_unknown" } });
      return { status: "unknown" };
    }
    await MessageModel.updateOne({ _id: dispatch._id, status: "sending" }, {
      $set: { status: "sent", hasUnresolvedDelivery: false, sentAt: now, providerMessageId: String(result.data.id).slice(0, 200), errorCode: "" }
    });
    return { status: "sent", alreadyProcessed: false };
  } catch {
    await MessageModel.updateOne({ _id: dispatch._id, status: "sending" }, { $set: { status: "unknown", errorCode: "delivery_result_unknown" } });
    return { status: "unknown" };
  }
};

module.exports = { normalizeManualEmail, sendManualLandlordEmail };
