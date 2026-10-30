const crypto = require("crypto");
const AppAlert = require("../alerts/alert.model");
const Listing = require("../listings/listings.model");

class InquiryNotAllowedError extends Error {
  constructor(message, statusCode = 403) {
    super(message);
    this.name = "InquiryNotAllowedError";
    this.statusCode = statusCode;
  }
}

const hashSourceKey = ({ conversationId, idempotencyKey }) => crypto
  .createHash("sha256")
  .update(`${String(conversationId)}:${String(idempotencyKey)}`)
  .digest("hex");

const createWhatsAppListingInquiry = async ({
  conversation,
  listingId,
  message,
  idempotencyKey,
  ListingModel = Listing,
  AlertModel = AppAlert
} = {}) => {
  if (!conversation || conversation.accountLinkStatus !== "verified" || !conversation.linkedUser) {
    throw new InquiryNotAllowedError("Verify your RendaHomes account before sending a listing inquiry.");
  }
  if (conversation.serviceConsent !== "granted") {
    throw new InquiryNotAllowedError("Explicit Renda Assistant consent is required before sending an inquiry.");
  }
  if (typeof listingId !== "string" || !/^[a-f\d]{24}$/i.test(listingId)) {
    throw new TypeError("A valid listing ID is required");
  }
  const inquiryMessage = String(message || "").trim();
  if (!inquiryMessage || inquiryMessage.length > 1200) throw new TypeError("Inquiry message must be between 1 and 1200 characters");
  if (typeof idempotencyKey !== "string" || !idempotencyKey.trim() || idempotencyKey.length > 200) {
    throw new TypeError("A stable inquiry idempotency key is required");
  }

  const listing = await ListingModel.findOne({
    _id: listingId,
    status: "approved",
    isActive: true,
    availability: "available",
    isDeleted: { $ne: true }
  }).select("_id landlord").lean();
  if (!listing) throw new InquiryNotAllowedError("This listing is no longer available.", 404);

  const sourceKey = hashSourceKey({ conversationId: conversation._id, idempotencyKey });
  try {
    const inquiry = await AlertModel.findOneAndUpdate(
      { source: "whatsapp_assistant", sourceKey },
      {
        $setOnInsert: {
          listing: listing._id,
          landlord: listing.landlord,
          user: conversation.linkedUser,
          message: inquiryMessage,
          source: "whatsapp_assistant",
          sourceKey,
          readByUser: true,
          readByLandlord: false
        }
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    return { inquiryId: String(inquiry._id), status: "created_or_existing" };
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const existing = await AlertModel.findOne({ source: "whatsapp_assistant", sourceKey }).select("_id").lean();
    if (!existing) throw error;
    return { inquiryId: String(existing._id), status: "created_or_existing" };
  }
};

module.exports = { InquiryNotAllowedError, createWhatsAppListingInquiry, hashSourceKey };
