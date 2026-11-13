import { useRef } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import PropertyCard from "../PropertyCard";

export default function ListingRail({
  title,
  eyebrow,
  listings = [],
  viewAllTo,
  emptyText = "No listings available yet.",
  gridOnMobile = false,
  loading = false,
  error = "",
  onRetry
}) {
  const railRef = useRef(null);
  const layoutClass = `listing-rail gap-3 pb-2 sm:gap-5 ${gridOnMobile ? "listing-rail--mobile-grid grid grid-cols-2 sm:flex sm:overflow-x-auto" : "flex overflow-x-auto"}`;

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
            <h2 className="mt-2 text-lg font-extrabold tracking-tight text-[#013E43] sm:text-2xl">{title}</h2>
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
              <Link to={viewAllTo} className="inline-flex items-center gap-1.5 rounded-full bg-[#013E43] px-3 py-1.5 text-xs font-medium text-white sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm">
                View more
                <FiArrowRight />
              </Link>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className={layoutClass} role="status" aria-label={`Loading ${title}`}>
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className={gridOnMobile ? "min-w-0 sm:w-[min(86vw,360px)] sm:shrink-0 sm:snap-start" : "w-[min(86vw,360px)] shrink-0 snap-start"}>
                <div className="h-full overflow-hidden rounded-[1.35rem] border border-[#A8D8C1] bg-white">
                  <div className="aspect-[1.1] animate-pulse bg-[#DCEBE3] sm:aspect-[1.35]" />
                  <div className="min-h-[112px] space-y-3 p-3 sm:min-h-[144px] sm:p-5">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-[#E7F0EB]" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-[#E7F0EB]" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-[#E7F0EB]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="flex min-h-24 flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-white p-6 text-center">
            <p className="text-sm font-semibold text-[#065A57]">{error}</p>
            {onRetry ? <button type="button" onClick={onRetry} className="text-sm font-bold text-[#0D915C] underline underline-offset-4">Try again</button> : null}
          </div>
        ) : listings.length ? (
          <div
            ref={railRef}
            className={layoutClass}
          >
            {listings.map((listing) => (
              <div key={listing._id} className={gridOnMobile ? "min-w-0 sm:w-[min(86vw,360px)] sm:shrink-0 sm:snap-start" : "w-[min(86vw,360px)] shrink-0 snap-start"}>
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
