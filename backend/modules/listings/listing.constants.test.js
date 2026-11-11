const test = require("node:test");
const assert = require("node:assert/strict");
const { COUNTIES, COUNTY_TITLES, COUNTY_TOWNS, LEGACY_COUNTY_ALIASES } = require("./listing.constants");

test("location catalogue contains each of Kenya's 47 counties exactly once", () => {
  assert.equal(COUNTIES.length, 47);
  assert.equal(new Set(COUNTIES).size, 47);
  assert.equal(Object.keys(COUNTY_TITLES).length, 47);
  assert.ok(COUNTIES.every((county) => COUNTY_TOWNS[county]?.length > 0));
});

test("each county town option is unique and uses the persisted slug format", () => {
  for (const towns of Object.values(COUNTY_TOWNS)) {
    assert.equal(new Set(towns).size, towns.length);
    assert.ok(towns.every((town) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(town)));
  }
});

test("old county values have canonical edit/search aliases", () => {
  assert.deepEqual(LEGACY_COUNTY_ALIASES, { eldoret: "uasin-gishu", naivasha: "nakuru" });
  assert.ok(COUNTY_TOWNS[LEGACY_COUNTY_ALIASES.eldoret].includes("eldoret-town"));
  assert.ok(COUNTY_TOWNS[LEGACY_COUNTY_ALIASES.naivasha].includes("naivasha-road"));
});
