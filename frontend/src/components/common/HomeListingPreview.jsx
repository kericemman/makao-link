import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublicListings } from "../../services/listings.service";
import { 
  FiHome, 
  FiTrendingUp, 
  FiArrowRight,
  FiEye,
  FiHeart,
  FiCamera,
  FiStar,
  FiMapPin,
  FiUser
} from "react-icons/fi";
import { FaBed, FaBath, FaBuilding } from "react-icons/fa";
import toast from "react-hot-toast";

// Helper function to get image URL
const getImageUrl = (image) => {
  if (!image) return null;
  if (typeof image === 'object' && image.url) return image.url;
  if (typeof image === 'string') return image;
  return null;
};

// Individual Listing Card Component
const ListingPreviewCard = ({ listing }) => {
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

  const truncateText = (text, maxLength = 80) => {
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
        {/* Title and Type */}
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
            {truncateText(listing.description)}
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

const HomeListingsPreview = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPreviewListings = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getPublicListings({ limit: 6, page: 1 });
      setListings(data.listings || []);
    } catch (err) {
      setError("Failed to load listings");
      toast.error("Failed to load latest listings", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreviewListings();
  }, []);

  if (loading) {
    return (
      <section className="py-8 bg-white">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] animate-pulse">
                <div className="h-56 bg-gray-200 rounded-t-2xl"></div>
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error && listings.length === 0) {
    return (
      <section className="py-8 bg-white">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
            <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
              <FiHome className="text-3xl text-[#A8D8C1]" />
            </div>
            <h3 className="text-lg font-semibold text-[#013E43] mb-2">Unable to load listings</h3>
            <p className="text-sm text-[#065A57] mb-4">{error}</p>
            <button
              onClick={fetchPreviewListings}
              className="px-6 py-2 bg-[#02BB31] text-white rounded-lg hover:bg-[#0D915C] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-gradient-to-b from-white to-[#F0F7F4]">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#02BB31]/10 text-[#02BB31] px-3 py-1 rounded-full mb-3">
              <FiTrendingUp className="text-sm" />
              <span className="text-xs font-medium">Recently Added</span>
            </div>
            <h2 className="text-2xl font-bold text-[#013E43]">Latest Listings</h2>
            <p className="mt-2 text-[#065A57] max-w-2xl">
              Explore some of the newest verified properties currently available on RendaHomes
            </p>
          </div>

          <Link
            to="/properties"
            className="inline-flex justify-center font-light text-sm text-center gap-2 px-4 py-2 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 group"
          >
            <span>View All Listings</span>
            <FiArrowRight className="group-hover:translate-x-1 mt-1 transition-transform" />
          </Link>
        </div>

        {/* Listings Grid */}
        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-[#A8D8C1]">
            <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
              <FiHome className="text-3xl text-[#A8D8C1]" />
            </div>
            <h3 className="text-lg font-semibold text-[#013E43] mb-2">No listings available yet</h3>
            <p className="text-sm text-[#065A57]">
              Check back soon for new properties.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <ListingPreviewCard key={listing._id} listing={listing} />
            ))}
          </div>
        )}

        {/* View More Button (mobile) */}
        {listings.length > 0 && (
          <div className="mt-8 text-center md:hidden">
            <Link
              to="/properties"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#02BB31] text-[#02BB31] rounded-xl font-semibold hover:bg-[#02BB31] hover:text-white transition-all"
            >
              Browse All Properties
              <FiArrowRight />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeListingsPreview;