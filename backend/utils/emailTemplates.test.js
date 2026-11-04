const test = require("node:test");
const assert = require("node:assert/strict");
const { stayRequestReceivedEmail } = require("./emailTemplates");

test("stay request host email includes booking details and landlord dashboard link", () => {
  const html = stayRequestReceivedEmail({
    landlordName: "Host",
    listingTitle: "Garden cottage",
    guestName: "Guest",
    guestEmail: "guest@example.test",
    guestPhone: "+254700000000",
    requestCode: "RH-AB12CD34",
    checkIn: "2026-12-02T00:00:00.000Z",
    checkOut: "2026-12-05T00:00:00.000Z",
    guests: 2,
    message: "We arrive late."
  });

  assert.match(html, /New Short-Stay Request/);
  assert.match(html, /RH-AB12CD34/);
  assert.match(html, /2 Dec 2026 – 5 Dec 2026/);
  assert.match(html, /https:\/\/landlord\.rendahomes\.com\/stay-requests/);
  assert.match(html, /not a confirmed reservation/i);
});

test("stay request host email escapes applicant-controlled HTML", () => {
  const html = stayRequestReceivedEmail({
    landlordName: "Host",
    listingTitle: "<script>alert(1)</script>",
    guestName: "<img src=x>",
    guestEmail: "guest@example.test",
    guestPhone: "0712345678",
    requestCode: "RH-AB12CD34",
    checkIn: "2026-12-02T00:00:00.000Z",
    checkOut: "2026-12-03T00:00:00.000Z",
    guests: 1,
    message: "<b>hello</b>\nnext line"
  });

  assert.equal(html.includes("<script>alert(1)</script>"), false);
  assert.equal(html.includes("<img src=x>"), false);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /&lt;b&gt;hello&lt;\/b&gt;<br \/>next line/);
});
