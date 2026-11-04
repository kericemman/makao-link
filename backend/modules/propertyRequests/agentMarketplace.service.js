const { COUNTY_TOWNS } = require("../listings/listing.constants");

const normalized = (value) => String(value || "").trim().toLowerCase();

const normalizeServiceAreas = (input) => {
  if (!Array.isArray(input) || input.length > Object.keys(COUNTY_TOWNS).length) {
    const error = new Error("Provide valid county service areas.");
    error.statusCode = 400;
    throw error;
  }
  const areas = input.map((item) => {
    const county = normalized(item?.county);
    const allowedTowns = COUNTY_TOWNS[county];
    const towns = item?.towns ?? [];
    if (!allowedTowns || !Array.isArray(towns) || towns.length > allowedTowns.length || towns.some((town) => !allowedTowns.includes(normalized(town)))) {
      const error = new Error("Choose valid towns for each county. Leave towns empty for county-wide service.");
      error.statusCode = 400;
      throw error;
    }
    return { county, towns: [...new Set(towns.map(normalized))] };
  });
  if (new Set(areas.map((area) => area.county)).size !== areas.length) {
    const error = new Error("Each county may be selected once.");
    error.statusCode = 400;
    throw error;
  }
  return areas;
};

const isWithinServiceAreas = (areas = [], county, town) => {
  const requestedCounty = normalized(county);
  const requestedTown = normalized(town);
  if (!requestedCounty || !requestedTown) return false;
  return areas.some((area) => normalized(area.county) === requestedCounty && (!area.towns?.length || area.towns.some((serviceTown) => normalized(serviceTown) === requestedTown)));
};

const requestWithinServiceAreas = (areas = [], locations = []) => {
  if (!locations.length) return false;
  return locations.some((location) => {
    const county = normalized(location.county);
    const town = normalized(location.town);
    if (!county && !town) return false;
    return areas.some((area) => {
      if (county && normalized(area.county) !== county) return false;
      if (!town) return Boolean(county);
      if (!area.towns?.length) return Boolean(county);
      return area.towns.some((serviceTown) => normalized(serviceTown) === town);
    });
  });
};

module.exports = { normalizeServiceAreas, isWithinServiceAreas, requestWithinServiceAreas };
