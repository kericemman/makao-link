const User = require("../users/user.model");
const Listing = require("../listings/listings.model");
const Subscription = require("../subscriptions/subscription.model");
const ContactInfo = require("../app/models/contactInfo.model");
const Followup = require("./landlordOnboardingFollowup.model");
const sendEmail = require("../../utils/sendEmail");
const { landlordOnboardingFollowupEmail } = require("../../utils/emailTemplates");
const { normalizeKenyanPhone } = require("../../utils/kenyanPhone");

const CAMPAIGN = "signup_no_listing_v1";
const CLAIM_STALE_AFTER_MS = 10 * 60 * 1000;

const isLandlord = (user) => [user?.role, ...(user?.roles || [])].includes("landlord");

const deriveOnboardingStage = ({ user, subscription, listingCounts = {} }) => {
  if (!user?.isEmailVerified) return "email_unverified";
  if (!listingCounts.total && subscription?.status === "pending_payment") return "plan_payment";
  if (!listingCounts.total) return "no_listing";
  if (!listingCounts.visible && listingCounts.deleted) return "listing_removed";
  if (listingCounts.pending) return "listing_review";
  if (listingCounts.rejected && !listingCounts.approved) return "listing_needs_changes";
  if (listingCounts.approved) return "listing_live";
  return "listing_in_progress";
};

const buildWhatsAppSupportUrl = (value) => {
  let phone;
  try {
    phone = normalizeKenyanPhone(value).slice(1);
  } catch {
    const match = String(value || "").trim().match(/^https:\/\/wa\.me\/(\d{8,15})\/?$/i);
    phone = match?.[1] || "";
  }
  if (!phone) return "";
  const message = "Hi RendaHomes, I need help completing my landlord setup.";
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

const ensureFollowup = async ({ user, FollowupModel = Followup }) => {
  try {
    return await FollowupModel.findOneAndUpdate(
      { user: user._id, campaign: CAMPAIGN },
      { $setOnInsert: { user: user._id, campaign: CAMPAIGN, status: "pending" } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code === 11000) return FollowupModel.findOne({ user: user._id, campaign: CAMPAIGN });
    throw error;
  }
};

const sendClaimedFollowup = async ({ followupId, now = new Date(), models = {}, send = sendEmail, env = process.env } = {}) => {
  const FollowupModel = models.FollowupModel || Followup;
  const UserModel = models.UserModel || User;
  const ListingModel = models.ListingModel || Listing;
  const ContactInfoModel = models.ContactInfoModel || ContactInfo;

  if (env.LANDLORD_ONBOARDING_FOLLOWUP_ENABLED !== "true") return { status: "disabled" };
  if (!env.RESEND_API_KEY) return { status: "email_not_configured" };

  let freshUser;
  let contact;
  try {
    freshUser = await UserModel.findById((await FollowupModel.findById(followupId).select("user").lean())?.user)
      .select("name email role roles isEmailVerified onboardingSource createdAt").lean();
    contact = await ContactInfoModel.findOne().select("whatsapp").lean();
  } catch {
    return { status: "preflight_failed" };
  }

  const claimed = await FollowupModel.findOneAndUpdate(
    { _id: followupId, status: "pending" },
    { $set: { status: "sending", claimedAt: now, lastErrorCode: "" }, $inc: { attempts: 1 } },
    { new: true }
  );
  if (!claimed) return { status: "not_claimed" };

  let listing;
  try {
    listing = freshUser && await ListingModel.findOne({ landlord: freshUser._id }).select("_id").lean();
  } catch {
    await FollowupModel.updateOne({ _id: claimed._id, status: "sending" }, { $set: { status: "pending", lastErrorCode: "preflight_failed" } });
    return { status: "preflight_failed" };
  }
  if (!freshUser || !isLandlord(freshUser) || !freshUser.isEmailVerified || freshUser.onboardingSource === "admin" || listing) {
    await FollowupModel.updateOne({ _id: claimed._id, status: "sending" }, { $set: { status: "suppressed", lastErrorCode: "no_longer_eligible" } });
    return { status: "suppressed" };
  }

  const whatsappUrl = buildWhatsAppSupportUrl(contact?.whatsapp);
  try {
    const result = await send({
      to: freshUser.email,
      subject: "Need a hand getting your first property listed?",
      html: landlordOnboardingFollowupEmail({ name: freshUser.name, whatsappUrl })
    });
    if (result?.error) {
      await FollowupModel.updateOne({ _id: claimed._id, status: "sending" }, { $set: { status: "failed", lastErrorCode: "provider_rejected" } });
      return { status: "failed" };
    }
    if (!result) {
      await FollowupModel.updateOne({ _id: claimed._id, status: "sending" }, { $set: { status: "unknown", lastErrorCode: "provider_result_missing" } });
      return { status: "unknown" };
    }
    await FollowupModel.updateOne({ _id: claimed._id, status: "sending" }, {
      $set: { status: "sent", sentAt: now, providerMessageId: result.data?.id || result.id || "", lastErrorCode: "" }
    });
    return { status: "sent" };
  } catch {
    await FollowupModel.updateOne({ _id: claimed._id, status: "sending" }, { $set: { status: "unknown", lastErrorCode: "delivery_result_unknown" } });
    return { status: "unknown" };
  }
};

const runLandlordOnboardingFollowups = async ({ now = new Date(), env = process.env, models = {}, send = sendEmail } = {}) => {
  if (env.LANDLORD_ONBOARDING_FOLLOWUP_ENABLED !== "true") return { enabled: false, scanned: 0, sent: 0 };
  if (!env.RESEND_API_KEY) return { enabled: true, skipped: "email_not_configured", scanned: 0, sent: 0 };

  const UserModel = models.UserModel || User;
  const ListingModel = models.ListingModel || Listing;
  const FollowupModel = models.FollowupModel || Followup;
  const delayHours = Math.min(168, Math.max(1, Number(env.LANDLORD_ONBOARDING_FOLLOWUP_DELAY_HOURS) || 24));
  const cutoff = new Date(now.getTime() - delayHours * 60 * 60 * 1000);

  await FollowupModel.updateMany(
    { status: "sending", claimedAt: { $lte: new Date(now.getTime() - CLAIM_STALE_AFTER_MS) } },
    { $set: { status: "unknown", lastErrorCode: "stale_send_claim" } }
  );

  const candidates = await UserModel.aggregate([
    { $match: {
      $or: [{ role: "landlord" }, { roles: "landlord" }],
      isEmailVerified: true,
      onboardingSource: { $ne: "admin" },
      createdAt: { $lte: cutoff }
    } },
    { $lookup: {
      from: ListingModel.collection.name,
      let: { candidateId: "$_id" },
      pipeline: [
        { $match: { $expr: { $and: [
          { $eq: ["$landlord", "$$candidateId"] }
        ] } } },
        { $limit: 1 },
        { $project: { _id: 1 } }
      ],
      as: "existingListings"
    } },
    { $match: { existingListings: { $size: 0 } } },
    { $lookup: {
      from: FollowupModel.collection.name,
      let: { candidateId: "$_id" },
      pipeline: [
        { $match: { $expr: { $and: [
          { $eq: ["$user", "$$candidateId"] },
          { $eq: ["$campaign", CAMPAIGN] }
        ] } } },
        { $project: { _id: 1, status: 1 } }
      ],
      as: "existingFollowups"
    } },
    { $match: { $or: [
      { existingFollowups: { $size: 0 } },
      { existingFollowups: { $elemMatch: { status: "pending" } } }
    ] } },
    { $sort: { createdAt: 1 } },
    { $limit: 250 },
    { $project: { name: 1, email: 1, role: 1, roles: 1, isEmailVerified: 1, onboardingSource: 1, createdAt: 1 } }
  ]);
  if (!candidates.length) return { enabled: true, scanned: 0, sent: 0 };

  let sent = 0;
  for (const user of candidates) {
    const followup = await ensureFollowup({ user, FollowupModel });
    if (followup.status !== "pending") continue;
    const result = await sendClaimedFollowup({ followupId: followup._id, now, models: { ...models, FollowupModel }, send, env });
    if (result.status === "sent") sent += 1;
  }
  return { enabled: true, scanned: candidates.length, sent };
};

const retryFailedFollowup = async ({ userId, actorId, models = {}, send = sendEmail, env = process.env, now = new Date() } = {}) => {
  if (env.LANDLORD_ONBOARDING_FOLLOWUP_ENABLED !== "true") return { status: "disabled" };
  if (!env.RESEND_API_KEY) return { status: "email_not_configured" };
  const FollowupModel = models.FollowupModel || Followup;
  const UserModel = models.UserModel || User;
  const failed = await FollowupModel.findOneAndUpdate(
    { user: userId, campaign: CAMPAIGN, status: "failed" },
    { $set: { status: "pending", manualRetryBy: actorId, manualRetryAt: now } },
    { new: true }
  );
  if (!failed) return { status: "not_retryable" };
  return sendClaimedFollowup({ followupId: failed._id, models: { ...models, FollowupModel, UserModel }, send, env, now });
};

module.exports = {
  CAMPAIGN,
  buildWhatsAppSupportUrl,
  deriveOnboardingStage,
  ensureFollowup,
  retryFailedFollowup,
  runLandlordOnboardingFollowups,
  sendClaimedFollowup
};
