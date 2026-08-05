import { useRef } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiChevronLeft, FiChevronRight, FiImage, FiMapPin } from "react-icons/fi";
import { FaBath, FaBed } from "react-icons/fa";
import { mainRoutes } from "../../config/portals";

const formatPrice = (price, purpose) => {
  const amount = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0
  }).format(Number(price || 0));

  return purpose === "rent" ? `${amount}/mo` : amount;
};

const imageFor = (listing) => {
  const first = listing?.images?.[0];
  if (!first) return null;
  if (typeof first === "string") return first;
  return first.url || first.path || null;
};

export default function HeroListingShowcase({ listings = [] }) {
  const railRef = useRef(null);
  const displayListings = listings.slice(0, 8);
  const mainListing = displayListings[0];
  const railListings = displayListings.slice(1);

  const scrollRail = (direction) => {
    railRef.current?.scrollBy({ left: direction * 300, behavior: "smooth" });
  };

  return (
    <div className="min-w-0 rounded-[1.75rem] border border-[#A8D8C1] bg-white p-3 shadow-[0_28px_80px_rgba(1,62,67,0.16)] sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#02BB31]">Recently listed</p>
          <p className="mt-1 text-sm font-semibold text-[#065A57]">Fresh homes from the listings API</p>
        </div>
        <Link to={mainRoutes.listings} className="inline-flex items-center gap-1 text-sm font-extrabold text-[#013E43]">
          View all <FiArrowRight />
        </Link>
      </div>

      {mainListing ? <FeaturedHeroCard listing={mainListing} /> : <EmptyFeaturedCard />}

      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm font-extrabold text-[#013E43]">More new listings</p>
        {railListings.length ? (
          <div className="hidden gap-1 sm:flex">
            <button
              type="button"
              onClick={() => scrollRail(-1)}
              className="grid h-8 w-8 place-items-center rounded-full text-[#065A57] transition hover:bg-[#F0F7F4] hover:text-[#013E43]"
              aria-label="Scroll listings left"
            >
              <FiChevronLeft />
            </button>
            <button
              type="button"
              onClick={() => scrollRail(1)}
              className="grid h-8 w-8 place-items-center rounded-full text-[#065A57] transition hover:bg-[#F0F7F4] hover:text-[#013E43]"
              aria-label="Scroll listings right"
            >
              <FiChevronRight />
            </button>
          </div>
        ) : null}
      </div>

      <div ref={railRef} className="hero-listing-rail mt-2 flex gap-3 overflow-x-auto scroll-smooth pb-1">
        {railListings.length ? (
          railListings.map((listing) => <MiniHeroCard key={listing._id} listing={listing} />)
        ) : (
          <>
            <EmptyMiniCard />
            <EmptyMiniCard />
          </>
        )}
      </div>
    </div>
  );
}

function FeaturedHeroCard({ listing }) {
  const image = imageFor(listing);
  const location = [listing.town, listing.county].filter(Boolean).join(", ");

  return (
    <Link
      to={mainRoutes.listingDetails(listing._id)}
      className="group relative block overflow-hidden rounded-[1.35rem] bg-[#EAF5EF]"
    >
      <div className="aspect-[16/10] max-h-[360px] min-h-[260px]">
        {image ? (
          <img src={image} alt={listing.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center gap-2 text-sm font-bold text-[#065A57]">
            <FiImage />
            Image coming soon
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#013E43]/95 via-[#013E43]/62 to-transparent p-4 pt-24 sm:p-5 sm:pt-28">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-[#013E43]">
            {listing.purpose || "rent"}
          </span>
          <span className="rounded-full bg-[#02BB31] px-3 py-1 text-xs font-extrabold text-white">
            {listing.type || "property"}
          </span>
        </div>
        <p className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          {formatPrice(listing.price, listing.purpose)}
        </p>
        <h3 className="mt-1 line-clamp-1 text-lg font-extrabold text-white">{listing.title}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-[#A8D8C1]">
          <span className="inline-flex items-center gap-1">
            <FiMapPin />
            {location || "Location on request"}
          </span>
          {listing.bedrooms !== null && listing.bedrooms !== undefined ? <span className="inline-flex items-center gap-1"><FaBed /> {listing.bedrooms}</span> : null}
          {listing.bathrooms !== null && listing.bathrooms !== undefined ? <span className="inline-flex items-center gap-1"><FaBath /> {listing.bathrooms}</span> : null}
        </div>
      </div>
    </Link>
  );
}

function MiniHeroCard({ listing }) {
  const image = imageFor(listing);

  return (
    <Link
      to={mainRoutes.listingDetails(listing._id)}
      className="group relative h-36 w-[230px] shrink-0 snap-start overflow-hidden rounded-2xl bg-[#F0F7F4]"
    >
      {image ? (
        <img src={image} alt={listing.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      ) : (
        <div className="flex h-full items-center justify-center text-[#065A57]">
          <FiImage />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#013E43]/90 to-transparent p-3 pt-12">
        <p className="truncate text-sm font-extrabold text-white">{formatPrice(listing.price, listing.purpose)}</p>
        <p className="mt-1 line-clamp-1 text-xs font-semibold text-[#A8D8C1]">
          {[listing.town, listing.county].filter(Boolean).join(", ") || "Location on request"}
        </p>
      </div>
    </Link>
  );
}

function EmptyFeaturedCard() {
  return (
    <div className="flex min-h-[300px] items-center justify-center rounded-[1.35rem] border border-dashed border-[#A8D8C1] bg-[#F0F7F4] p-8 text-center">
      <div>
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#02BB31]">
          <FiImage />
        </div>
        <p className="text-lg font-extrabold text-[#013E43]">Recent listings will appear here</p>
        {/* <p className="mt-2 text-sm leading-6 text-[#065A57]">Start the backend and approved listings will populate this showcase.</p> */}
      </div>
    </div>
  );
}

function EmptyMiniCard() {
  return <div className="h-36 w-[230px] shrink-0 snap-start rounded-2xl border border-[#A8D8C1] bg-[#F0F7F4]" />;
}
