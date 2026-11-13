const test = require("node:test");
const assert = require("node:assert/strict");
const { getArticleValidationMessage } = require("./blog.controller");
const Blog = require("./blog.model");

test("article metadata and accessible cover text are persisted by the schema", () => {
  for (const field of ["category", "tags", "metaTitle", "metaDescription", "coverImageAlt"]) {
    assert.ok(Blog.schema.path(field), `${field} should be a schema field`);
  }
});

test("article drafts can be saved with a title before body and summary are ready", () => {
  assert.equal(
    getArticleValidationMessage({ title: "How to list", status: "draft" }),
    ""
  );
});

test("article title is required and limited", () => {
  assert.match(getArticleValidationMessage({ status: "draft" }), /title/i);
  assert.match(
    getArticleValidationMessage({ title: "x".repeat(181), status: "draft" }),
    /180 characters/i
  );
});

test("publishing requires a useful summary, body text, and category", () => {
  const valid = {
    title: "How to list a home on RendaHomes",
    excerpt: "A practical step-by-step guide.",
    content: "<h2>Prepare your details</h2><p>Start with clear property information.</p>",
    category: "Landlord Guide",
    status: "published"
  };

  assert.equal(getArticleValidationMessage(valid), "");
  assert.match(getArticleValidationMessage({ ...valid, excerpt: " " }), /summary/i);
  assert.match(getArticleValidationMessage({ ...valid, content: "<p>&nbsp;</p>" }), /content/i);
  assert.match(getArticleValidationMessage({ ...valid, category: "" }), /category/i);
});

test("existing published articles remain editable without revalidating legacy publish details", () => {
  assert.equal(
    getArticleValidationMessage({ title: "Legacy article", status: "published" }, false),
    ""
  );
});
