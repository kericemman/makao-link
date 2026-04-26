import { FiX } from "react-icons/fi";
import ListingsFilterPanel from ".//ListingFiterPanel";

const ListingsMobileFilterModal = ({
  open,
  onClose,
  meta,
  filters,
  updateFilter,
  clearFilters,
  hasActiveFilters
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 lg:hidden">
      <div className="fixed inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#013E43]">Filters</h2>

          <button onClick={onClose} className="rounded-lg p-2 hover:bg-[#F0F7F4]">
            <FiX className="text-xl text-[#065A57]" />
          </button>
        </div>

        <ListingsFilterPanel
          meta={meta}
          filters={filters}
          updateFilter={updateFilter}
          clearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#02BB31] to-[#0D915C] py-3 font-semibold text-white"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default ListingsMobileFilterModal;