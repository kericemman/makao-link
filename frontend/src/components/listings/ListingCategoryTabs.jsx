const categories = [
  { key: "", label: "All" },
  { key: "student", label: "Students" },
  { key: "office", label: "Office Space" },
  { key: "family", label: "Family Homes" },
  { key: "luxury", label: "Luxury" }
];

const ListingCategoryTabs = ({ activeCategory, onChange }) => {
  return (
    <div className="mb-5 overflow-x-auto">
      <div className="flex gap-2 min-w-max">
        {categories.map((category) => {
          const active = activeCategory === category.key;

          return (
            <button
              key={category.key || "all"}
              onClick={() => onChange(category.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-[#013E43] text-white"
                  : "bg-white border border-[#A8D8C1] text-[#065A57]"
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