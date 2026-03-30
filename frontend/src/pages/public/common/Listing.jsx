import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getPublicListings } from "../../../services/listings.service";
import ListingCard from "../../../components/common/ListingCard";
import { 
  FiSearch, 
  FiFilter, 
  FiMapPin, 
  FiDollarSign,
  FiHome,
  FiSliders,
  FiRefreshCw,
  FiX,
  FiArrowRight,
  FiChevronDown
} from "react-icons/fi";
import { FaBed, FaBuilding } from "react-icons/fa";
import toast from "react-hot-toast";

const ListingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [filters, setFilters] = useState({
    location: searchParams.get("location") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    bedrooms: searchParams.get("bedrooms") || "",
    type: searchParams.get("type") || ""
  });

  const fetchListings = async () => {
    try {
      setLoading(true);

      const params = {
        location: searchParams.get("location") || "",
        minPrice: searchParams.get("minPrice") || "",
        maxPrice: searchParams.get("maxPrice") || "",
        bedrooms: searchParams.get("bedrooms") || "",
        type: searchParams.get("type") || ""
      };

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

  const handleChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    setSearchParams(params);
    setShowMobileFilters(false);
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
    return Object.values(filters).some(value => value !== "");
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== "").length;
  };

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#013E43] to-[#005C57] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find Your Perfect Home
            </h1>
            <p className="text-lg text-[#A8D8C1]">
              Browse verified rental properties across Kenya. Connect directly with landlords.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                      onChange={handleChange}
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
                        onChange={handleChange}
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
                        onChange={handleChange}
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
                      onChange={handleChange}
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
                      onChange={handleChange}
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
            {/* Mobile Filter Button & Results Header */}
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
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                {/* Same filter fields as desktop */}
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-2">Location</label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                    <input
                      type="text"
                      name="location"
                      placeholder="Enter city or area"
                      value={filters.location}
                      onChange={handleChange}
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
                        onChange={handleChange}
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
                        onChange={handleChange}
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
                      onChange={handleChange}
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
                      onChange={handleChange}
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
    </div>
  );
};

export default ListingsPage;