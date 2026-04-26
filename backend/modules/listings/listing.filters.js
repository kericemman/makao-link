const buildListingFilter = (query = {}) => {
  const {
    category,
    purpose,
    type,
    county,
    town,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms
  } = query;

  const filter = {
    status: "approved",
    isActive: true,
    availability: "available"
  };

  if (purpose) filter.purpose = purpose;
  if (type) filter.type = type;
  if (county) filter.county = county;
  if (town) filter.town = town;

  if (bedrooms !== undefined && bedrooms !== "") {
    filter.bedrooms = Number(bedrooms);
  }

  if (bathrooms !== undefined && bathrooms !== "") {
    filter.bathrooms = Number(bathrooms);
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // Curated homepage categories
  if (category === "student") {
    filter.purpose = "rent";
    filter.price = { $lte: 20000 };
    filter.type = { $in: ["studio", "bedsitter", "apartment"] };
    filter.bedrooms = { $lte: 1 };
  }

  if (category === "office") {
    filter.type = "office";
  }

  if (category === "family") {
    filter.purpose = "sale";
    filter.bedrooms = { $gte: 3 };
  }

  if (category === "luxury") {
    filter.purpose = "rent";
    filter.town = { $in: ["kilimani", "karen", "lavington"] };
    filter.type = { $in: ["apartment", "maisonette", "townhouse"] };
  }

  return filter;
};

module.exports = buildListingFilter;