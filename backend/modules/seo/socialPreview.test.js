const test = require("node:test");
const assert = require("node:assert/strict");
const { buildSocialPreviewHtml, imageUrl, plainText } = require("./socialPreview");

test("social preview metadata replaces homepage tags with escaped page values", () => {
  const html = `<!doctype html><html><head><title>Home</title><meta name="description" content="Home page"><meta property="og:title" content="Home"><meta property="og:image" content="https://rendahomes.com/logo.png"><meta name="twitter:title" content="Home"></head><body><div id="root"></div></body></html>`;
  const output = buildSocialPreviewHtml({
    html,
    title: "Two-bedroom & studio",
    description: "Bright & spacious",
    url: "https://rendahomes.com/listings/123",
    image: "https://images.example.test/home.jpg"
  });

  assert.match(output, /<title>Two-bedroom &amp; studio<\/title>/);
  assert.match(output, /property="og:title" content="Two-bedroom &amp; studio"/);
  assert.match(output, /property="og:image" content="https:\/\/images\.example\.test\/home\.jpg"/);
  assert.match(output, /rel="canonical" href="https:\/\/rendahomes\.com\/listings\/123"/);
  assert.doesNotMatch(output, /property="og:image" content="https:\/\/rendahomes\.com\/logo\.png"/);
});

test("preview text and images are normalized safely", () => {
  assert.equal(plainText("<p>Home&nbsp; near town</p>", 100), "Home near town");
  assert.equal(imageUrl("/uploads/cover.png", "https://rendahomes.com", "fallback"), "https://rendahomes.com/uploads/cover.png");
  assert.equal(imageUrl("javascript:alert(1)", "https://rendahomes.com", "fallback"), "fallback");
});
