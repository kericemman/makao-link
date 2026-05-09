import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiFilter, FiGrid, FiList } from "react-icons/fi";
import toast from "react-hot-toast";

import { getListingMeta, getPublicListings } from "../../../services/listings.service";
import ListingCategoryTabs from "../../../components/listings/ListingCategoryTabs";
import ListingsFilterPanel from "../../../components/listings/ListingFiterPanel";
import ListingsMobileFilterModal from "../../../components/listings/ListingMobileFilterModal";
import ListingsGrid from "../../../components/listings/ListingGrid";

const categoryTitles = {
  student: "Student Friendly Homes",
  office: "Office Spaces",
  family: "Family Homes",
  luxury: "Luxury Apartments",
  bungalow: "Bungalow",
  villa: "Villa",
  studio: "Studio",
  maisonette: "Maisonette",
  townhouse: "Townhouse"
};

const ListingsPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("listingsViewMode") || "grid";
  });

  const [meta, setMeta] = useState({
    counties: [],
    countyTowns: {},
    listingTypes: [],
    listingPurposes: [],
    residentialTypes: [],
    officeSizeUnits: []
  });

  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const filters = useMemo(() => {
    return {
      category: searchParams.get("category") || "",
      purpose: searchParams.get("purpose") || "",
      type: searchParams.get("type") || "",
      county: searchParams.get("county") || "",
      town: searchParams.get("town") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      bedrooms: searchParams.get("bedrooms") || "",
      bathrooms: searchParams.get("bathrooms") || "",
      minSize: searchParams.get("minSize") || "",
      maxSize: searchParams.get("maxSize") || "",
      sort: searchParams.get("sort") || "latest",
      page: searchParams.get("page") || "1"
    };
  }, [searchParams]);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      return value && !["page", "sort"].includes(key);
    });
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      return value && !["page", "sort"].includes(key);
    }).length;
  }, [filters]);

  const pageTitle = filters.category
    ? categoryTitles[filters.category] || "Listings"
    : "Browse Listings";

  const updateFilter = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);

    if (!value) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }

    nextParams.delete("page");

    if (key !== "category" && key !== "sort") {
      nextParams.delete("category");
    }

    if (key === "county") {
      nextParams.delete("town");
    }

    if (key === "type" && value === "office") {
      nextParams.delete("bedrooms");
      nextParams.delete("bathrooms");
    }

    if (key === "type" && value !== "office") {
      nextParams.delete("minSize");
      nextParams.delete("maxSize");
    }

    setSearchParams(nextParams);
  };

  const updateCategory = (category) => {
    const nextParams = new URLSearchParams(searchParams);

    if (!category) {
      nextParams.delete("category");
    } else {
      nextParams.set("category", category);
      nextParams.delete("purpose");
      nextParams.delete("type");
      nextParams.delete("bedrooms");
      nextParams.delete("bathrooms");
      nextParams.delete("minSize");
      nextParams.delete("maxSize");
    }

    nextParams.delete("page");
    setSearchParams(nextParams);
  };

  const clearFilters = () => {
    setSearchParams({});
    setShowMobileFilters(false);
  };

  const toggleViewMode = () => {
    const newMode = viewMode === "grid" ? "list" : "grid";
    setViewMode(newMode);
    localStorage.setItem("listingsViewMode", newMode);
  };

  const fetchMeta = async () => {
    try {
      const data = await getListingMeta();
      setMeta(data.meta || {});
    } catch {
      toast.error("Failed to load filter options");
    }
  };

  const fetchListings = async () => {
    try {
      setLoading(true);

      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          params[key] = value;
        }
      });

      const data = await getPublicListings(params);
      setListings(data.listings || []);
      setPagination(data.pagination || null);
    } catch {
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleMenuToggle = (event) => {
      setIsMobileMenuOpen(event.detail?.isOpen || false);
      if (event.detail?.isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    window.addEventListener("mobileMenuToggle", handleMenuToggle);
    
    return () => {
      window.removeEventListener("mobileMenuToggle", handleMenuToggle);
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchListings();
  }, [filters, viewMode]);

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      <div className={`transition-all duration-300 ${isMobileMenuOpen ? 'pointer-events-none' : ''}`}>
        <div className="mx-auto max-w-8xl px-4 py-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#013E43] sm:text-3xl">
              {pageTitle}
            </h1>
            <p className="mt-2 text-sm text-[#065A57] sm:text-base">
              Find rentals, sale properties, office spaces, student homes, and family homes across Kenya.
            </p>
          </div>

          {/* Sticky Category Tabs */}
          <div className={`
            sticky top-0 z-40 -mx-4 bg-[#F0F7F4] px-4 py-2 shadow-sm
            transition-all duration-300
            ${isMobileMenuOpen ? 'hidden lg:block' : 'block'}
          `}>
            <ListingCategoryTabs
              activeCategory={filters.category}
              onChange={updateCategory}
            />
          </div>

          {/* Toolbar - Filter Button (Mobile) & View Toggle */}
          <div className={`
            transition-all duration-300
            ${isMobileMenuOpen ? 'hidden' : 'block'}
          `}>
            <div className="sticky top-[88px] z-10 mb-4 flex items-center justify-between gap-3">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#A8D8C1] bg-white py-3 font-medium text-[#013E43] shadow-sm lg:hidden"
              >
                <FiFilter />
                Filters
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-[#02BB31] px-2 py-0.5 text-xs text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* View Toggle */}
              <div className="hidden lg:flex items-center gap-2 rounded-lg border border-[#A8D8C1] bg-white p-1">
                <button
                  onClick={toggleViewMode}
                  className={`flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    viewMode === "grid"
                      ? "bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white shadow-md"
                      : "text-[#065A57] hover:bg-[#F0F7F4]"
                  }`}
                >
                  <FiGrid className="mr-2 text-base" />
                  Grid
                </button>
                <button
                  onClick={toggleViewMode}
                  className={`flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    viewMode === "list"
                      ? "bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white shadow-md"
                      : "text-[#065A57] hover:bg-[#F0F7F4]"
                  }`}
                >
                  <FiList className="mr-2 text-base" />
                  List
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block lg:w-[280px] xl:w-[320px]">
              <div className="sticky top-[120px]">
                <ListingsFilterPanel
                  meta={meta}
                  filters={filters}
                  updateFilter={updateFilter}
                  clearFilters={clearFilters}
                  hasActiveFilters={hasActiveFilters}
                />
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              {/* Results Header */}
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#065A57]">
                  <span className="font-semibold text-[#013E43]">
                    {pagination?.total ?? listings.length}
                  </span>{" "}
                  properties found
                  {hasActiveFilters && " with active filters"}
                </p>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#065A57]">Sort by:</span>
                  <select
                    value={filters.sort}
                    onChange={(e) => updateFilter("sort", e.target.value)}
                    className="rounded-lg border border-[#A8D8C1] px-4 py-2 text-sm focus:border-[#02BB31] focus:outline-none focus:ring-2 focus:ring-[#02BB31]"
                  >
                    <option value="latest">Latest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>

              {/* Listings Grid */}
              <ListingsGrid
                loading={loading}
                listings={listings}
                clearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters}
                viewMode={viewMode}
              />

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => updateFilter("page", String(Number(filters.page) - 1))}
                    disabled={Number(filters.page) === 1}
                    className="rounded-lg border border-[#A8D8C1] bg-white px-4 py-2 text-sm text-[#065A57] transition-all hover:bg-[#F0F7F4] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: Math.min(pagination.pages, 5) }).map((_, index) => {
                      let page;
                      const currentPage = Number(filters.page);
                      const totalPages = pagination.pages;
                      
                      if (totalPages <= 5) {
                        page = index + 1;
                      } else if (currentPage <= 3) {
                        page = index + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + index;
                      } else {
                        page = currentPage - 2 + index;
                      }
                      
                      if (page < 1 || page > totalPages) return null;
                      
                      const active = currentPage === page;
                      
                      return (
                        <button
                          key={page}
                          onClick={() => updateFilter("page", String(page))}
                          className={`h-10 w-10 rounded-lg font-medium transition-all ${
                            active
                              ? "bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white shadow-md"
                              : "border border-[#A8D8C1] bg-white text-[#065A57] hover:bg-[#F0F7F4]"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => updateFilter("page", String(Number(filters.page) + 1))}
                    disabled={Number(filters.page) === pagination.pages}
                    className="rounded-lg border border-[#A8D8C1] bg-white px-4 py-2 text-sm text-[#065A57] transition-all hover:bg-[#F0F7F4] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      <ListingsMobileFilterModal
        open={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        meta={meta}
        filters={filters}
        updateFilter={updateFilter}
        clearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  );
};

export default ListingsPage;