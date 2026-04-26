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
    bathrooms,
    minSize,
    maxSize
  } = query;

  const filter = {
    status: "approved",
    isActive: true,
    availability: "available"
  };

  if (purpose) filter.purpose = purpose;
  if (type) filter.type = type === "office-space" ? "office" : type;
  if (county) filter.county = county;
  if (town) filter.town = town;

  if (bedrooms !== undefined && bedrooms !== "") {
    filter.bedrooms = { $gte: Number(bedrooms) };
  }

  if (bathrooms !== undefined && bathrooms !== "") {
    filter.bathrooms = { $gte: Number(bathrooms) };
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (minSize || maxSize) {
    filter.size = {};
    if (minSize) filter.size.$gte = Number(minSize);
    if (maxSize) filter.size.$lte = Number(maxSize);
  }

  // Curated categories
  if (category === "student") {
    filter.purpose = "rent";
    filter.price = { $lte: 20000 };
    filter.type = { $in: ["studio", "bedsitter", "apartment"] };
    filter.bedrooms = { $lte: 1 };
  }

  if (category === "office" || category === "office-space") {
    filter.type = "office";
  }

  if (category === "family") {
    filter.purpose = "sale";
    filter.bedrooms = { $gte: 3 };
  }

  if (category === "luxury") {
    filter.purpose = "rent";
    filter.town = { $in: ["kilimani", "karen", "lavington"] };
    filter.type = { $in: ["apartment", "maisonette", "townhouse", "villa"] };
  }

  // Direct property category filters
  if (category === "maisonette") {
    filter.type = "maisonette";
  }

  if (category === "bungalow") {
    filter.type = "bungalow";
  }

  if (category === "villa") {
    filter.type = "villa";
  }

  if (category === "studio") {
    filter.type = "studio";
  }

  if (category === "townhouse") {
    filter.type = "townhouse";
  }

  return filter;
};

module.exports = buildListingFilter;