import { Link } from "react-router-dom";
import { useState } from "react";
import { FiHome, FiHeart, FiCamera, FiStar, FiMapPin } from "react-icons/fi";
import { FaBed, FaBath, FaBuilding, FaRulerCombined } from "react-icons/fa";

const getImageUrl = (image) => {
  if (!image) return null;
  if (typeof image === "string") return image;
  if (typeof image === "object" && image.url) return image.url;
  return null;
};

const prettifyLabel = (value) => {
  if (!value) return "";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const CompactListingCard = ({ listing }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  const firstImage = listing.images?.[0] ? getImageUrl(listing.images[0]) : null;
  const isOffice = listing.type === "office";
  const isSale = listing.purpose === "sale";

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0
    }).format(price || 0);

  const locationText = [listing.area, listing.town, listing.county]
    .filter(Boolean)
    .map((item) => prettifyLabel(item))
    .join(", ");

  return (
    <Link
      to={`/properties/${listing._id}`}
      className="group block overflow-hidden rounded-xl bg-white border border-[#A8D8C1] shadow-sm hover:shadow-lg transition-all"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-r from-[#013E43] to-[#005C57]">
        {firstImage ? (
          <img
            src={firstImage}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-white">
            <FiHome className="text-3xl text-white/50" />
          </div>
        )}

        <div className="absolute top-2 left-2 flex gap-1">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${
              isSale ? "bg-[#02BB31]" : "bg-[#02BB31]"
            }`}
          >
            {isSale ? "Sale" : "Rent"}
          </span>

          {listing.isFeatured && (
            <span className="flex items-center gap-0.5 rounded-full bg-yellow-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
              <FiStar className="text-[8px]" />
              Featured
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFavorite((prev) => !prev);
          }}
          className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 shadow z-10"
        >
          <FiHeart
            className={`text-sm ${
              isFavorite ? "fill-red-500 text-red-500" : "text-[#065A57]"
            }`}
          />
        </button>

        {listing.images?.length > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
            <FiCamera className="text-[10px]" />
            <span>{listing.images.length}</span>
          </div>
        )}
      </div>

      <div className="p-2">
        <div className="mb-1 flex items-start justify-between gap-1">
          <p className="flex min-w-0 flex-1 items-center truncate text-[11px] text-[#065A57]">
            <FiMapPin className="mr-0.5 shrink-0 text-[#02BB31] text-[10px]" />
            <span className="truncate">{locationText || "Location not specified"}</span>
          </p>

          <span className="shrink-0 flex items-center gap-0.5 rounded-full bg-[#F0F7F4] px-1.5 py-0.5 text-[10px] text-[#065A57]">
            <FaBuilding className="text-[#02BB31] text-[8px]" />
            {isOffice ? "Office" : prettifyLabel(listing.type || "other")}
          </span>
        </div>

        <h3 className="mb-1 line-clamp-1 text-xs font-semibold text-[#013E43] group-hover:text-[#02BB31]">
          {listing.title}
        </h3>

        <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#065A57]">
          {isOffice ? (
            <span className="flex items-center gap-0.5">
              <FaRulerCombined className="text-[#02BB31] text-[8px]" />
              {listing.size ? `${listing.size} ${listing.sizeUnit || "sqft"}` : "Size N/A"}
            </span>
          ) : (
            <>
              <span className="flex items-center gap-0.5">
                <FaBed className="text-[#02BB31] text-[8px]" />
                {listing.bedrooms ?? 0}
              </span>
              <span className="flex items-center gap-0.5">
                <FaBath className="text-[#02BB31] text-[8px]" />
                {listing.bathrooms ?? 0}
              </span>
            </>
          )}
        </div>

        <div className="mt-1">
          <span className="text-xs font-bold text-[#02BB31]">
            {formatPrice(listing.price)}
          </span>
          <span className="ml-1 text-[10px] text-[#065A57]">
            {isSale ? "/total" : "/month"}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CompactListingCard;