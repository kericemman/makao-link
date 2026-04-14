import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getPublicListings } from "../../../services/listings.service";
import { 
  FiSearch, 
  FiFilter, 
  FiMapPin, 
  FiDollarSign,
  FiHome,
  FiSliders,
  FiRefreshCw,
  FiX,
  FiHeart,
  FiCamera,
  FiStar,
  FiUser,
  FiArrowRight,
  FiChevronDown,
  FiEye,
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi";
import { FaBath, FaBed, FaBuilding } from "react-icons/fa";
import toast from "react-hot-toast";

const propertyTypes = [
  { value: "All", label: "All Properties", icon: FiHome },
  { value: "apartment", label: "Apartments", icon: FaBuilding },
  { value: "bedsitter", label: "Bedsitters", icon: FiHome },
  { value: "maisonette", label: "Maisonettes", icon: FaBuilding },
  { value: "studio", label: "Studios", icon: FiHome },
  { value: "bungalow", label: "Bungalows", icon: FaBuilding },
  { value: "townhouse", label: "Townhouses", icon: FaBuilding },
  { value: "other", label: "Other", icon: FiHome }
];

// Helper function to get image URL
const getImageUrl = (image) => {
  if (!image) return null;
  if (typeof image === 'object' && image.url) return image.url;
  if (typeof image === 'string') return image;
  return null;
};

// Listing Card Component - Entire card is clickable
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

  return (
    <Link
      to={`/properties/${listing._id}`}
      className="group relative block overflow-hidden rounded-2xl bg-white shadow-lg border border-[#A8D8C1] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <div className="relative h-48 sm:h-52 md:h-56 overflow-hidden bg-gradient-to-r from-[#013E43] to-[#005C57]">
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
            <p className="text-sm sm:text-base md:text-lg font-bold text-white">{formatPrice(listing.price)}</p>
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
      <div className="p-4 sm:p-5">
        <div className="mb-2 sm:mb-3">
          <h3 className="text-base sm:text-lg font-bold text-[#013E43] line-clamp-1 group-hover:text-[#02BB31] transition-colors">
            {listing.title}
          </h3>
          <p className="mt-1 flex items-center text-xs sm:text-sm text-[#065A57]">
            <FiMapPin className="mr-1 flex-shrink-0 text-[#02BB31]" />
            <span className="line-clamp-1">{listing.location}</span>
          </p>
        </div>

        <div className="mb-3 sm:mb-4 flex flex-wrap gap-1.5 sm:gap-2">
          <span className="flex items-center gap-1 rounded-full bg-[#F0F7F4] px-2 sm:px-3 py-1 text-xs text-[#065A57]">
            <FaBuilding className="text-[#02BB31] text-xs" />
            {listing.type || "Apartment"}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-[#F0F7F4] px-2 sm:px-3 py-1 text-xs text-[#065A57]">
            <FaBed className="text-[#02BB31] text-xs" />
            {listing.bedrooms || 0} {listing.bedrooms === 1 ? "bed" : "beds"}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-[#F0F7F4] px-2 sm:px-3 py-1 text-xs text-[#065A57]">
            <FaBath className="text-[#02BB31] text-xs" />
            {listing.bathrooms || 0} {listing.bathrooms === 1 ? "bath" : "baths"}
          </span>
        </div>

        
      </div>

      
      
    </Link>
  );
};

// Category Tabs Component with smooth sliding
const CategoryTabs = ({ categories, activeCategory, onCategoryChange }) => {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    checkScrollPosition();
    const handleResize = () => checkScrollPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative">
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border border-[#A8D8C1] hover:bg-[#F0F7F4] transition-all"
        >
          <FiChevronLeft className="text-[#013E43]" />
        </button>
      )}

      <div
        ref={scrollContainerRef}
        onScroll={checkScrollPosition}
        className="flex overflow-x-auto scrollbar-hide gap-3 pb-4 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.value;
          return (
            <button
              key={category.value}
              onClick={() => onCategoryChange(category.value)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-medium whitespace-nowrap transition-all text-sm sm:text-base ${
                isActive
                  ? "bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white shadow-md"
                  : "bg-white text-[#065A57] border border-[#A8D8C1] hover:bg-[#F0F7F4]"
              }`}
            >
              <Icon className="text-sm sm:text-base" />
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>

      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border border-[#A8D8C1] hover:bg-[#F0F7F4] transition-all"
        >
          <FiChevronRight className="text-[#013E43]" />
        </button>
      )}
    </div>
  );
};

const ListingsPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedType = searchParams.get("type") || "All";
  const locationParam = searchParams.get("location") || "";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";
  const bedroomsParam = searchParams.get("bedrooms") || "";

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState({
    location: locationParam,
    minPrice: minPriceParam,
    maxPrice: maxPriceParam,
    bedrooms: bedroomsParam,
    type: selectedType !== "All" ? selectedType : ""
  });

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.location) params.location = filters.location;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.bedrooms) params.bedrooms = filters.bedrooms;
      const data = await getPublicListings(params);
      setListings(data.listings || []);
    } catch (error) {
      toast.error("Failed to load listings", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [searchParams]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.location) params.set("location", filters.location);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.bedrooms) params.set("bedrooms", filters.bedrooms);
    if (filters.type) params.set("type", filters.type);
    setSearchParams(params);
    setShowMobileFilters(false);
  };

  const handleTypeChange = (type) => {
    setFilters(prev => ({ ...prev, type: type === "All" ? "" : type }));
    if (type === "All") {
      const params = new URLSearchParams(searchParams);
      params.delete("type");
      setSearchParams(params);
    } else {
      setSearchParams({ ...Object.fromEntries(searchParams), type });
    }
  };

  const handleReset = () => {
    setFilters({
      location: "",
      minPrice: "",
      maxPrice: "",
      bedrooms: "",
      type: ""
    });
    setSearchParams({});
    setShowMobileFilters(false);
  };

  const hasActiveFilters = () => {
    return filters.location || filters.minPrice || filters.maxPrice || filters.bedrooms || filters.type;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.location) count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.bedrooms) count++;
    if (filters.type) count++;
    return count;
  };

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Tabs */}
        <div className="mb-8">
          <CategoryTabs 
            categories={propertyTypes}
            activeCategory={filters.type || "All"}
            onCategoryChange={handleTypeChange}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block h-fit">
            <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#013E43] flex items-center">
                  <FiSliders className="mr-2 text-[#02BB31]" />
                  Filters
                </h2>
                {hasActiveFilters() && (
                  <button
                    onClick={handleReset}
                    className="text-sm text-[#02BB31] hover:text-[#0D915C] flex items-center"
                  >
                    <FiRefreshCw className="mr-1 text-sm" />
                    Reset all
                  </button>
                )}
              </div>

              <form onSubmit={handleFilterSubmit} className="space-y-5">
                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                    <input
                      type="text"
                      name="location"
                      placeholder="Enter city or area"
                      value={filters.location}
                      onChange={handleFilterChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-2">
                    Price Range (KES)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                      <input
                        type="number"
                        name="minPrice"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={handleFilterChange}
                        className="w-full pl-10 pr-3 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                      <input
                        type="number"
                        name="maxPrice"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={handleFilterChange}
                        className="w-full pl-10 pr-3 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-2">
                    Bedrooms
                  </label>
                  <div className="relative">
                    <FaBed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                    <select
                      name="bedrooms"
                      value={filters.bedrooms}
                      onChange={handleFilterChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors appearance-none bg-white"
                    >
                      <option value="">Any</option>
                      <option value="0">Studio / 0</option>
                      <option value="1">1 bedroom</option>
                      <option value="2">2 bedrooms</option>
                      <option value="3">3 bedrooms</option>
                      <option value="4">4+ bedrooms</option>
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#065A57]" />
                  </div>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-2">
                    Property Type
                  </label>
                  <div className="relative">
                    <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                    <select
                      name="type"
                      value={filters.type}
                      onChange={handleFilterChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors appearance-none bg-white"
                    >
                      <option value="">All Types</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Bedsitter">Bedsitter</option>
                      <option value="Maisonette">Maisonette</option>
                      <option value="Studio">Studio</option>
                      <option value="Bungalow">Bungalow</option>
                      <option value="Townhouse">Townhouse</option>
                      <option value="Other">Other</option>
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#065A57]" />
                  </div>
                </div>

                {/* Active Filters Summary */}
                {hasActiveFilters() && (
                  <div className="pt-2">
                    <p className="text-xs text-[#065A57] mb-2">Active filters:</p>
                    <div className="flex flex-wrap gap-2">
                      {filters.location && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#F0F7F4] text-xs text-[#013E43] rounded-full">
                          {filters.location}
                          <button
                            type="button"
                            onClick={() => setFilters(prev => ({ ...prev, location: "" }))}
                            className="hover:text-red-500"
                          >
                            <FiX size={12} />
                          </button>
                        </span>
                      )}
                      {filters.minPrice && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#F0F7F4] text-xs text-[#013E43] rounded-full">
                          ≥ KES {parseInt(filters.minPrice).toLocaleString()}
                          <button
                            type="button"
                            onClick={() => setFilters(prev => ({ ...prev, minPrice: "" }))}
                            className="hover:text-red-500"
                          >
                            <FiX size={12} />
                          </button>
                        </span>
                      )}
                      {filters.maxPrice && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#F0F7F4] text-xs text-[#013E43] rounded-full">
                          ≤ KES {parseInt(filters.maxPrice).toLocaleString()}
                          <button
                            type="button"
                            onClick={() => setFilters(prev => ({ ...prev, maxPrice: "" }))}
                            className="hover:text-red-500"
                          >
                            <FiX size={12} />
                          </button>
                        </span>
                      )}
                      {filters.bedrooms && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#F0F7F4] text-xs text-[#013E43] rounded-full">
                          {filters.bedrooms === "0" ? "Studio" : `${filters.bedrooms} bed${filters.bedrooms > 1 ? 's' : ''}`}
                          <button
                            type="button"
                            onClick={() => setFilters(prev => ({ ...prev, bedrooms: "" }))}
                            className="hover:text-red-500"
                          >
                            <FiX size={12} />
                          </button>
                        </span>
                      )}
                      {filters.type && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#F0F7F4] text-xs text-[#013E43] rounded-full">
                          {filters.type}
                          <button
                            type="button"
                            onClick={() => setFilters(prev => ({ ...prev, type: "" }))}
                            className="hover:text-red-500"
                          >
                            <FiX size={12} />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <FiSearch className="text-lg" />
                    Apply Filters
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-3 border-2 border-[#A8D8C1] text-[#065A57] rounded-lg font-medium hover:bg-[#F0F7F4] transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </aside>

          {/* Main Content */}
          <section>
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="w-full py-3 bg-white border border-[#A8D8C1] rounded-xl flex items-center justify-center gap-2 text-[#013E43] font-medium shadow-sm"
              >
                <FiFilter />
                Filters
                {hasActiveFilters() && (
                  <span className="ml-1 px-2 py-0.5 bg-[#02BB31] text-white text-xs rounded-full">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>
            </div>

            {/* Results Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-sm text-[#065A57]">
                  <span className="font-semibold text-[#013E43]">{listings.length}</span> properties found
                  {hasActiveFilters() && " with active filters"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#065A57]">Sort by:</span>
                <select className="px-3 py-2 border border-[#A8D8C1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#02BB31] bg-white">
                  <option>Newest First</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Most Viewed</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
                  <p className="text-[#065A57]">Loading listings...</p>
                </div>
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-[#A8D8C1]">
                <div className="w-24 h-24 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiHome className="text-4xl text-[#A8D8C1]" />
                </div>
                <h2 className="text-xl font-bold text-[#013E43] mb-3">No listings found</h2>
                <p className="text-[#065A57] mb-6">
                  {hasActiveFilters() 
                    ? "Try adjusting your filters to see more properties."
                    : "No properties are currently available."}
                </p>
                {hasActiveFilters() && (
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    <FiRefreshCw />
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                {listings.map((listing) => (
                  <ListingCard key={listing._id} listing={listing} />
                ))}
              </div>
            )}

            {/* Load More Button */}
            {listings.length > 0 && listings.length >= 12 && (
              <div className="mt-12 text-center">
                <button className="px-8 py-3 bg-white text-[#013E43] border-2 border-[#A8D8C1] rounded-lg font-semibold hover:bg-[#F0F7F4] transition-colors inline-flex items-center gap-2">
                  Load More Properties
                  <FiArrowRight />
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="fixed inset-x-0 bottom-0 top-auto max-h-[90vh] bg-white rounded-t-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#A8D8C1] p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#013E43] flex items-center">
                <FiSliders className="mr-2" />
                Filters
              </h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-[#F0F7F4] rounded-lg"
              >
                <FiX className="text-xl text-[#065A57]" />
              </button>
            </div>

            <div className="p-4">
              <form onSubmit={handleFilterSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-2">Location</label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                    <input
                      type="text"
                      name="location"
                      placeholder="Enter city or area"
                      value={filters.location}
                      onChange={handleFilterChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-2">Price Range (KES)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                      <input
                        type="number"
                        name="minPrice"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={handleFilterChange}
                        className="w-full pl-10 pr-3 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                      <input
                        type="number"
                        name="maxPrice"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={handleFilterChange}
                        className="w-full pl-10 pr-3 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-2">Bedrooms</label>
                  <div className="relative">
                    <FaBed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                    <select
                      name="bedrooms"
                      value={filters.bedrooms}
                      onChange={handleFilterChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors appearance-none bg-white"
                    >
                      <option value="">Any</option>
                      <option value="0">Studio / 0</option>
                      <option value="1">1 bedroom</option>
                      <option value="2">2 bedrooms</option>
                      <option value="3">3 bedrooms</option>
                      <option value="4">4+ bedrooms</option>
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#065A57]" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-2">Property Type</label>
                  <div className="relative">
                    <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                    <select
                      name="type"
                      value={filters.type}
                      onChange={handleFilterChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors appearance-none bg-white"
                    >
                      <option value="">All Types</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Bedsitter">Bedsitter</option>
                      <option value="Maisonette">Maisonette</option>
                      <option value="Studio">Studio</option>
                      <option value="Bungalow">Bungalow</option>
                      <option value="Townhouse">Townhouse</option>
                      <option value="Other">Other</option>
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#065A57]" />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                  >
                    <FiSearch />
                    Apply Filters
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-3 border-2 border-[#A8D8C1] text-[#065A57] rounded-lg font-medium"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Hide scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default ListingsPage;