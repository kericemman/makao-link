const crypto = require("node:crypto");
const mongoose = require("mongoose");
const Conversation = require("./conversation.model");
const assistantService = require("./rendaAssistant.service");

const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

class AccountLinkError extends Error {
  constructor() {
    super("Account link could not be completed. Request a fresh link and try again.");
    this.name = "AccountLinkError";
    this.statusCode = 400;
  }
}

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const createAccountLinkChallenge = async ({ conversationId, now = new Date() }) => {
  assistantService.requireEnabled();
  if (typeof conversationId !== "string" || !mongoose.isValidObjectId(conversationId)) throw new AccountLinkError();

  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + CHALLENGE_TTL_MS);
  const conversation = await Conversation.findOneAndUpdate(
    {
      _id: conversationId,
      expiresAt: { $gt: now },
      accountLinkStatus: { $in: ["unlinked", "pending"] }
    },
    {
      $set: {
        accountLinkStatus: "pending",
        linkChallengeHash: hashToken(token),
        linkChallengeExpiresAt: expiresAt
      }
    },
    { new: true }
  );
  if (!conversation) throw new AccountLinkError();
  return { token, expiresAt };
};

const confirmAccountLink = async ({ token, userId, confirmed, now = new Date() }) => {
  assistantService.requireEnabled();
  if (confirmed !== true || typeof token !== "string" || !TOKEN_PATTERN.test(token) || !mongoose.isValidObjectId(userId)) {
    throw new AccountLinkError();
  }

  const conversation = await Conversation.findOneAndUpdate(
    {
      linkChallengeHash: hashToken(token),
      linkChallengeExpiresAt: { $gt: now },
      expiresAt: { $gt: now },
      accountLinkStatus: "pending"
    },
    {
      $set: { linkedUser: userId, accountLinkStatus: "verified" },
      $unset: { linkChallengeHash: 1, linkChallengeExpiresAt: 1 }
    },
    { new: true }
  ).select("_id linkedUser accountLinkStatus");
  if (!conversation) throw new AccountLinkError();
  return conversation;
};

module.exports = { AccountLinkError, CHALLENGE_TTL_MS, createAccountLinkChallenge, confirmAccountLink };
