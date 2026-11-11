const test = require("node:test");
const assert = require("node:assert/strict");
const { isValidGoogleMapsUrl } = require("./listings.controller");

test("Google Maps link validator accepts supported HTTPS share hosts", () => {
  for (const value of [
    "https://www.google.com/maps/place/Nairobi",
    "https://maps.google.com/?q=Nairobi",
    "https://maps.app.goo.gl/example",
    "https://goo.gl/maps/example"
  ]) assert.equal(isValidGoogleMapsUrl(value), true);
  assert.equal(isValidGoogleMapsUrl(""), true);
});

test("Google Maps link validator rejects non-HTTPS and untrusted hosts", () => {
  for (const value of [
    "http://www.google.com/maps/place/Nairobi",
    "https://google.com.example.org/maps",
    "javascript:alert(1)",
    "not a URL"
  ]) assert.equal(isValidGoogleMapsUrl(value), false);
});
