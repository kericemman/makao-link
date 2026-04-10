

import { Link } from "react-router-dom";
import { useState } from "react";
import { 
  FiMapPin, 
  FiEye, 
  FiHeart, 
  FiCamera,
  FiStar,
  FiArrowRight,
  FiHome,
  FiUser
} from "react-icons/fi";
import { FaBed, FaBath, FaBuilding } from "react-icons/fa";

// Helper function to get image URL
const getImageUrl = (image) => {
  if (!image) return null;
  if (typeof image === 'object' && image.url) return image.url;
  if (typeof image === 'string') return image;
  return null;
};

const ListingCard = ({ listing }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const firstImage = listing.images?.[0] ? getImageUrl(listing.images[0]) : null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const truncateText = (text, maxLength = 60) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div 
      className="group relative overflow-hidden rounded-2xl bg-white shadow-lg border border-[#A8D8C1] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <div className="relative h-56 overflow-hidden bg-gradient-to-r from-[#013E43] to-[#005C57]">
        {firstImage ? (
          <img
            src={firstImage}
            alt={listing.title}
            className={`h-full w-full object-cover transition-transform duration-500 ${
              isHovered ? "scale-110" : "scale-100"
            }`}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
            }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-white">
            <FiHome className="text-4xl text-white/50 mb-2" />
            <p className="text-sm text-white/50">No image available</p>
          </div>
        )}
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
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
          {listing.status === "approved" && (
            <span className="rounded-full bg-[#02BB31] px-2 py-1 text-xs font-medium text-white shadow-lg">
              Approved
            </span>
          )}
        </div>
        
        {/* Favorite Button */}
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
        
        {/* Price Tag */}
        <div className="absolute bottom-3 left-3">
          <div className="rounded-lg bg-[#013E43]/90 px-3 py-1.5 backdrop-blur-sm">
            <p className="text-lg font-bold text-white">{formatPrice(listing.price)}</p>
            <p className="text-xs text-[#A8D8C1]">/month</p>
          </div>
        </div>
        
        {/* Image Count Badge */}
        {listing.images?.length > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
            <FiCamera className="text-xs" />
            <span>{listing.images.length}</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Title and Location */}
        <div className="mb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold text-[#013E43] line-clamp-1 group-hover:text-[#02BB31] transition-colors flex-1">
              {listing.title}
            </h3>
            <span className="flex items-center gap-1 rounded-full bg-[#F0F7F4] px-2 py-1 text-xs text-[#065A57] whitespace-nowrap">
              <FaBuilding className="text-[#02BB31] text-xs" />
              {listing.type || "Apartment"}
            </span>
          </div>
          <p className="mt-2 flex items-center text-sm text-[#065A57]">
            <FiMapPin className="mr-1 flex-shrink-0 text-[#02BB31]" />
            <span className="line-clamp-1">{listing.location}</span>
          </p>
        </div>

        {/* Description Preview */}
        {listing.description && (
          <p className="mb-3 text-sm text-[#065A57] line-clamp-2">
            {truncateText(listing.description, 100)}
          </p>
        )}

        {/* Property Features */}
        <div className="mb-4 flex flex-wrap gap-3">
          <span className="flex items-center gap-1 rounded-full bg-[#F0F7F4] px-3 py-1 text-xs text-[#065A57]">
            <FaBed className="text-[#02BB31]" />
            {listing.bedrooms || 0} {listing.bedrooms === 1 ? "bed" : "beds"}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-[#F0F7F4] px-3 py-1 text-xs text-[#065A57]">
            <FaBath className="text-[#02BB31]" />
            {listing.bathrooms || 0} {listing.bathrooms === 1 ? "bath" : "baths"}
          </span>
        </div>

        {/* Landlord Info (if available) */}
        {listing.landlord && (
          <div className="mb-4 flex items-center gap-2 border-t border-[#A8D8C1] pt-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-[#013E43] to-[#005C57]">
              <FiUser className="text-xs text-white" />
            </div>
            <span className="text-xs text-[#065A57] truncate">{listing.landlord.name}</span>
          </div>
        )}

        {/* Action Button */}
        <Link
          to={`/properties/${listing._id}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#013E43] to-[#005C57] px-4 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg hover:scale-[1.02] group/btn"
        >
          <span>View Details</span>
          <FiArrowRight className="transition-transform group-hover/btn:translate-x-1" />
        </Link>
      </div>

      {/* Hover Tooltip - Quick View */}
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
    </div>
  );
};

export default ListingCard;