import { useEffect, useState } from "react";
import HeroSearch from "../components/home/HeroSearch";
import ServicesPreview from "../components/home/ServicesPreview";
import CategoryStrip from "../components/listings/CategoryStrip";
import ListingRail from "../components/listings/ListingRail";
import { listingCategories } from "../config/listingCategories";
import { getFeaturedListings, getPublicListings, getRecentListings } from "../services/listings.service";
import { getServiceCategories } from "../services/services.service";
import { getApiErrorMessage } from "../utils/apiError";
import { useSeo } from "../utils/seo";

const homeCategorySlugs = ["rentals", "for-sale", "apartments", "short-stays", "office", "family"];
const visibleHomeCategories = listingCategories.filter((category) => homeCategorySlugs.includes(category.slug));
const initialSectionStates = Object.fromEntries(
  ["recent", "featured", "services", ...homeCategorySlugs.map((slug) => `category:${slug}`)].map((key) => [key, { loading: true, error: "" }])
);

export default function Home() {
  useSeo({
    title: "Find Homes, Rentals and Apartments in Kenya",
    description: "Search verified homes for rent, apartments, bedsitters, office spaces, and houses for sale across Kenya on RendaHomes.",
    path: "/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "RendaHomes",
      url: "https://rendahomes.com/",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://rendahomes.com/listings?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  });

  const [featured, setFeatured] = useState([]);
  const [recent, setRecent] = useState([]);
  const [categoryListings, setCategoryListings] = useState({});
  const [serviceCategories, setServiceCategories] = useState([]);
  const [sectionStates, setSectionStates] = useState(initialSectionStates);

  const requestSection = async (key, request, apply, fallbackMessage) => {
    setSectionStates((current) => ({ ...current, [key]: { loading: true, error: "" } }));
    try {
      const data = await request();
      apply(data);
      setSectionStates((current) => ({ ...current, [key]: { loading: false, error: "" } }));
    } catch (err) {
      setSectionStates((current) => ({
        ...current,
        [key]: { loading: false, error: getApiErrorMessage(err, fallbackMessage) }
      }));
    }
  };

  const loadRecent = () => requestSection(
    "recent",
    () => getRecentListings({ limit: 8 }),
    (data) => setRecent(data.listings || []),
    "Could not load recent listings."
  );

  const loadFeatured = () => requestSection(
    "featured",
    () => getFeaturedListings({ limit: 8 }),
    (data) => setFeatured(data.listings || []),
    "Could not load featured listings."
  );

  const loadServices = () => requestSection(
    "services",
    getServiceCategories,
    (data) => setServiceCategories(data.categories || []),
    "Could not load service categories."
  );

  const loadCategory = (category) => requestSection(
    `category:${category.slug}`,
    () => getPublicListings({ ...category.params, limit: 10 }),
    (data) => setCategoryListings((current) => ({ ...current, [category.slug]: data.listings || [] })),
    `Could not load ${category.title.toLowerCase()}.`
  );

  useEffect(() => {
    loadRecent();
    loadFeatured();
    loadServices();
    visibleHomeCategories.forEach(loadCategory);
  }, []);

  const categoriesBeforeServices = visibleHomeCategories.filter((category) => ["rentals", "for-sale", "apartments"].includes(category.slug));
  const categoriesAfterServices = visibleHomeCategories.filter((category) => ["short-stays", "office", "family"].includes(category.slug));

  return (
    <div>
      <HeroSearch
        listings={recent}
        listingsLoading={sectionStates.recent.loading}
        listingsError={sectionStates.recent.error}
        onRetryListings={loadRecent}
      />
      <CategoryStrip />
      <ListingRail
        title="Featured listings"
        listings={featured.slice(0, 10)}
        viewAllTo="/listings?sort=popular"
        gridOnMobile
        loading={sectionStates.featured.loading}
        error={sectionStates.featured.error}
        onRetry={loadFeatured}
      />
      {categoriesBeforeServices.map((category) => {
        const state = sectionStates[`category:${category.slug}`];
        return (
          <ListingRail
            key={category.slug}
            title={category.title}
            listings={categoryListings[category.slug] || []}
            viewAllTo={`/categories/${category.slug}`}
            emptyText={`No ${category.title.toLowerCase()} available yet.`}
            gridOnMobile
            loading={state.loading}
            error={state.error}
            onRetry={() => loadCategory(category)}
          />
        );
      })}
      <ServicesPreview
        categories={serviceCategories}
        loading={sectionStates.services.loading}
        error={sectionStates.services.error}
        onRetry={loadServices}
      />
      {categoriesAfterServices.map((category) => {
        const state = sectionStates[`category:${category.slug}`];
        return (
          <ListingRail
            key={category.slug}
            title={category.title}
            listings={categoryListings[category.slug] || []}
            viewAllTo={`/categories/${category.slug}`}
            emptyText={`No ${category.title.toLowerCase()} available yet.`}
            gridOnMobile
            loading={state.loading}
            error={state.error}
            onRetry={() => loadCategory(category)}
          />
        );
      })}
    </div>
  );
}
