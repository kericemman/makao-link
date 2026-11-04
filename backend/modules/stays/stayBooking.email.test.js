const test = require("node:test");
const assert = require("node:assert/strict");

const replaceModule = (modulePath, exports, originals) => {
  const resolved = require.resolve(modulePath);
  if (!originals.has(resolved)) originals.set(resolved, require.cache[resolved]);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
};

test("stay request emails the host and still succeeds when email delivery fails", async (t) => {
  const originals = new Map();
  const sentEmails = [];
  const listing = {
    _id: "listing-test-id",
    title: "Test cottage",
    landlord: { _id: "host-test-id", name: "Test Host", email: "host@example.test" },
    maxGuests: 4,
    minNights: 1,
    contactPhone: "+254700000000"
  };
  const requestRows = [];
  let emailBehavior = async () => ({ data: { id: "email-test-id" } });
  const Listing = {
    findOne: () => ({ select() { return this; }, populate: async () => listing })
  };
  const StayBooking = {
    exists: async () => null,
    create: async (data) => {
      const row = { ...data, _id: `stay-${requestRows.length + 1}`, createdAt: new Date(), status: "requested" };
      requestRows.push(row);
      return row;
    }
  };
  const controllerPath = require.resolve("./stayBooking.controller");
  originals.set(controllerPath, require.cache[controllerPath]);
  delete require.cache[controllerPath];
  replaceModule("../listings/listings.model", Listing, originals);
  replaceModule("./stayBooking.model", StayBooking, originals);
  replaceModule("../../utils/sendEmail", async (payload) => { sentEmails.push(payload); return emailBehavior(); }, originals);
  replaceModule("../admin/adminActivity.service", { recordAdminActivity: async () => {} }, originals);
  replaceModule("../renda-assistant/notifications.service", {
    queueStatusNotificationSafely: async () => ({ disabled: true }),
    queueContactStatusNotificationSafely: async () => ({ disabled: true })
  }, originals);
  replaceModule("../authorization/authorization.service", { hasRole: () => false }, originals);
  const { createStayRequest } = require("./stayBooking.controller");
  t.after(() => {
    delete require.cache[controllerPath];
    for (const [resolved, original] of originals) {
      if (original) require.cache[resolved] = original;
      else delete require.cache[resolved];
    }
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const request = {
    params: { listingId: listing._id },
    body: {
      guestName: "Guest Name",
      guestEmail: "guest@example.test",
      guestPhone: "+254711111111",
      checkIn: tomorrow.toISOString().slice(0, 10),
      checkOut: dayAfter.toISOString().slice(0, 10),
      guests: "2",
      message: "Please confirm late check-in."
    }
  };
  const invoke = async () => {
    const response = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; }
    };
    await createStayRequest(request, response, (error) => { throw error; });
    return response;
  };

  const successful = await invoke();
  assert.equal(successful.statusCode, 201);
  assert.equal(sentEmails[0].to, listing.landlord.email);
  assert.match(sentEmails[0].subject, /RH-[A-F0-9]+/);
  assert.match(sentEmails[0].html, /Guest Name/);
  assert.match(sentEmails[0].html, /Test cottage/);
  assert.match(sentEmails[0].html, /\/stay-requests/);

  emailBehavior = async () => ({ error: { message: "provider unavailable" } });
  const providerFailed = await invoke();
  assert.equal(providerFailed.statusCode, 201);
  assert.equal(requestRows.length, 2);
  assert.equal(sentEmails.length, 2);
});
