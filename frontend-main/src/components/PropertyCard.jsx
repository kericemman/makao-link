import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiCheckCircle, FiHeart, FiHome, FiImage, FiMapPin, FiXCircle } from "react-icons/fi";
import { FaBath, FaBed, FaRulerCombined } from "react-icons/fa";
import { joinPortalUrl, mainRoutes, portalLinks } from "../config/portals";
import { useSavedHomes } from "../context/SavedHomesContext";

const formatPrice = (price, purpose) => {
  const amount = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0
  }).format(Number(price || 0));

  if (purpose === "short_stay") return `${amount}/night`;
  return purpose === "rent" ? `${amount}/mo` : amount;
};

const imageFor = (listing) => {
  const first = listing?.images?.[0];
  if (!first) return null;
  if (typeof first === "string") return first;
  return first.url || first.path || null;
};

export default function PropertyCard({ listing }) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const { user, savedIds, loading, toggleSaved } = useSavedHomes();
  const saved = savedIds.has(String(listing._id));
  const image = imageFor(listing);
  const location = [listing.town, listing.county].filter(Boolean).join(", ") || listing.location || "Location on request";
  const isAvailable = !listing.availability || listing.availability === "available";
  const detailsUrl = mainRoutes.listingDetails(listing._id);
  const AvailabilityIcon = isAvailable ? FiCheckCircle : FiXCircle;
  const cardFeatures = [
    Number(listing.availableUnits) > 0 && Number(listing.totalUnits) > 1
      ? { key: "units", icon: FiHome, value: `${listing.availableUnits}/${listing.totalUnits}`, label: `${listing.availableUnits} of ${listing.totalUnits} units available` }
      : null,
    listing.bedrooms !== null && listing.bedrooms !== undefined
      ? { key: "bedrooms", icon: FaBed, value: listing.bedrooms, label: `${listing.bedrooms} bedrooms` }
      : null,
    listing.bathrooms !== null && listing.bathrooms !== undefined
      ? { key: "bathrooms", icon: FaBath, value: listing.bathrooms, label: `${listing.bathrooms} bathrooms` }
      : null,
    listing.size
      ? { key: "size", icon: FaRulerCombined, value: `${listing.size} ${listing.sizeUnit || ""}`.trim(), label: `Size ${listing.size} ${listing.sizeUnit || ""}`.trim() }
      : null
  ].filter(Boolean);

  const handleSave = async () => {
    setSaveError("");
    if (!user) {
      const next = `/saved?saveListing=${encodeURIComponent(listing._id)}`;
      const loginUrl = `${joinPortalUrl(portalLinks.user.href, "/login")}?next=${encodeURIComponent(next)}`;
      window.location.assign(loginUrl);
      return;
    }

    setSaving(true);
    try {
      await toggleSaved(listing._id);
    } catch {
      setSaveError("Could not save home. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-[#A8D8C1] bg-[#FFFFFF] shadow-[0_18px_45px_rgba(22,33,31,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#02BB31] hover:shadow-[0_24px_60px_rgba(22,33,31,0.12)]"
    >
      <div className="relative aspect-[1.1] bg-[#F0F7F4] sm:aspect-[1.35]">
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
        <div className="absolute left-2 top-2 flex max-w-[calc(100%-3rem)] flex-wrap gap-1 sm:left-4 sm:top-4 sm:gap-2">
          <span className="rounded-full bg-[#FFFFFF]/95 px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#013E43] sm:px-3 sm:text-xs sm:tracking-[0.12em]">
            {listing.purpose === "short_stay" ? "Short-term stay" : listing.purpose || "rent"}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold sm:px-3 sm:text-xs ${isAvailable ? "bg-[#E4F4E7] text-[#1F7A31]" : "bg-[#F8E5DE] text-[#B42318]"}`}>
            <AvailabilityIcon aria-hidden="true" className="text-[11px]" />
            {isAvailable ? "Available" : "Not available"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || saving}
          aria-pressed={saved}
          aria-label={saved ? "Remove saved listing" : "Save listing"}
          title={saved ? "Remove from saved homes" : "Save to your account"}
          className={`absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border backdrop-blur transition disabled:cursor-wait disabled:opacity-60 sm:right-4 sm:top-4 sm:h-10 sm:w-10 ${
            saved
              ? "border-[#02BB31] bg-[#02BB31] text-white"
              : "border-white/70 bg-white/95 text-[#013E43] hover:border-[#02BB31] hover:text-[#02BB31]"
          }`}
        >
          <FiHeart className={saved ? "fill-current" : ""} />
        </button>
        {saveError ? <span role="status" className="absolute right-2 top-12 rounded bg-white px-2 py-1 text-[10px] font-semibold text-red-700 shadow sm:right-4 sm:top-16">{saveError}</span> : null}
      </div>

      <div className="flex min-h-[112px] flex-1 flex-col p-3 sm:min-h-[144px] sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="truncate whitespace-nowrap text-xs font-extrabold tracking-tight text-[#013E43] sm:text-xl">
              {formatPrice(listing.price, listing.purpose)}
            </p>
            <Link to={detailsUrl} title={listing.title} className="mt-1 block h-4 truncate text-xs font-bold leading-4 text-[#013E43] hover:text-[#0D915C] sm:h-6 sm:text-base sm:leading-6">
              {listing.title}
            </Link>
          </div>
          <Link to={detailsUrl} aria-label={`View ${listing.title}`} className="mt-1 hidden h-9 w-9 shrink-0 place-items-center rounded-full border border-[#A8D8C1] text-[#013E43] transition group-hover:border-[#013E43] group-hover:bg-[#013E43] group-hover:text-white sm:grid">
            <FiArrowUpRight />
          </Link>
        </div>

        <div className="mt-1 flex h-4 min-w-0 flex-nowrap items-center gap-3 overflow-hidden whitespace-nowrap text-[10px] font-semibold text-[#065A57] sm:h-5 sm:gap-4 sm:text-xs">
          {cardFeatures.map(({ key, icon: Icon, value, label }, index) => (
            <span
              key={key}
              title={label}
              aria-label={label}
              className={`inline-flex shrink-0 items-center gap-1 ${index > 1 ? "hidden sm:inline-flex" : ""}`}
            >
              <Icon aria-hidden="true" className="shrink-0 text-[#0D915C]" />
              <span className="truncate">{value}</span>
            </span>
          ))}
        </div>

        <p className="mt-auto flex items-center gap-1.5 pt-2 text-[11px] font-medium text-[#065A57] sm:gap-2 sm:text-sm">
          <FiMapPin className="shrink-0 text-[#02BB31]" />
          <span className="line-clamp-1">{location}</span>
        </p>

      </div>
    </article>
  );
}
