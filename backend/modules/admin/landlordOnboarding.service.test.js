const test = require("node:test");
const assert = require("node:assert/strict");
const Followup = require("./landlordOnboardingFollowup.model");
const {
  buildWhatsAppSupportUrl,
  deriveOnboardingStage,
  runLandlordOnboardingFollowups,
  sendClaimedFollowup
} = require("./landlordOnboarding.service");

const makeDeliveryModels = ({ user = { _id: "user-1", name: "Landlord", email: "landlord@example.com", role: "landlord", isEmailVerified: true }, listing = null } = {}) => {
  let status = "pending";
  const updates = [];
  const models = {
    FollowupModel: {
      findById: () => ({ select: () => ({ lean: async () => ({ user: user._id }) }) }),
      async findOneAndUpdate(filter, update) {
        if (status !== "pending" || filter.status !== "pending") return null;
        status = "sending";
        return { _id: "followup-1", user: user._id };
      },
      async updateOne(_filter, update) {
        updates.push(update.$set);
        status = update.$set.status;
      }
    },
    UserModel: {
      findById: () => ({ select: () => ({ lean: async () => user }) })
    },
    ListingModel: {
      findOne: () => ({ select: () => ({ lean: async () => listing }) })
    },
    ContactInfoModel: {
      findOne: () => ({ select: () => ({ lean: async () => ({ whatsapp: "+254 712 345 678" }) }) })
    }
  };
  return { models, updates, status: () => status };
};

test("onboarding stage is based on persisted verification, plan, and listing state", () => {
  assert.equal(deriveOnboardingStage({ user: { isEmailVerified: false } }), "email_unverified");
  assert.equal(deriveOnboardingStage({ user: { isEmailVerified: true }, subscription: { status: "pending_payment" } }), "plan_payment");
  assert.equal(deriveOnboardingStage({ user: { isEmailVerified: true }, listingCounts: { total: 0 } }), "no_listing");
  assert.equal(deriveOnboardingStage({ user: { isEmailVerified: true }, listingCounts: { total: 1, pending: 1 } }), "listing_review");
  assert.equal(deriveOnboardingStage({ user: { isEmailVerified: true }, listingCounts: { total: 1, rejected: 1 } }), "listing_needs_changes");
  assert.equal(deriveOnboardingStage({ user: { isEmailVerified: true }, listingCounts: { total: 1, approved: 1 } }), "listing_live");
  assert.equal(deriveOnboardingStage({ user: { isEmailVerified: true }, listingCounts: { total: 1, visible: 0, deleted: 1 } }), "listing_removed");
});

test("WhatsApp help link accepts only a canonical Kenyan number or exact wa.me phone URL", () => {
  assert.match(buildWhatsAppSupportUrl("+254 712 345 678"), /^https:\/\/wa\.me\/254712345678\?text=/);
  assert.match(buildWhatsAppSupportUrl("https://wa.me/254712345678"), /^https:\/\/wa\.me\/254712345678\?text=/);
  assert.equal(buildWhatsAppSupportUrl("https://attacker.example/254712345678"), "");
  assert.equal(buildWhatsAppSupportUrl("javascript:alert(1)"), "");
});

test("automated follow-up is disabled unless the explicit feature flag is enabled", async () => {
  const result = await runLandlordOnboardingFollowups({ env: {}, models: {
    UserModel: { find() { throw new Error("Database must not be touched while disabled"); } }
  } });
  assert.deepEqual(result, { enabled: false, scanned: 0, sent: 0 });
  assert.deepEqual(await sendClaimedFollowup({ followupId: "x", env: {} }), { status: "disabled" });
});

test("follow-up outbox enforces one event per landlord and campaign", () => {
  const indexes = Followup.schema.indexes();
  assert.ok(indexes.some(([keys, options]) => keys.user === 1 && keys.campaign === 1 && options.unique === true));
});

test("a pending follow-up is claimed once and only sent to an eligible landlord", async () => {
  const fixture = makeDeliveryModels();
  let sends = 0;
  const send = async (message) => { sends += 1; assert.match(message.html, /wa\.me\/254712345678/); return { data: { id: "mail-1" } }; };
  const results = await Promise.all([
    sendClaimedFollowup({ followupId: "followup-1", models: fixture.models, send, env: { LANDLORD_ONBOARDING_FOLLOWUP_ENABLED: "true", RESEND_API_KEY: "configured" } }),
    sendClaimedFollowup({ followupId: "followup-1", models: fixture.models, send, env: { LANDLORD_ONBOARDING_FOLLOWUP_ENABLED: "true", RESEND_API_KEY: "configured" } })
  ]);
  assert.equal(sends, 1);
  assert.equal(results.filter((result) => result.status === "sent").length, 1);
  assert.equal(fixture.status(), "sent");
});

test("follow-up is suppressed if a listing was added before delivery", async () => {
  const fixture = makeDeliveryModels({ listing: { _id: "listing-1" } });
  let sends = 0;
  const result = await sendClaimedFollowup({
    followupId: "followup-1",
    models: fixture.models,
    send: async () => { sends += 1; return { data: { id: "mail-1" } }; },
    env: { LANDLORD_ONBOARDING_FOLLOWUP_ENABLED: "true", RESEND_API_KEY: "configured" }
  });
  assert.equal(result.status, "suppressed");
  assert.equal(sends, 0);
  assert.equal(fixture.status(), "suppressed");
});

test("ambiguous email send outcomes are quarantined instead of retried", async () => {
  const fixture = makeDeliveryModels();
  const result = await sendClaimedFollowup({
    followupId: "followup-1",
    models: fixture.models,
    send: async () => { throw new Error("connection interrupted"); },
    env: { LANDLORD_ONBOARDING_FOLLOWUP_ENABLED: "true", RESEND_API_KEY: "configured" }
  });
  assert.equal(result.status, "unknown");
  assert.equal(fixture.status(), "unknown");
  assert.equal(fixture.updates.at(-1).lastErrorCode, "delivery_result_unknown");
});
