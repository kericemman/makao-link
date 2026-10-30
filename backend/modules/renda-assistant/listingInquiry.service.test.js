const test = require("node:test");
const assert = require("node:assert/strict");
const { createWhatsAppListingInquiry, hashSourceKey } = require("./listingInquiry.service");

const listingId = "507f1f77bcf86cd799439011";
const conversation = {
  _id: "507f1f77bcf86cd799439012",
  linkedUser: "507f1f77bcf86cd799439013",
  accountLinkStatus: "verified",
  serviceConsent: "granted"
};

const makeModels = () => {
  const calls = {};
  const ListingModel = {
    findOne(filter) {
      calls.listingFilter = filter;
      return { select() { return this; }, lean: async () => ({ _id: listingId, landlord: "landlord-id" }) };
    }
  };
  const AlertModel = {
    findOneAndUpdate: async (...args) => { calls.alertArgs = args; return { _id: "alert-id" }; }
  };
  return { calls, ListingModel, AlertModel };
};

test("WhatsApp inquiry requires verified account linking and consent", async () => {
  const { ListingModel, AlertModel } = makeModels();
  await assert.rejects(createWhatsAppListingInquiry({
    conversation: { ...conversation, accountLinkStatus: "unlinked" }, listingId, message: "Interested", idempotencyKey: "evt-1", ListingModel, AlertModel
  }), { statusCode: 403 });
  await assert.rejects(createWhatsAppListingInquiry({
    conversation: { ...conversation, serviceConsent: "withdrawn" }, listingId, message: "Interested", idempotencyKey: "evt-1", ListingModel, AlertModel
  }), { statusCode: 403 });
});

test("creates only an AppAlert, derives landlord from public listing, and hashes its stable idempotency key", async () => {
  const { calls, ListingModel, AlertModel } = makeModels();
  const result = await createWhatsAppListingInquiry({
    conversation, listingId, message: "I would like to view this home.", idempotencyKey: "provider-event-7", ListingModel, AlertModel
  });
  assert.equal(result.inquiryId, "alert-id");
  assert.deepEqual(calls.listingFilter, {
    _id: listingId, status: "approved", isActive: true, availability: "available", isDeleted: { $ne: true }
  });
  assert.equal(calls.alertArgs[0].source, "whatsapp_assistant");
  assert.equal(calls.alertArgs[1].$setOnInsert.user, conversation.linkedUser);
  assert.equal(calls.alertArgs[1].$setOnInsert.landlord, "landlord-id");
  assert.equal(calls.alertArgs[1].$setOnInsert.sourceKey, hashSourceKey({ conversationId: conversation._id, idempotencyKey: "provider-event-7" }));
  assert.equal(calls.alertArgs[1].$setOnInsert.sourceKey.includes("provider-event-7"), false);
});

test("rejects malformed messages and idempotency data before persistence", async () => {
  const { ListingModel, AlertModel } = makeModels();
  await assert.rejects(createWhatsAppListingInquiry({ conversation, listingId, message: " ", idempotencyKey: "e", ListingModel, AlertModel }), /Inquiry message/);
  await assert.rejects(createWhatsAppListingInquiry({ conversation, listingId, message: "valid", idempotencyKey: "", ListingModel, AlertModel }), /idempotency key/);
});
