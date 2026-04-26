import { FiHome } from "react-icons/fi";
import CompactListingCard from "./CompactListing";

const ListingsGrid = ({ loading, listings, clearFilters, hasActiveFilters }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="aspect-[4/3] rounded-xl bg-gray-200" />
            <div className="mt-2 space-y-1">
              <div className="h-3 w-2/3 rounded bg-gray-200" />
              <div className="h-3 w-3/4 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!listings.length) {
    return (
      <div className="rounded-2xl border border-[#A8D8C1] bg-white p-10 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F0F7F4]">
          <FiHome className="text-2xl text-[#A8D8C1]" />
        </div>

        <h2 className="text-lg font-bold text-[#013E43]">No listings found</h2>
        <p className="mt-2 text-sm text-[#065A57]">
          Try changing your filters.
        </p>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="mt-4 rounded-lg bg-[#02BB31] px-4 py-2 text-sm font-medium text-white"
          >
            Clear Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
      {listings.map((listing) => (
        <CompactListingCard key={listing._id} listing={listing} />
      ))}
    </div>
  );
};

export default ListingsGrid;