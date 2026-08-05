import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiHeart, FiImage, FiMapPin } from "react-icons/fi";
import { FaBath, FaBed, FaRulerCombined } from "react-icons/fa";
import { mainRoutes } from "../config/portals";
import TrustBadges from "./listings/TrustBadges";

const SAVED_KEY = "renda_saved_listings";

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

export default function PropertyCard({ listing }) {
  const [saved, setSaved] = useState(false);
  const image = imageFor(listing);
  const location = [listing.town, listing.county].filter(Boolean).join(", ") || listing.location || "Location on request";
  const isAvailable = !listing.availability || listing.availability === "available";
  const detailsUrl = mainRoutes.listingDetails(listing._id);

  useEffect(() => {
    setSaved(getSavedListings().some((item) => getSavedId(item) === listing._id));
  }, [listing._id]);

  const toggleSaved = () => {
    const savedListings = getSavedListings();
    const exists = savedListings.some((item) => getSavedId(item) === listing._id);
    const nextSaved = exists
      ? savedListings.filter((item) => getSavedId(item) !== listing._id)
      : [toSavedListing(listing), ...savedListings];

    localStorage.setItem(SAVED_KEY, JSON.stringify(nextSaved));
    setSaved(!exists);
  };

  return (
    <article
      className="group block overflow-hidden rounded-[1.35rem] border border-[#A8D8C1] bg-[#FFFFFF] shadow-[0_18px_45px_rgba(22,33,31,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#02BB31] hover:shadow-[0_24px_60px_rgba(22,33,31,0.12)]"
    >
      <div className="relative aspect-[1.35] bg-[#F0F7F4]">
        <Link to={detailsUrl} className="absolute inset-0">
        {image ? (
          <img
            src={image}
            alt={listing.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center gap-2 text-sm font-semibold text-[#065A57]">
            <FiImage />
            Image coming soon
          </div>
        )}
        </Link>
        <div className="absolute left-4 top-4 flex gap-2">
          <span className="rounded-full bg-[#FFFFFF]/95 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-[#013E43]">
            {listing.purpose || "rent"}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${isAvailable ? "bg-[#E4F4E7] text-[#1F7A31]" : "bg-[#F8E5DE] text-[#9A3B1F]"}`}>
            {listing.availability || "available"}
          </span>
        </div>
        <TrustBadges
          trust={listing.trust}
          compact
          limit={listing.trust?.landlordKycVerified ? 2 : 1}
          className="absolute bottom-4 left-4 right-4"
        />
        <button
          type="button"
          onClick={toggleSaved}
          aria-label={saved ? "Remove saved listing" : "Save listing"}
          className={`absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border backdrop-blur transition ${
            saved
              ? "border-[#02BB31] bg-[#02BB31] text-white"
              : "border-white/70 bg-white/95 text-[#013E43] hover:border-[#02BB31] hover:text-[#02BB31]"
          }`}
        >
          <FiHeart className={saved ? "fill-current" : ""} />
        </button>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xl font-extrabold tracking-tight text-[#013E43]">
              {formatPrice(listing.price, listing.purpose)}
            </p>
            <Link to={detailsUrl} className="mt-1 block line-clamp-1 text-base font-bold text-[#013E43] hover:text-[#0D915C]">
              {listing.title}
            </Link>
          </div>
          <Link to={detailsUrl} className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#A8D8C1] text-[#013E43] transition group-hover:border-[#013E43] group-hover:bg-[#013E43] group-hover:text-white">
            <FiArrowUpRight />
          </Link>
        </div>

        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-[#065A57]">
          <FiMapPin className="shrink-0 text-[#02BB31]" />
          <span className="line-clamp-1">{location}</span>
        </p>

        <TrustBadges trust={listing.trust} limit={2} className="mt-3 sm:hidden" />

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-[#065A57]">
          {listing.type ? <span className="rounded-full bg-[#F0F7F4] px-3 py-1.5">{listing.type}</span> : null}
          {listing.bedrooms !== null && listing.bedrooms !== undefined ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0F7F4] px-3 py-1.5">
              <FaBed /> {listing.bedrooms} bed
            </span>
          ) : null}
          {listing.bathrooms !== null && listing.bathrooms !== undefined ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0F7F4] px-3 py-1.5">
              <FaBath /> {listing.bathrooms} bath
            </span>
          ) : null}
          {listing.size ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0F7F4] px-3 py-1.5">
              <FaRulerCombined /> {listing.size} {listing.sizeUnit || ""}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function getSavedListings() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
  } catch {
    return [];
  }
}

function getSavedId(item) {
  return typeof item === "string" ? item : item?._id;
}

function toSavedListing(listing) {
  return {
    _id: listing._id,
    title: listing.title,
    price: listing.price,
    purpose: listing.purpose,
    type: listing.type,
    town: listing.town,
    county: listing.county,
    area: listing.area,
    location: listing.location,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    images: listing.images
  };
}
