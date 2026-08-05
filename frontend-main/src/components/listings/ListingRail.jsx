import { useRef } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import PropertyCard from "../PropertyCard";

export default function ListingRail({ title, eyebrow, listings = [], viewAllTo, emptyText = "No listings available yet." }) {
  const railRef = useRef(null);

  const scrollRail = (direction) => {
    railRef.current?.scrollBy({
      left: direction * 360,
      behavior: "smooth"
    });
  };

  return (
    <section className="border-b border-[#A8D8C1] bg-[#F0F7F4]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            {eyebrow ? <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">{eyebrow}</p> : null}
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#013E43] sm:text-3xl">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollRail(-1)}
              className="hidden h-10 w-10 place-items-center rounded-full border border-[#A8D8C1] bg-white text-[#013E43] transition hover:border-[#013E43] sm:grid"
              aria-label={`Scroll ${title} left`}
            >
              <FiChevronLeft />
            </button>
            <button
              type="button"
              onClick={() => scrollRail(1)}
              className="hidden h-10 w-10 place-items-center rounded-full border border-[#A8D8C1] bg-white text-[#013E43] transition hover:border-[#013E43] sm:grid"
              aria-label={`Scroll ${title} right`}
            >
              <FiChevronRight />
            </button>
            {viewAllTo ? (
              <Link to={viewAllTo} className="inline-flex items-center gap-2 rounded-full bg-[#013E43] px-4 py-2 text-sm font-extrabold text-white">
                View
                <FiArrowRight />
              </Link>
            ) : null}
          </div>
        </div>

        {listings.length ? (
          <div ref={railRef} className="listing-rail flex gap-5 overflow-x-auto scroll-smooth pb-2">
            {listings.map((listing) => (
              <div key={listing._id} className="w-[min(86vw,360px)] shrink-0 snap-start">
                <PropertyCard listing={listing} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-[#02BB31] bg-white p-8 text-center">
            <p className="text-sm font-semibold text-[#065A57]">{emptyText}</p>
          </div>
        )}
      </div>
    </section>
  );
}
