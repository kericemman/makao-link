import { Link } from "react-router-dom";
import { useState } from "react";
import {
  FiMapPin,
  FiEye,
  FiHeart,
  FiCamera,
  FiStar,
  FiArrowRight,
  FiHome
} from "react-icons/fi";
import { FaBed, FaBath, FaBuilding, FaRulerCombined, FaTag } from "react-icons/fa";

const getImageUrl = (image) => {
  if (!image) return null;
  if (typeof image === "object" && image.url) return image.url;
  if (typeof image === "string") return image;
  return null;
};

const prettifyLabel = (value) => {
  if (!value) return "";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const ListingCard = ({ listing }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const firstImage = listing.images?.[0] ? getImageUrl(listing.images[0]) : null;

  const isOffice = listing.type === "office";
  const isSale = listing.purpose === "sale";
  const isRent = listing.purpose === "rent";

  const locationText = [
    listing.area,
    listing.town ? prettifyLabel(listing.town) : "",
    listing.county ? prettifyLabel(listing.county) : ""
  ]
    .filter(Boolean)
    .join(", ");

  const formatPrice = (price) => {
    if (!price && price !== 0) return "Price on request";

    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0
    }).format(price);
  };

  const truncateText = (text, maxLength = 95) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const getPurposeLabel = () => {
    if (isSale) return "For Sale";
    if (isRent) return "For Rent";
    return "Listing";
  };

  const getPriceSubText = () => {
    if (isSale) return "total price";
    if (isOffice && isRent) return "per month";
    if (isRent) return "per month";
    return "";
  };

  const getTypeLabel = () => {
    if (listing.type === "office") return "Office Space";
    return prettifyLabel(listing.type || "property");
  };

  return (
    <Link
      to={`/properties/${listing._id}`}
      className="group relative block overflow-hidden rounded-2xl bg-white shadow-lg border border-[#A8D8C1] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-56 overflow-hidden bg-gradient-to-r from-[#013E43] to-[#005C57]">
        {firstImage ? (
          <img
            src={firstImage}
            alt={listing.title}
            className={`h-full w-full object-cover transition-transform duration-500 ${
              isHovered ? "scale-110" : "scale-100"
            }`}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-white">
            {isOffice ? (
              <FaBuilding className="text-4xl text-white/50 mb-2" />
            ) : (
              <FiHome className="text-4xl text-white/50 mb-2" />
            )}
            <p className="text-sm text-white/50">No image available</p>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-90" />

        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-lg ${
              isSale ? "bg-[#02BB31]" : "bg-[#02BB31]"
            }`}
          >
            {getPurposeLabel()}
          </span>

          {listing.isFeatured && (
            <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 px-2 py-1 text-xs font-medium text-white shadow-lg">
              <FiStar className="text-xs" />
              Featured
            </span>
          )}

          {listing.status === "pending" && (
            <span className="rounded-full bg-yellow-500 px-2 py-1 text-xs font-medium text-white shadow-lg">
              Pending
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-3 right-3 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:scale-110 z-10"
        >
          <FiHeart
            className={`text-lg transition-colors ${
              isFavorite ? "fill-red-500 text-red-500" : "text-[#065A57]"
            }`}
          />
        </button>

        <div className="absolute bottom-3 left-3">
          <div className="rounded-xl bg-[#013E43]/90 px-3 py-2 backdrop-blur-sm">
            <p className="text-xs md:text-lg font-bold text-white">{formatPrice(listing.price)}</p>
            {getPriceSubText() ? (
              <p className="text-xs text-[#A8D8C1]">{getPriceSubText()}</p>
            ) : null}
          </div>
        </div>

        {listing.images?.length > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
            <FiCamera className="text-xs" />
            <span>{listing.images.length}</span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="mb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xs md:text-lg font-bold text-[#013E43] line-clamp-1 group-hover:text-[#02BB31] transition-colors flex-1">
              {listing.title}
            </h3>

            <span className="flex items-center gap-1 rounded-full bg-[#F0F7F4] px-2 py-1 text-xs text-[#065A57] whitespace-nowrap">
              <FaBuilding className="text-[#02BB31] text-xs" />
              {getTypeLabel()}
            </span>
          </div>

          <p className="mt-2 flex items-center text-sm text-[#065A57]">
            <FiMapPin className="mr-1 flex-shrink-0 text-[#02BB31]" />
            <span className="line-clamp-1">{locationText || "Location not provided"}</span>
          </p>
        </div>

        {/* {listing.description && (
          <p className="mb-3 text-sm text-[#065A57] line-clamp-2">
            {truncateText(listing.description)}
          </p>
        )} */}

        <div className="mb-4 flex flex-wrap gap-2">
          {isOffice ? (
            <>
              <span className="flex items-center gap-1 rounded-full bg-[#F0F7F4] px-3 py-1 text-xs text-[#065A57]">
                <FaRulerCombined className="text-[#02BB31]" />
                {listing.size ? `${listing.size} ${listing.sizeUnit || "sqft"}` : "Size not set"}
              </span>

              {listing.bathrooms !== null && listing.bathrooms !== undefined ? (
                <span className="flex items-center gap-1 rounded-full bg-[#F0F7F4] px-3 py-1 text-xs text-[#065A57]">
                  <FaBath className="text-[#02BB31]" />
                  {listing.bathrooms} {listing.bathrooms === 1 ? "bath" : "baths"}
                </span>
              ) : null}
            </>
          ) : (
            <>
              {listing.bedrooms !== null && listing.bedrooms !== undefined ? (
                <span className="flex items-center gap-1 rounded-full bg-[#F0F7F4] px-3 py-1 text-xs text-[#065A57]">
                  <FaBed className="text-[#02BB31]" />
                  {listing.bedrooms} {listing.bedrooms === 1 ? "bed" : "beds"}
                </span>
              ) : null}

              {listing.bathrooms !== null && listing.bathrooms !== undefined ? (
                <span className="flex items-center gap-1 rounded-full bg-[#F0F7F4] px-3 py-1 text-xs text-[#065A57]">
                  <FaBath className="text-[#02BB31]" />
                  {listing.bathrooms} {listing.bathrooms === 1 ? "bath" : "baths"}
                </span>
              ) : null}
            </>
          )}

          {/* {isSale ? (
            <span className="flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs text-purple-700">
              <FaTag />
              Sale Property
            </span>
          ) : null} */}
        </div>

        {/* <div className="flex items-center justify-between border-t border-[#A8D8C1]/60 pt-4">
          <span className="text-xs font-medium text-[#065A57]">
            {isOffice
              ? "Commercial space"
              : isSale
              ? "Property for sale"
              : "Rental property"}
          </span>

          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#02BB31]">
            View Details
            <FiArrowRight />
          </span>
        </div> */}
      </div>

      {isHovered && (
        <div className="absolute inset-x-0 bottom-full left-0 mb-2 hidden lg:block z-20">
          <div className="rounded-lg bg-[#013E43] p-2 text-center text-xs text-white shadow-lg">
            <p className="flex items-center justify-center gap-1">
              <FiEye className="text-[#02BB31]" />
              Click to view full details
            </p>
          </div>
        </div>
      )}
    </Link>
  );
};

export default ListingCard;