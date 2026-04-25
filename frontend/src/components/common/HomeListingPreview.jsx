import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublicListings } from "../../services/listings.service";
import {
  FiHome,
  FiTrendingUp,
  FiArrowRight,
  FiHeart,
  FiCamera,
  FiStar,
  FiMapPin
} from "react-icons/fi";
import { FaBed, FaBath, FaBuilding, FaRulerCombined } from "react-icons/fa";
import toast from "react-hot-toast";

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

const ListingPreviewCard = ({ listing }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const firstImage = listing.images?.[0] ? getImageUrl(listing.images[0]) : null;
  const isOffice = listing.type === "office";

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0
    }).format(price);
  };

  const locationText = [listing.town, listing.area, listing.county]
    .filter(Boolean)
    .map((item) => prettifyLabel(item))
    .join(", ");

  return (
    <Link
      to={`/properties/${listing._id}`}
      className="group relative block rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl">
        {firstImage ? (
          <img
            src={firstImage}
            alt={listing.title}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isHovered ? "scale-110" : "scale-100"
            }`}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentElement.classList.add("flex", "items-center", "justify-center");
            }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-white">
            <FiHome className="text-3xl text-white/50" />
          </div>
        )}

        {listing.isFeatured && (
          <div className="absolute top-2 left-2">
            <span className="flex items-center gap-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-lg">
              <FiStar className="text-[8px]" />
              Featured
            </span>
          </div>
        )}

        
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 shadow-lg backdrop-blur-sm transition-all hover:scale-110 z-10"
        >
          <FiHeart
            className={`text-sm transition-colors ${
              isFavorite ? "fill-red-500 text-red-500" : "text-[#065A57]"
            }`}
          />
        </button>

        <div className="absolute bottom-2 left-2">
          <div className="rounded-lg bg-[#013E43]/90 px-2 py-0.5 backdrop-blur-sm">
            <p className="text-xs font-bold text-white">{formatPrice(listing.price)}</p>
          </div>
        </div>

        {listing.images?.length > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
            <FiCamera className="text-[10px]" />
            <span>{listing.images.length}</span>
          </div>
        )}
      </div>

      <div className="p-2">
        <div className="flex items-start justify-between gap-1 mb-0.5">
          <p className="text-xs text-[#065A57] flex items-center truncate flex-1">
            <FiMapPin className="mr-0.5 flex-shrink-0 text-[#02BB31] text-[10px]" />
            <span className="truncate">{locationText || "Location not specified"}</span>
          </p>

          <span className="flex items-center gap-0.5 rounded-full bg-[#F0F7F4] px-1.5 py-0.5 text-[10px] text-[#065A57] whitespace-nowrap">
            <FaBuilding className="text-[#02BB31] text-[8px]" />
            {listing.type === "office" ? "Office" : prettifyLabel(listing.type || "other")}
          </span>
        </div>

        <h3 className="text-xs font-semibold text-[#013E43] line-clamp-1 group-hover:text-[#02BB31] transition-colors mb-0.5">
          {listing.title}
        </h3>

        <div className="flex items-center gap-2 text-[10px] text-[#065A57] flex-wrap">
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
          <span className="text-[#02BB31] font-bold text-xs">
            {formatPrice(listing.price)}
          </span>
          <span className="ml-1 text-[#065A57] text-[10px]">
            {listing.purpose === "sale" ? "/total" : "/month"}
          </span>
        </div>
      </div>
    </Link>
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
      const data = await getPublicListings({ limit: 8, page: 1 });
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
      <section className="py-6 bg-white">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 rounded-xl"></div>
                <div className="mt-2 space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
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
      <section className="py-6 bg-white">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-[#A8D8C1]">
            <div className="w-16 h-16 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-3">
              <FiHome className="text-2xl text-[#A8D8C1]" />
            </div>
            <h3 className="text-base font-semibold text-[#013E43] mb-1">Unable to load listings</h3>
            <p className="text-xs text-[#065A57] mb-3">{error}</p>
            <button
              onClick={fetchPreviewListings}
              className="px-4 py-1.5 text-xs bg-[#02BB31] text-white rounded-lg hover:bg-[#0D915C] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 bg-gradient-to-b from-white to-[#F0F7F4]">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#02BB31]/10 text-[#02BB31] px-2 py-0.5 rounded-full mb-2">
              <FiTrendingUp className="text-xs" />
              <span className="text-[10px] font-medium">Recently Added</span>
            </div>
            <h2 className="text-xl font-bold text-[#013E43]">Latest Listings</h2>
            <p className="mt-1 text-xs text-[#065A57] max-w-2xl hidden sm:block">
              Explore newest verified properties on RendaHomes
            </p>
          </div>

          <Link
            to="/listings"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105 group w-fit"
          >
            <span>View All Properties</span>
            <FiArrowRight className="text-xs group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-[#A8D8C1]">
            <div className="w-16 h-16 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-3">
              <FiHome className="text-2xl text-[#A8D8C1]" />
            </div>
            <h3 className="text-base font-semibold text-[#013E43] mb-1">No listings available yet</h3>
            <p className="text-xs text-[#065A57]">
              Check back soon for new properties.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {listings.map((listing) => (
              <ListingPreviewCard key={listing._id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeListingsPreview;