const prettifyLabel = (value = "") =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const ListingsFilterPanel = ({
  meta,
  filters,
  updateFilter,
  clearFilters,
  hasActiveFilters
}) => {
  const isOfficeFilter = filters.type === "office" || filters.category === "office";
  const townOptions = meta.countyTowns?.[filters.county] || [];

  return (
    <div className="rounded-2xl border border-[#A8D8C1] bg-white p-5 shadow-lg">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#013E43]">Filters</h2>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm font-medium text-[#02BB31]"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-4">
        <select
          value={filters.purpose}
          onChange={(e) => updateFilter("purpose", e.target.value)}
          className="w-full rounded-lg border border-[#A8D8C1] px-4 py-3 bg-white"
        >
          <option value="">All Purposes</option>
          {(meta.listingPurposes || []).map((purpose) => (
            <option key={purpose} value={purpose}>
              {purpose === "rent" ? "For Rent" : "For Sale"}
            </option>
          ))}
        </select>

        <select
          value={filters.type}
          onChange={(e) => updateFilter("type", e.target.value)}
          className="w-full rounded-lg border border-[#A8D8C1] px-4 py-3 bg-white"
        >
          <option value="">All Property Types</option>
          {(meta.listingTypes || []).map((type) => (
            <option key={type} value={type}>
              {type === "office" ? "Office Space" : prettifyLabel(type)}
            </option>
          ))}
        </select>

        <select
          value={filters.county}
          onChange={(e) => updateFilter("county", e.target.value)}
          className="w-full rounded-lg border border-[#A8D8C1] px-4 py-3 bg-white"
        >
          <option value="">All Counties</option>
          {(meta.counties || []).map((county) => (
            <option key={county} value={county}>
              {prettifyLabel(county)}
            </option>
          ))}
        </select>

        <select
          value={filters.town}
          onChange={(e) => updateFilter("town", e.target.value)}
          disabled={!filters.county}
          className="w-full rounded-lg border border-[#A8D8C1] px-4 py-3 bg-white disabled:bg-gray-100"
        >
          <option value="">All Towns</option>
          {townOptions.map((town) => (
            <option key={town} value={town}>
              {prettifyLabel(town)}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            value={filters.minPrice}
            onChange={(e) => updateFilter("minPrice", e.target.value)}
            placeholder="Min price"
            className="w-full rounded-lg border border-[#A8D8C1] px-3 py-3"
          />

          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => updateFilter("maxPrice", e.target.value)}
            placeholder="Max price"
            className="w-full rounded-lg border border-[#A8D8C1] px-3 py-3"
          />
        </div>

        {!isOfficeFilter ? (
          <div className="grid grid-cols-2 gap-3">
            <select
              value={filters.bedrooms}
              onChange={(e) => updateFilter("bedrooms", e.target.value)}
              className="w-full rounded-lg border border-[#A8D8C1] px-3 py-3 bg-white"
            >
              <option value="">Beds</option>
              <option value="0">Studio</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>

            <select
              value={filters.bathrooms}
              onChange={(e) => updateFilter("bathrooms", e.target.value)}
              className="w-full rounded-lg border border-[#A8D8C1] px-3 py-3 bg-white"
            >
              <option value="">Baths</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
            </select>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={filters.minSize}
              onChange={(e) => updateFilter("minSize", e.target.value)}
              placeholder="Min sqft"
              className="w-full rounded-lg border border-[#A8D8C1] px-3 py-3"
            />

            <input
              type="number"
              value={filters.maxSize}
              onChange={(e) => updateFilter("maxSize", e.target.value)}
              placeholder="Max sqft"
              className="w-full rounded-lg border border-[#A8D8C1] px-3 py-3"
            />
          </div>
        )}

        <select
          value={filters.sort}
          onChange={(e) => updateFilter("sort", e.target.value)}
          className="w-full rounded-lg border border-[#A8D8C1] px-4 py-3 bg-white"
        >
          <option value="latest">Latest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="popular">Most Viewed</option>
        </select>
      </div>
    </div>
  );
};

export default ListingsFilterPanel;