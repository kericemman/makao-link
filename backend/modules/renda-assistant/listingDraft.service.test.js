const test = require("node:test");
const assert = require("node:assert/strict");
const {
  ListingDraftAccessError,
  getMissingListingFields,
  getOwnedListingDraft,
  markListingDraftSubmitted,
  normalizeListingDraftPatch,
  saveListingDraft,
  toPortalUrl
} = require("./listingDraft.service");

const conversation = {
  _id: "507f1f77bcf86cd799439011",
  linkedUser: "507f1f77bcf86cd799439012",
  accountLinkStatus: "verified",
  serviceConsent: "granted",
  workflow: { intent: "list_property" }
};

const ownerUserModel = {
  findById: () => ({ select() { return this; }, lean: async () => ({ _id: conversation.linkedUser, role: "landlord" }) })
};

const createDraftModel = () => {
  const db = { draft: null };
  return {
    db,
    findOneAndUpdate: (filter, update) => {
      if (db.draft && db.draft.status !== "collecting") return null;
      if (!db.draft) db.draft = {
        _id: "507f1f77bcf86cd799439013", fields: {}, revision: 0, status: "collecting"
      };
      for (const [path, value] of Object.entries(update.$set || {})) {
        if (path.startsWith("fields.")) db.draft.fields[path.slice(7)] = value;
        else db.draft[path] = value;
      }
      db.draft.revision += update.$inc?.revision || 0;
      return { lean: async () => structuredClone(db.draft) };
    },
    findOne: (filter) => ({ lean: async () => {
      if (filter?.landlord && db.draft && String(db.draft.landlord) !== String(filter.landlord)) return null;
      return db.draft;
    } })
  };
};

test("normalizes Kenyan locations, BnB purpose, and enum types without accepting unknown fields", () => {
  assert.deepEqual(normalizeListingDraftPatch({
    county: "Nairobi County", town: "Westlands", purpose: "bnb", type: "apartment", price: "8500"
  }), { county: "nairobi", town: "westlands", purpose: "short_stay", type: "apartment", price: 8500 });
  assert.throws(() => normalizeListingDraftPatch({ title: "Home", isActive: true }), /Unsupported/);
  assert.throws(() => normalizeListingDraftPatch({ county: "nairobi", town: "Nyali" }), /does not match/);
  assert.throws(() => normalizeListingDraftPatch({ totalUnits: 10 }, { plan: "basic" }), { code: "ADVANCED_PLAN_REQUIRED" });
  assert.throws(() => normalizeListingDraftPatch({ availableUnits: 4, totalUnits: 3 }, { plan: "pro" }), /cannot exceed/);
});

test("draft readiness follows the current Listing model's type-specific requirements", () => {
  const base = { title: "Home", description: "Description", purpose: "rent", price: 1000, county: "nairobi", town: "westlands", type: "apartment", contactPhone: "0712345678" };
  assert.deepEqual(getMissingListingFields(base), ["bedrooms", "bathrooms"]);
  assert.deepEqual(getMissingListingFields({ ...base, bedrooms: 2, bathrooms: 1 }), []);
  assert.deepEqual(getMissingListingFields({ ...base, type: "office", purpose: "short_stay" }), ["size", "maxGuests", "minNights"]);
});

test("saves only a private draft for consented, linked landlord under existing plan access", async () => {
  const DraftModel = createDraftModel();
  const result = await saveListingDraft({
    conversation,
    patch: { title: "Westlands apartment", county: "Nairobi", town: "Westlands", purpose: "rent", price: 40000 },
    UserModel: ownerUserModel,
    DraftModel,
    canCreate: async () => ({ allowed: true, subscription: { plan: "basic" } })
  });
  assert.equal(result.status, "collecting");
  assert.deepEqual(result.missingFields, ["description", "type", "contactPhone"]);
  assert.equal(DraftModel.db.draft.landlord, conversation.linkedUser);
  assert.equal(DraftModel.db.draft.fields.county, "nairobi");
  assert.equal(DraftModel.db.draft.createdBy, conversation.linkedUser);
  assert.match(decodeURIComponent(result.portalUrl), /\/listings\/new\?draftId=507f1f77bcf86cd799439013/);
  assert.match(result.mediaInstruction, /photos in the secure landlord portal/);
});

test("a re-linked WhatsApp conversation cannot inherit or overwrite another landlord's draft", async () => {
  const DraftModel = createDraftModel();
  DraftModel.db.draft = {
    _id: "507f1f77bcf86cd799439013", landlord: "previous-owner", fields: { title: "Private draft" }, revision: 1, status: "collecting"
  };
  await assert.rejects(saveListingDraft({
    conversation,
    patch: { title: "New draft" },
    UserModel: ownerUserModel,
    DraftModel,
    canCreate: async () => ({ allowed: true, subscription: { plan: "basic" } })
  }), { code: "DRAFT_CONFLICT", statusCode: 409 });
  assert.equal(DraftModel.db.draft.landlord, "previous-owner");
  assert.equal(DraftModel.db.draft.fields.title, "Private draft");
});

test("does not save when consent, account link, or plan access is missing", async () => {
  const DraftModel = createDraftModel();
  await assert.rejects(saveListingDraft({
    conversation: { ...conversation, accountLinkStatus: "unlinked" }, patch: { title: "Home" },
    UserModel: ownerUserModel, DraftModel
  }), { statusCode: 403 });
  await assert.rejects(saveListingDraft({
    conversation, patch: { title: "Home" }, UserModel: ownerUserModel, DraftModel,
    canCreate: async () => ({ allowed: false, code: "PAYMENT_REQUIRED", message: "Complete plan payment first." })
  }), { code: "PAYMENT_REQUIRED" });
  assert.equal(DraftModel.db.draft, null);
});

test("draft retrieval is owner-scoped and a draft closes only after a real pending listing exists", async () => {
  const DraftModel = {
    findOne: (filter) => ({ lean: async () => filter.landlord === "owner" ? ({ _id: filter._id, landlord: "owner", status: "collecting", expiresAt: new Date(Date.now() + 60000), fields: {} }) : null }),
    findOneAndUpdate: (filter, update) => ({ lean: async () => filter.landlord === "owner" && update.$set.status === "submitted" ? ({ _id: filter._id, ...update.$set }) : null })
  };
  const ListingModel = { findOne: (filter) => ({ select() { return this; }, lean: async () => filter.status === "pending" ? ({ _id: filter._id }) : null }) };
  await assert.rejects(getOwnedListingDraft({ draftId: "507f1f77bcf86cd799439014", landlordId: "other", DraftModel }), { statusCode: 404 });
  const result = await markListingDraftSubmitted({ draftId: "507f1f77bcf86cd799439014", landlordId: "owner", actorId: "agent", listingId: "507f1f77bcf86cd799439015", DraftModel, ListingModel });
  assert.equal(result.status, "submitted");
});

test("draft resume URL encodes the authenticated portal continuation and rejects no authorization by URL alone", () => {
  const url = toPortalUrl("draft-id");
  assert.match(url, /^https:\/\/[^/]+\/login\?next=/);
  assert.match(decodeURIComponent(url), /draftId=draft-id/);
  assert.ok(ListingDraftAccessError);
});
