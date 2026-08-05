import { useEffect, useState } from "react";
import BackendNotice from "../components/home/BackendNotice";
import HeroSearch from "../components/home/HeroSearch";
import ServicesPreview from "../components/home/ServicesPreview";
import LoadingScreen from "../components/common/LoadingScreen";
import CategoryStrip from "../components/listings/CategoryStrip";
import ListingRail from "../components/listings/ListingRail";
import { listingCategories } from "../config/listingCategories";
import { getFeaturedListings, getPublicListings, getRecentListings } from "../services/listings.service";
import { getServiceCategories } from "../services/services.service";
import { getApiErrorMessage } from "../utils/apiError";
import { useSeo } from "../utils/seo";

const homeCategorySlugs = ["rentals", "for-sale", "apartments", "office", "family"];

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoading(true);
        setError("");
        const visibleCategories = listingCategories.filter((category) => homeCategorySlugs.includes(category.slug));
        const [featuredData, recentData, serviceData, categoryResults] = await Promise.all([
          getFeaturedListings({ limit: 8 }).catch(() => ({ listings: [] })),
          getRecentListings({ limit: 8 }),
          getServiceCategories().catch(() => ({ categories: [] })),
          Promise.all(
            visibleCategories.map(async (category) => {
              const data = await getPublicListings({ ...category.params, limit: 10 });
              return [category.slug, data.listings || []];
            })
          )
        ]);

        setFeatured(featuredData.listings || []);
        setRecent(recentData.listings || []);
        setServiceCategories(serviceData.categories || []);
        setCategoryListings(Object.fromEntries(categoryResults));
      } catch (err) {
        setFeatured([]);
        setRecent([]);
        setServiceCategories([]);
        setCategoryListings({});
        setError(getApiErrorMessage(err, "Could not load listings from the backend."));
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, []);

  const visibleCategories = listingCategories.filter((category) => homeCategorySlugs.includes(category.slug));
  const categoriesBeforeServices = visibleCategories.filter((category) => ["rentals", "for-sale", "apartments"].includes(category.slug));
  const categoriesAfterServices = visibleCategories.filter((category) => ["office", "family"].includes(category.slug));

  if (loading) {
    return <LoadingScreen label="Loading RendaHomes" />;
  }

  return (
    <div>
      <HeroSearch listings={recent} />
      <BackendNotice message={error} />
      <CategoryStrip />
      <ListingRail title="Featured listings" eyebrow="Premium and highlighted homes" listings={featured.slice(0, 10)} viewAllTo="/listings?sort=popular" />
      {categoriesBeforeServices.map((category) => (
        <ListingRail
          key={category.slug}
          title={category.title}
          eyebrow={category.eyebrow}
          listings={categoryListings[category.slug] || []}
          viewAllTo={`/categories/${category.slug}`}
          emptyText={`No ${category.title.toLowerCase()} available yet.`}
        />
      ))}
      <ServicesPreview categories={serviceCategories} />
      {categoriesAfterServices.map((category) => (
        <ListingRail
          key={category.slug}
          title={category.title}
          eyebrow={category.eyebrow}
          listings={categoryListings[category.slug] || []}
          viewAllTo={`/categories/${category.slug}`}
          emptyText={`No ${category.title.toLowerCase()} available yet.`}
        />
      ))}
    </div>
  );
}
