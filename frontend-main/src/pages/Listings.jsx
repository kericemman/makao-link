import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CategoryStrip from "../components/listings/CategoryStrip";
import FilterPanel from "../components/listings/FilterPanel";
import ListingRail from "../components/listings/ListingRail";
import ListingResults from "../components/listings/ListingResults";
import LoadingScreen from "../components/common/LoadingScreen";
import { listingCategories } from "../config/listingCategories";
import { landlordListPropertyUrl, portalLinks } from "../config/portals";
import { getListingMeta, getPublicListings } from "../services/listings.service";
import { getApiErrorMessage } from "../utils/apiError";
import { useSeo } from "../utils/seo";

const cleanParams = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== "" && value !== null));

export default function Listings() {
  useSeo({
    title: "Property Listings in Kenya",
    description: "Browse verified rental homes, apartments, bedsitters, office spaces, maisonettes, and houses for sale in Kenya.",
    path: "/listings"
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [categoryPreview, setCategoryPreview] = useState({});
  const [pagination, setPagination] = useState(null);
  const [meta, setMeta] = useState({ counties: [], countyTowns: {}, listingTypes: [] });
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  const filters = useMemo(
    () => ({
      search: searchParams.get("search") || "",
      purpose: searchParams.get("purpose") || "",
      type: searchParams.get("type") || "",
      county: searchParams.get("county") || "",
      town: searchParams.get("town") || "",
      category: searchParams.get("category") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      bedrooms: searchParams.get("bedrooms") || "",
      bathrooms: searchParams.get("bathrooms") || "",
      page: searchParams.get("page") || "1",
      limit: "12"
    }),
    [searchParams]
  );

  useEffect(() => {
    getListingMeta()
      .then((data) => setMeta(data.meta || {}))
      .catch(() => {});

    Promise.all(
      listingCategories.slice(0, 5).map(async (category) => {
        const data = await getPublicListings({ ...category.params, limit: 8 });
        return [category.slug, data.listings || []];
      })
    )
      .then((entries) => setCategoryPreview(Object.fromEntries(entries)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getPublicListings(cleanParams(filters));
        setListings(data.listings || []);
        setPagination(data.pagination || null);
      } catch (err) {
        setListings([]);
        setPagination(null);
        setError(getApiErrorMessage(err, "Could not load listings from the backend."));
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };

    load();
  }, [filters]);

  const update = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  };

  const updateCounty = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("county", value);
    else next.delete("county");
    next.delete("town");
    next.delete("page");
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams({});
  const activeFilterCount = [...searchParams.keys()].filter((key) => key !== "page").length;
  const total = pagination?.total ?? listings.length;
  const page = Number(filters.page || 1);
  const pages = Number(pagination?.pages || 1);

  if (initialLoading) {
    return <LoadingScreen label="Loading listings" />;
  }

  return (
    <div className="bg-[#F0F7F4]">
      <section className="border-b border-[#A8D8C1] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">Browse public listings</p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[#013E43]">Search homes, rentals, and spaces</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#065A57]">
                Use filters for exact matches, or explore category rails below.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={landlordListPropertyUrl()} title={portalLinks.landlord.purpose} className="rounded-full border border-[#02BB31] bg-white px-5 py-3 text-sm font-extrabold text-[#013E43] shadow-sm">
                List a property
              </a>
              <a href={portalLinks.user.href} title={portalLinks.user.purpose} className="rounded-full bg-[#013E43] px-5 py-3 text-sm font-extrabold text-white shadow-sm">
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </section>

      <CategoryStrip />
      {listingCategories.slice(0, 3).map((category) => (
        <ListingRail
          key={category.slug}
          title={category.title}
          eyebrow={category.eyebrow}
          listings={categoryPreview[category.slug] || []}
          viewAllTo={`/categories/${category.slug}`}
          emptyText={`No ${category.title.toLowerCase()} available yet.`}
        />
      ))}

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
        <FilterPanel
          filters={filters}
          meta={meta}
          activeFilterCount={activeFilterCount}
          onUpdate={update}
          onUpdateCounty={updateCounty}
          onClear={clearFilters}
        />
        <ListingResults
          listings={listings}
          pagination={pagination}
          loading={loading}
          error={error}
          page={page}
          pages={pages}
          total={total}
          onPage={(value) => update("page", value)}
        />
      </div>
    </div>
  );
}
