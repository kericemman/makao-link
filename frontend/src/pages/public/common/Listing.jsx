import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiFilter } from "react-icons/fi";
import toast from "react-hot-toast";

import { getListingMeta, getPublicListings } from "../../../services/listings.service";
import ListingCategoryTabs from "../../../components/listings/ListingCategoryTabs";
import ListingsFilterPanel from "../../../components/listings/ListingFiterPanel";
import ListingsMobileFilterModal from "../../../components/listings/ListingMobileFilterModal";
import ListingsGrid from "../../../components/listings/ListingGrid";

const categoryTitles = {
  student: "Student Friendly Homes",
  office: "Office Spaces",
  family: "Family Homes for Sale",
  luxury: "Luxury Apartments"
};

const ListingsPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [searchParams, setSearchParams] = useSearchParams();

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
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchListings();
  }, [filters]);

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      <div className="mx-auto max-w-9xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-[#013E43] md:text-3xl">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm text-[#065A57]">
            Find rentals, sale properties, office spaces, student homes, and family homes.
          </p>
        </div>

        <ListingCategoryTabs
          activeCategory={filters.category}
          onChange={updateCategory}
        />

        <button
          onClick={() => setShowMobileFilters(true)}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#A8D8C1] bg-white py-3 font-medium text-[#013E43] shadow-sm lg:hidden"
        >
          <FiFilter />
          Filters
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-[#02BB31] px-2 py-0.5 text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="grid gap-6 lg:grid-cols-[30%_70%]">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <ListingsFilterPanel
                meta={meta}
                filters={filters}
                updateFilter={updateFilter}
                clearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </aside>

          <main>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-[#065A57]">
                <span className="font-semibold text-[#013E43]">
                  {pagination?.total ?? listings.length}
                </span>{" "}
                listings found
              </p>
            </div>

            <ListingsGrid
              loading={loading}
              listings={listings}
              clearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />

            {pagination?.pages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                {Array.from({ length: pagination.pages }).map((_, index) => {
                  const page = index + 1;
                  const active = Number(filters.page) === page;

                  return (
                    <button
                      key={page}
                      onClick={() => updateFilter("page", String(page))}
                      className={`h-10 w-10 rounded-lg font-medium ${
                        active
                          ? "bg-[#013E43] text-white"
                          : "border border-[#A8D8C1] text-[#065A57] bg-white"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

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