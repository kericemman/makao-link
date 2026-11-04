const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeKenyanPhone, phoneUniquenessFilter } = require("../../utils/kenyanPhone");

test("normalizes display separators but requires Kenyan +254 mobile format", () => {
  assert.equal(normalizeKenyanPhone("+254 712 345 678"), "+254712345678");
  assert.equal(normalizeKenyanPhone("+254 (1) 123-45678"), "+254112345678");
  for (const value of ["0712345678", "254712345678", "+254 212 345 678", "+25471234567", "abc"]) {
    assert.throws(() => normalizeKenyanPhone(value), /starting with \+254/);
  }
});

test("phone uniqueness lookup covers legacy local and international spellings", () => {
  const filter = phoneUniquenessFilter("+254712345678");
  assert.equal(filter.$or[0].phoneCanonical, "+254712345678");
  assert.match("0712 345-678", filter.$or[3].phone.$regex);
  assert.match("+254 712 345 678", filter.$or[2].phone.$regex);
});
