import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import PropertyCard from "../PropertyCard";
import { mainRoutes } from "../../config/portals";

export default function ListingSection({ title, eyebrow, listings }) {
  return (
    <section className="border-b border-[#A8D8C1] bg-[#F0F7F4]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">{eyebrow}</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#013E43]">{title}</h2>
          </div>
          <Link to={mainRoutes.listings} className="inline-flex items-center gap-2 text-sm font-extrabold text-[#013E43]">
            View all listings
            <FiArrowRight />
          </Link>
        </div>

        {listings.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <PropertyCard key={listing._id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-[#02BB31] bg-white p-10 text-center">
            <p className="text-lg font-extrabold text-[#013E43]">No listings to show yet</p>
            <p className="mt-2 text-sm text-[#065A57]">Once approved active listings are available, they will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );
}
