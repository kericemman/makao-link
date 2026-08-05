import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import CategoryStrip from "../components/listings/CategoryStrip";
import FilterPanel from "../components/listings/FilterPanel";
import ListingResults from "../components/listings/ListingResults";
import LoadingScreen from "../components/common/LoadingScreen";
import { categoryBySlug } from "../config/listingCategories";
import { getListingMeta, getPublicListings } from "../services/listings.service";
import { getApiErrorMessage } from "../utils/apiError";
import { useSeo } from "../utils/seo";

const cleanParams = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== "" && value !== null));

export default function CategoryListings() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const { slug } = useParams();
  const category = categoryBySlug[slug];
  useSeo({
    title: category ? `${category.title} in Kenya` : "Property Category",
    description: category?.description || "Browse verified RendaHomes property listings by category across Kenya.",
    path: category ? `/categories/${slug}` : "/listings"
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
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
  }, []);

  useEffect(() => {
    if (!category) return;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getPublicListings(cleanParams({ ...category.params, ...filters }));
        setListings(data.listings || []);
        setPagination(data.pagination || null);
      } catch (err) {
        setListings([]);
        setPagination(null);
        setError(getApiErrorMessage(err, "Could not load category listings from the backend."));
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };

    load();
  }, [category, filters]);

  if (!category) return <Navigate to="/listings" replace />;

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
    return <LoadingScreen label="Loading category" />;
  }

  return (
    <div className="bg-[#F0F7F4]">
      <section className="border-b border-[#A8D8C1] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">{category.eyebrow}</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[#013E43]">{category.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#065A57]">{category.description}</p>
        </div>
      </section>

      <CategoryStrip />

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
