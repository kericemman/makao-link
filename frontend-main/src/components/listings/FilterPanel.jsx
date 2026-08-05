import { FiSearch, FiSliders, FiX } from "react-icons/fi";

const bedroomOptions = ["1", "2", "3", "4", "5"];
const bathroomOptions = ["1", "2", "3", "4"];

export default function FilterPanel({ filters, meta, activeFilterCount, onUpdate, onUpdateCounty, onClear }) {
  const townOptions = filters.county
    ? meta.countyTowns?.[filters.county] || []
    : Object.values(meta.countyTowns || {}).flat();

  return (
    <aside className="h-fit rounded-[1.5rem] border border-[#A8D8C1] bg-white p-5 shadow-[0_18px_45px_rgba(22,33,31,0.05)] lg:sticky lg:top-28">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#F0F7F4] text-[#013E43]">
            <FiSliders />
          </span>
          <div>
            <h2 className="font-extrabold text-[#013E43]">Filters</h2>
            <p className="text-xs font-semibold text-[#065A57]">{activeFilterCount} active</p>
          </div>
        </div>
        <button onClick={onClear} className="inline-flex items-center gap-1 text-xs font-extrabold text-[#02BB31]">
          <FiX />
          Clear
        </button>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#065A57]">Search</span>
          <span className="relative block">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#02BB31]" />
            <input
              value={filters.search}
              onChange={(event) => onUpdate("search", event.target.value)}
              placeholder="Town, county, keyword"
              className="h-12 w-full rounded-2xl border border-[#A8D8C1] bg-white pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#013E43] focus:ring-4 focus:ring-[#F0F7F4]"
            />
          </span>
        </label>

        <FilterSelect label="Purpose" value={filters.purpose} onChange={(value) => onUpdate("purpose", value)} options={[["rent", "Rent"], ["sale", "Buy"]]} />
        <FilterSelect label="Property type" value={filters.type} onChange={(value) => onUpdate("type", value)} options={(meta.listingTypes || []).map((type) => [type, type])} />
        <FilterSelect label="County" value={filters.county} onChange={onUpdateCounty} options={(meta.counties || []).map((county) => [county, county])} />
        <FilterSelect label="Town" value={filters.town} onChange={(value) => onUpdate("town", value)} options={townOptions.map((town) => [town, town])} />

        <div className="grid grid-cols-2 gap-3">
          <FilterSelect label="Beds" value={filters.bedrooms} onChange={(value) => onUpdate("bedrooms", value)} options={bedroomOptions.map((value) => [value, `${value}+`])} />
          <FilterSelect label="Baths" value={filters.bathrooms} onChange={(value) => onUpdate("bathrooms", value)} options={bathroomOptions.map((value) => [value, `${value}+`])} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FilterInput label="Min price" value={filters.minPrice} onChange={(value) => onUpdate("minPrice", value)} />
          <FilterInput label="Max price" value={filters.maxPrice} onChange={(value) => onUpdate("maxPrice", value)} />
        </div>
      </div>
    </aside>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#065A57]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-[#A8D8C1] bg-white px-3 text-sm font-bold capitalize outline-none focus:border-[#013E43] focus:ring-4 focus:ring-[#F0F7F4]"
      >
        <option value="">Any</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#065A57]">{label}</span>
      <input
        value={value}
        inputMode="numeric"
        onChange={(event) => onChange(event.target.value)}
        placeholder="KES"
        className="h-12 w-full rounded-2xl border border-[#A8D8C1] bg-white px-3 text-sm font-bold outline-none focus:border-[#013E43] focus:ring-4 focus:ring-[#F0F7F4]"
      />
    </label>
  );
}
