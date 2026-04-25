import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getListingMeta, getPublicListings } from "../../../services/listings.service";
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
  FiArrowRight,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiTag
} from "react-icons/fi";
import { FaBath, FaBed, FaBuilding, FaSellcast, FaRulerCombined } from "react-icons/fa";
import toast from "react-hot-toast";

const prettifyLabel = (value) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getImageUrl = (image) => {
  if (!image) return null;
  if (typeof image === "string") return image;
  if (typeof image === "object" && image.url) return image.url;
  return null;
};

const ListingCard = ({ listing }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const firstImage = listing.images?.[0] ? getImageUrl(listing.images[0]) : null;

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

  const isOffice = listing.type === "office";

  return (
    <Link
      to={`/properties/${listing._id}`}
      className="group relative block overflow-hidden rounded-xl sm:rounded-2xl bg-white shadow-lg border border-[#A8D8C1] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[4/3] sm:aspect-auto sm:h-48 md:h-52 lg:h-56 overflow-hidden bg-gradient-to-r from-[#013E43] to-[#005C57]">
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
            <FiHome className="text-3xl sm:text-4xl text-white/50 mb-1 sm:mb-2" />
            <p className="text-[10px] sm:text-sm text-white/50">No image available</p>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex gap-1 sm:gap-2">
          {listing.isFeatured && (
            <span className="flex items-center gap-0.5 sm:gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 px-1 sm:px-2 py-0.5 sm:py-1 text-[8px] sm:text-xs font-medium text-white shadow-lg">
              <FiStar className="text-[6px] sm:text-xs" />
              <span className="hidden sm:inline">Featured</span>
            </span>
          )}
          {listing.status === "approved" && (
            <span className="rounded-full bg-[#02BB31] px-1 sm:px-2 py-0.5 sm:py-1 text-[8px] sm:text-xs font-medium text-white shadow-lg">
              Approved
            </span>
          )}
        </div>

        {/* <div className="absolute top-2 sm:top-3 right-12 sm:right-14">
          <span
            className={`rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-[8px] sm:text-xs font-medium text-white shadow-lg ${
              listing.purpose === "sale" ? "bg-purple-600" : "bg-blue-600"
            }`}
          >
            {listing.purpose === "sale" ? "For Sale" : "For Rent"}
          </span>
        </div> */}

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-2 sm:top-3 right-2 sm:right-3 rounded-full bg-white/90 p-1.5 sm:p-2 shadow-lg backdrop-blur-sm transition-all hover:scale-110 z-10"
        >
          <FiHeart
            className={`text-sm sm:text-lg transition-colors ${
              isFavorite ? "fill-red-500 text-red-500" : "text-[#065A57]"
            }`}
          />
        </button>

        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3">
          <div className="rounded-lg bg-[#013E43]/90 px-1.5 sm:px-3 py-0.5 sm:py-1.5 backdrop-blur-sm">
            <p className="text-[10px] sm:text-sm md:text-base lg:text-lg font-bold text-white">
              {formatPrice(listing.price)}
            </p>
            <p className="text-[8px] sm:text-xs text-[#A8D8C1] hidden sm:block">
              {listing.purpose === "sale" ? "/total" : "/month"}
            </p>
          </div>
        </div>

        {listing.images?.length > 0 && (
          <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 flex items-center gap-0.5 sm:gap-1 rounded-full bg-black/60 px-1 sm:px-2 py-0.5 sm:py-1 text-[8px] sm:text-xs text-white backdrop-blur-sm">
            <FiCamera className="text-[6px] sm:text-xs" />
            <span>{listing.images.length}</span>
          </div>
        )}
      </div>

      <div className="p-2 sm:p-4 md:p-5">
        <div className="mb-1 sm:mb-2">
          <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-[#013E43] line-clamp-1 group-hover:text-[#02BB31] transition-colors">
            {listing.title}
          </h3>
          <p className="mt-0.5 sm:mt-1 flex items-center text-[10px] sm:text-xs text-[#065A57]">
            <FiMapPin className="mr-0.5 sm:mr-1 flex-shrink-0 text-[#02BB31] text-[8px] sm:text-xs" />
            <span className="line-clamp-1">{locationText || "Location not specified"}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2">
          <span className="flex items-center gap-0.5 sm:gap-1 rounded-full bg-[#F0F7F4] px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs text-[#065A57]">
            <FaBuilding className="text-[#02BB31] text-[8px] sm:text-xs" />
            {listing.type === "office" ? "Office" : prettifyLabel(listing.type)}
          </span>

          {isOffice ? (
            <span className="flex items-center gap-0.5 sm:gap-1 rounded-full bg-[#F0F7F4] px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs text-[#065A57]">
              <FaRulerCombined className="text-[#02BB31] text-[8px] sm:text-xs" />
              {listing.size ? `${listing.size} ${listing.sizeUnit || "sqft"}` : "Size N/A"}
            </span>
          ) : (
            <>
              <span className="flex items-center gap-0.5 sm:gap-1 rounded-full bg-[#F0F7F4] px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs text-[#065A57]">
                <FaBed className="text-[#02BB31] text-[8px] sm:text-xs" />
                {listing.bedrooms ?? 0}
              </span>
              <span className="flex items-center gap-0.5 sm:gap-1 rounded-full bg-[#F0F7F4] px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs text-[#065A57]">
                <FaBath className="text-[#02BB31] text-[8px] sm:text-xs" />
                {listing.bathrooms ?? 0}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

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
      const newScrollLeft =
        scrollContainerRef.current.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    checkScrollPosition();
    const handleResize = () => checkScrollPosition();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative">
      {showLeftArrow && (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white border border-[#A8D8C1] p-2 shadow-md"
        >
          <FiChevronLeft className="text-[#065A57]" />
        </button>
      )}

      <div
        ref={scrollContainerRef}
        onScroll={checkScrollPosition}
        className="flex overflow-x-auto scrollbar-hide gap-2 sm:gap-3 pb-4 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.value;

          return (
            <button
              key={category.value}
              onClick={() => onCategoryChange(category.value)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full font-medium whitespace-nowrap transition-all text-xs sm:text-sm md:text-base ${
                isActive
                  ? "bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white shadow-md"
                  : "bg-white text-[#065A57] border border-[#A8D8C1] hover:bg-[#F0F7F4]"
              }`}
            >
              <Icon className="text-xs sm:text-sm md:text-base" />
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>

      {showRightArrow && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white border border-[#A8D8C1] p-2 shadow-md"
        >
          <FiChevronRight className="text-[#065A57]" />
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

  const [listingMeta, setListingMeta] = useState({
    counties: [],
    countyTowns: {},
    residentialTypes: [],
    listingTypes: [],
    listingPurposes: [],
    officeSizeUnits: []
  });

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [filters, setFilters] = useState({
    county: searchParams.get("county") || "",
    town: searchParams.get("town") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    bedrooms: searchParams.get("bedrooms") || "",
    type: searchParams.get("type") || "",
    purpose: searchParams.get("purpose") || "rent"
  });

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        setMetaLoading(true);
        const data = await getListingMeta();
        setListingMeta(
          data.meta || {
            counties: [],
            countyTowns: {},
            residentialTypes: [],
            listingTypes: [],
            listingPurposes: [],
            officeSizeUnits: []
          }
        );
      } catch (error) {
        toast.error("Failed to load listing options", {
          style: { background: "#013E43", color: "#fff" }
        });
      } finally {
        setMetaLoading(false);
      }
    };

    fetchMeta();
  }, []);

  useEffect(() => {
    setFilters({
      county: searchParams.get("county") || "",
      town: searchParams.get("town") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      bedrooms: searchParams.get("bedrooms") || "",
      type: searchParams.get("type") || "",
      purpose: searchParams.get("purpose") || "rent"
    });
  }, [searchParams]);

  const propertyTypes = useMemo(() => {
    const mapped = (listingMeta.listingTypes || []).map((type) => ({
      value: type,
      label: type === "office" ? "Office Space" : prettifyLabel(type),
      icon: FaBuilding
    }));

    return [{ value: "All", label: "All Properties", icon: FiHome }, ...mapped];
  }, [listingMeta.listingTypes]);

  const purposes = useMemo(() => {
    const available = listingMeta.listingPurposes || [];
    return available.map((purpose) => ({
      value: purpose,
      label: purpose === "rent" ? "Rent a Property" : "Buy a Property",
      icon: purpose === "sale" ? FaSellcast : FiHome
    }));
  }, [listingMeta.listingPurposes]);

  const countyOptions = useMemo(() => {
    return (listingMeta.counties || []).map((county) => ({
      value: county,
      label: prettifyLabel(county)
    }));
  }, [listingMeta.counties]);

  const townOptions = useMemo(() => {
    const towns = listingMeta.countyTowns?.[filters.county] || [];
    return towns.map((town) => ({
      value: town,
      label: prettifyLabel(town)
    }));
  }, [listingMeta.countyTowns, filters.county]);

  const isResidentialType = useMemo(() => {
    return (listingMeta.residentialTypes || []).includes(filters.type);
  }, [listingMeta.residentialTypes, filters.type]);

  const fetchListings = async () => {
    try {
      setLoading(true);

      const params = {};

      if (filters.county) params.county = filters.county;
      if (filters.town) params.town = filters.town;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.bedrooms && filters.type !== "office") params.bedrooms = filters.bedrooms;
      if (filters.type) params.type = filters.type;
      if (filters.purpose) params.purpose = filters.purpose;

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
    if (!metaLoading) {
      fetchListings();
    }
  }, [searchParams, metaLoading]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    if (name === "county") {
      setFilters((prev) => ({
        ...prev,
        county: value,
        town: ""
      }));
      return;
    }

    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (filters.county) params.set("county", filters.county);
    if (filters.town) params.set("town", filters.town);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.bedrooms && filters.type !== "office") params.set("bedrooms", filters.bedrooms);
    if (filters.type) params.set("type", filters.type);
    if (filters.purpose) params.set("purpose", filters.purpose);

    setSearchParams(params);
    setShowMobileFilters(false);
  };

  const handleTypeChange = (type) => {
    const nextType = type === "All" ? "" : type;

    setFilters((prev) => ({
      ...prev,
      type: nextType,
      bedrooms: nextType === "office" ? "" : prev.bedrooms
    }));

    const params = new URLSearchParams(searchParams);

    if (type === "All") {
      params.delete("type");
    } else {
      params.set("type", type);
    }

    if (type === "office") {
      params.delete("bedrooms");
    }

    setSearchParams(params);
  };

  const handlePurposeChange = (purpose) => {
    setFilters((prev) => ({ ...prev, purpose }));

    const params = new URLSearchParams(searchParams);
    params.set("purpose", purpose);
    setSearchParams(params);
  };

  const handleReset = () => {
    setFilters({
      county: "",
      town: "",
      minPrice: "",
      maxPrice: "",
      bedrooms: "",
      type: "",
      purpose: "rent"
    });

    const params = new URLSearchParams();
    params.set("purpose", "rent");
    setSearchParams(params);
    setShowMobileFilters(false);
  };

  const hasActiveFilters = () => {
    return (
      filters.county ||
      filters.town ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.bedrooms ||
      filters.type ||
      filters.purpose !== "rent"
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.county) count++;
    if (filters.town) count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.bedrooms) count++;
    if (filters.type) count++;
    if (filters.purpose !== "rent") count++;
    return count;
  };

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      <div className="sticky top-0 z-20 bg-[#F0F7F4] pt-4 pb-2">
        <div className="max-w-9xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="mb-3">
            <div className="flex gap-2 sm:gap-3">
              {purposes.map((purpose) => {
                const Icon = purpose.icon;
                const isActive = filters.purpose === purpose.value;

                return (
                  <button
                    key={purpose.value}
                    onClick={() => handlePurposeChange(purpose.value)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-medium whitespace-nowrap transition-all text-xs sm:text-sm ${
                      isActive
                        ? "bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white shadow-md"
                        : "bg-white text-[#065A57] border border-[#A8D8C1] hover:bg-[#F0F7F4]"
                    }`}
                  >
                    <Icon className="text-xs sm:text-sm" />
                    <span>{purpose.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-2">
            <CategoryTabs
              categories={propertyTypes}
              activeCategory={filters.type || "All"}
              onCategoryChange={handleTypeChange}
            />
          </div>
        </div>
      </div>

      <div className="max-w-9xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pb-8">
        <div className="grid gap-4 sm:gap-6 md:gap-8 lg:grid-cols-[340px_1fr]">
          <aside className="hidden lg:block h-fit">
            <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6 sticky top-40">
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
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-2">
                    County
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                    <select
                      name="county"
                      value={filters.county}
                      onChange={handleFilterChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors appearance-none bg-white"
                    >
                      <option value="">All Counties</option>
                      {countyOptions.map((county) => (
                        <option key={county.value} value={county.value}>
                          {county.label}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#065A57]" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-2">
                    Town
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                    <select
                      name="town"
                      value={filters.town}
                      onChange={handleFilterChange}
                      disabled={!filters.county}
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors appearance-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">All Towns</option>
                      {townOptions.map((town) => (
                        <option key={town.value} value={town.value}>
                          {town.label}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#065A57]" />
                  </div>
                </div>

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

                {filters.type !== "office" && (
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
                )}

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
                      {propertyTypes
                        .filter((type) => type.value !== "All")
                        .map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#065A57]" />
                  </div>
                </div>

                {hasActiveFilters() && (
                  <div className="pt-2">
                    <p className="text-xs text-[#065A57] mb-2">Active filters:</p>
                    <div className="flex flex-wrap gap-2">
                      {filters.county && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#F0F7F4] text-xs text-[#013E43] rounded-full">
                          {prettifyLabel(filters.county)}
                          <button
                            type="button"
                            onClick={() => setFilters((prev) => ({ ...prev, county: "", town: "" }))}
                            className="hover:text-red-500"
                          >
                            <FiX size={12} />
                          </button>
                        </span>
                      )}

                      {filters.town && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#F0F7F4] text-xs text-[#013E43] rounded-full">
                          {prettifyLabel(filters.town)}
                          <button
                            type="button"
                            onClick={() => setFilters((prev) => ({ ...prev, town: "" }))}
                            className="hover:text-red-500"
                          >
                            <FiX size={12} />
                          </button>
                        </span>
                      )}

                      {filters.minPrice && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#F0F7F4] text-xs text-[#013E43] rounded-full">
                          ≥ KES {parseInt(filters.minPrice, 10).toLocaleString()}
                          <button
                            type="button"
                            onClick={() => setFilters((prev) => ({ ...prev, minPrice: "" }))}
                            className="hover:text-red-500"
                          >
                            <FiX size={12} />
                          </button>
                        </span>
                      )}

                      {filters.maxPrice && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#F0F7F4] text-xs text-[#013E43] rounded-full">
                          ≤ KES {parseInt(filters.maxPrice, 10).toLocaleString()}
                          <button
                            type="button"
                            onClick={() => setFilters((prev) => ({ ...prev, maxPrice: "" }))}
                            className="hover:text-red-500"
                          >
                            <FiX size={12} />
                          </button>
                        </span>
                      )}

                      {filters.bedrooms && filters.type !== "office" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#F0F7F4] text-xs text-[#013E43] rounded-full">
                          {filters.bedrooms === "0"
                            ? "Studio"
                            : `${filters.bedrooms} bed${filters.bedrooms > 1 ? "s" : ""}`}
                          <button
                            type="button"
                            onClick={() => setFilters((prev) => ({ ...prev, bedrooms: "" }))}
                            className="hover:text-red-500"
                          >
                            <FiX size={12} />
                          </button>
                        </span>
                      )}

                      {filters.type && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#F0F7F4] text-xs text-[#013E43] rounded-full">
                          {filters.type === "office" ? "Office Space" : prettifyLabel(filters.type)}
                          <button
                            type="button"
                            onClick={() => setFilters((prev) => ({ ...prev, type: "", bedrooms: "" }))}
                            className="hover:text-red-500"
                          >
                            <FiX size={12} />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                )}

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

          <section>
            <div className="lg:hidden mb-4 sm:mb-6">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="w-full py-2.5 sm:py-3 bg-white border border-[#A8D8C1] rounded-xl flex items-center justify-center gap-2 text-[#013E43] font-medium shadow-sm text-sm sm:text-base"
              >
                <FiFilter className="text-sm sm:text-base" />
                Filters
                {hasActiveFilters() && (
                  <span className="ml-1 px-1.5 sm:px-2 py-0.5 bg-[#02BB31] text-white text-[10px] sm:text-xs rounded-full">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div>
                <p className="text-xs sm:text-sm text-[#065A57]">
                  <span className="font-semibold text-[#013E43]">{listings.length}</span> properties found
                  {hasActiveFilters() && " with filters"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-[#065A57]">Sort:</span>
                <select className="px-2 sm:px-3 py-1.5 sm:py-2 border border-[#A8D8C1] rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#02BB31] bg-white">
                  <option>Newest</option>
                  <option>Price: Low</option>
                  <option>Price: High</option>
                </select>
              </div>
            </div>

            {loading || metaLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
                  <p className="text-xs sm:text-sm text-[#065A57]">Loading listings...</p>
                </div>
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-16 text-center border border-[#A8D8C1]">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <FiHome className="text-3xl sm:text-4xl text-[#A8D8C1]" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-[#013E43] mb-2 sm:mb-3">
                  No listings found
                </h2>
                <p className="text-xs sm:text-sm text-[#065A57] mb-4 sm:mb-6">
                  {hasActiveFilters()
                    ? "Try adjusting your filters to see more properties."
                    : "No properties are currently available."}
                </p>
                {hasActiveFilters() && (
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    <FiRefreshCw />
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
                {listings.map((listing) => (
                  <ListingCard key={listing._id} listing={listing} />
                ))}
              </div>
            )}

            {listings.length > 0 && listings.length >= 12 && (
              <div className="mt-8 sm:mt-12 text-center">
                <button className="px-6 sm:px-8 py-2.5 sm:py-3 bg-white text-[#013E43] border-2 border-[#A8D8C1] rounded-lg font-semibold hover:bg-[#F0F7F4] transition-colors inline-flex items-center gap-2 text-xs sm:text-sm">
                  Load More Properties
                  <FiArrowRight className="text-xs sm:text-sm" />
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

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
                  <label className="block text-sm font-medium text-[#013E43] mb-2">County</label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                    <select
                      name="county"
                      value={filters.county}
                      onChange={handleFilterChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors appearance-none bg-white"
                    >
                      <option value="">All Counties</option>
                      {countyOptions.map((county) => (
                        <option key={county.value} value={county.value}>
                          {county.label}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#065A57]" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-2">Town</label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                    <select
                      name="town"
                      value={filters.town}
                      onChange={handleFilterChange}
                      disabled={!filters.county}
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors appearance-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">All Towns</option>
                      {townOptions.map((town) => (
                        <option key={town.value} value={town.value}>
                          {town.label}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#065A57]" />
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

                {filters.type !== "office" && (
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
                )}

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
                      {propertyTypes
                        .filter((type) => type.value !== "All")
                        .map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
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

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default ListingsPage;