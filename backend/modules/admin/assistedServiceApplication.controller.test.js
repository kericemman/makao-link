const test = require("node:test");
const assert = require("node:assert/strict");
const { validateAssistedServiceApplication } = require("./assistedServiceApplication.controller");

const valid = {
  companyName: "Swift Movers", contactPerson: "Amina Otieno", email: "AMINA@example.test", phone: "+254712345678",
  category: "movers", description: "Home and office moves.", location: "Nairobi", website: "https://swift.example.test"
};

test("admin-assisted provider validation normalizes email and keeps approved service categories", () => {
  const result = validateAssistedServiceApplication(valid);
  assert.equal(result.error, undefined);
  assert.equal(result.application.email, "amina@example.test");
  assert.equal(result.application.category, "movers");
});

test("admin-assisted provider validation rejects unsupported categories and invalid websites", () => {
  assert.ok(validateAssistedServiceApplication({ ...valid, category: "property_management" }).error);
  assert.match(validateAssistedServiceApplication({ ...valid, website: "http://unsafe.example.test" }).error, /HTTPS/);
});

test("admin-assisted provider validation enforces required fields and length limits", () => {
  assert.ok(validateAssistedServiceApplication({ ...valid, email: "bad" }).error);
  assert.ok(validateAssistedServiceApplication({ ...valid, description: "" }).error);
  assert.ok(validateAssistedServiceApplication({ ...valid, companyName: "x".repeat(161) }).error);
});
