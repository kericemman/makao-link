import { Link } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiFilter } from "react-icons/fi";
import PropertyCard from "../PropertyCard";
import { mainRoutes } from "../../config/portals";

export default function ListingResults({ listings, pagination, loading, error, page, pages, total, onPage }) {
  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 rounded-[1.25rem] border border-[#A8D8C1] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-extrabold text-[#013E43]">
          <FiFilter className="text-[#02BB31]" />
          {loading ? "Searching listings..." : `${total} available listing${total === 1 ? "" : "s"}`}
        </span>
        <Link to={mainRoutes.home} className="text-sm font-bold text-[#065A57] hover:text-[#013E43]">
          Back to home search
        </Link>
      </div>

      {error ? (
        <div className="rounded-[1.5rem] border border-red-200 bg-white p-8 text-center">
          <p className="text-lg font-extrabold text-[#013E43]">Backend request failed</p>
          <p className="mt-2 text-sm text-[#065A57]">{error}</p>
        </div>
      ) : loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-96 animate-pulse rounded-[1.35rem] border border-[#A8D8C1] bg-white" />
          ))}
        </div>
      ) : listings.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <PropertyCard key={listing._id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-[#02BB31] bg-white p-12 text-center">
          <p className="text-2xl font-extrabold text-[#013E43]">No listings match this search</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#065A57]">
            Try removing a filter, widening the budget, or searching a nearby town.
          </p>
        </div>
      )}

      {pagination && pages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => onPage(String(page - 1))}
            className="grid h-11 w-11 place-items-center rounded-full border border-[#A8D8C1] bg-white text-[#013E43] disabled:opacity-40"
          >
            <FiChevronLeft />
          </button>
          <span className="rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[#013E43]">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => onPage(String(page + 1))}
            className="grid h-11 w-11 place-items-center rounded-full border border-[#A8D8C1] bg-white text-[#013E43] disabled:opacity-40"
          >
            <FiChevronRight />
          </button>
        </div>
      ) : null}
    </section>
  );
}
