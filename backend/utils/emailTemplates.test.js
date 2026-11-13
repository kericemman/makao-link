const test = require("node:test");
const assert = require("node:assert/strict");
const { blogPublishedEmail, stayRequestReceivedEmail, welcomeEmail } = require("./emailTemplates");

test("published article email uses the article heading, cover, excerpt, and a text link", () => {
  const html = blogPublishedEmail({
    title: "A Practical Guide to Renting",
    excerpt: "Learn what to prepare before listing your rental property.",
    slug: "practical-guide-to-renting",
    coverImage: "https://cdn.example.com/cover.jpg",
    coverImageAlt: "A rental home"
  });

  assert.match(html, /<h1[^>]*>A Practical Guide to Renting<\/h1>/);
  assert.match(html, /src="https:\/\/cdn\.example\.com\/cover\.jpg"/);
  assert.match(html, /Learn what to prepare before listing your rental property\./);
  assert.match(html, /href="https:\/\/rendahomes\.com\/blog\/practical-guide-to-renting"[^>]*>Read More<\/a>/);
  assert.doesNotMatch(html, /New on RendaHomes Insights|Read Full Article/);
  assert.doesNotMatch(html, /bgcolor="#0D915C"/);
});

test("published article email escapes content and excludes unsafe cover URLs", () => {
  const html = blogPublishedEmail({
    title: "<script>bad</script>",
    excerpt: "<img src=x>",
    slug: "safe-slug",
    coverImage: "javascript:alert(1)"
  });

  assert.equal(html.includes("<script>bad</script>"), false);
  assert.equal(html.includes("<img src=x>"), false);
  assert.equal(html.includes("javascript:alert(1)"), false);
  assert.match(html, /&lt;script&gt;bad&lt;\/script&gt;/);
});

test("landlord welcome email explains Renda Homes and links to dashboard and listing guide", () => {
  const html = welcomeEmail({ name: "Test Landlord", planName: "Free", isFreePlan: true });

  assert.match(html, /Welcome to Renda Homes/);
  assert.match(html, /<span[^>]*>Renda Homes<\/span>/);
  assert.match(html, /© \d{4} Renda Homes LTD\. All rights reserved\./);
  assert.doesNotMatch(html, /Find\. Rent\. Live\./);
  assert.doesNotMatch(html, /border:\s*1px solid/i);
  assert.match(html, /\.rh-content \{ padding: 18px 14px !important; \}/);
  assert.match(html, /tenant inquiries/);
  assert.match(html, /up to two property listings/);
  assert.match(html, /Open Your Landlord Dashboard/);
  assert.match(html, /https:\/\/landlord\.rendahomes\.com\/login/);
  assert.match(html, /https:\/\/rendahomes\.com\/blog\/how-to-list-your-property-on-renda-a-step-by-step-guide-for-landlords-and-property-owners-in-kenya/);
  assert.match(html, /Submit for review/);
});

test("landlord welcome email escapes the plan name", () => {
  const html = welcomeEmail({ name: "Test Landlord", planName: "<script>bad</script>", isFreePlan: false });

  assert.equal(html.includes("<script>bad</script>"), false);
  assert.match(html, /&lt;script&gt;bad&lt;\/script&gt;/);
});

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
