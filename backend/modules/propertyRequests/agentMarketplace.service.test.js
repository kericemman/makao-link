const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeServiceAreas, isWithinServiceAreas, requestWithinServiceAreas } = require("./agentMarketplace.service");

test("agent service areas normalize and deduplicate supported county towns", () => {
  assert.deepEqual(normalizeServiceAreas([
    { county: "Nairobi", towns: ["Westlands", "westlands", "kilimani"] },
    { county: "Kiambu", towns: [] }
  ]), [
    { county: "nairobi", towns: ["westlands", "kilimani"] },
    { county: "kiambu", towns: [] }
  ]);
});

test("invalid service areas and duplicate counties are rejected", () => {
  assert.throws(() => normalizeServiceAreas([{ county: "Nairobi", towns: ["ruaka"] }]), /Choose valid towns/);
  assert.throws(() => normalizeServiceAreas([{ county: "Nairobi", towns: [] }, { county: "nairobi", towns: ["westlands"] }]), /selected once/);
});

test("listing and request service-area checks require a relevant known location", () => {
  const areas = [{ county: "nairobi", towns: ["westlands"] }, { county: "kiambu", towns: [] }];
  assert.equal(isWithinServiceAreas(areas, "NAIROBI", "Westlands"), true);
  assert.equal(isWithinServiceAreas(areas, "nairobi", "kilimani"), false);
  assert.equal(isWithinServiceAreas(areas, "kiambu", "ruaka"), true);
  assert.equal(requestWithinServiceAreas(areas, [{ county: "nairobi", town: "kilimani" }]), false);
  assert.equal(requestWithinServiceAreas(areas, [{ county: "kiambu" }]), true);
  assert.equal(requestWithinServiceAreas(areas, []), false);
});
