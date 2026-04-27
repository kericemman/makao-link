const categories = [
  { key: "", label: "All" },
  { key: "student", label: "Students" },
  { key: "office-space", label: "Office Space" },
  { key: "family", label: "Family Homes" },
  { key: "luxury", label: "Luxury" },

  { key: "studio", label: "Studio" },
  
  { key: "bungalow", label: "Bungalow" },
  { key: "maisonette", label: "Maisonette" },
  { key: "townhouse", label: "Townhouse" },
  { key: "villa", label: "Villa" }
];

const ListingCategoryTabs = ({ activeCategory, onChange }) => {
  return (
    <div className="mb-5 overflow-x-auto">
      <div className="flex gap-2 min-w-max pb-2">
        {categories.map((category) => {
          const active = activeCategory === category.key;

          return (
            <button
              key={category.key || "all"}
              type="button"
              onClick={() => onChange(category.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                active
                  ? "bg-[#013E43] text-white"
                  : "bg-white border border-[#A8D8C1] text-[#065A57] hover:bg-[#F0F7F4]"
              }`}
            >
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ListingCategoryTabs;
