import { useEffect } from "react";

const siteName = "RendaHomes";
const defaultBaseUrl = "https://rendahomes.com";
const defaultImage = `${defaultBaseUrl}/assets/renda.png`;

const getBaseUrl = () =>
  (import.meta.env.VITE_SITE_URL || defaultBaseUrl).replace(/\/$/, "");

const getCanonicalUrl = (path = "") => {
  if (path.startsWith("http")) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBaseUrl()}${normalizedPath}`;
};

const setMeta = (selector, attributes) => {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    Object.entries(attributes.identity).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    document.head.appendChild(element);
  }

  Object.entries(attributes.values).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
};

const setLink = (rel, href) => {
  let element = document.head.querySelector(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
};

const setJsonLd = (id, data) => {
  let element = document.getElementById(id);

  if (!data) {
    element?.remove();
    return;
  }

  if (!element) {
    element = document.createElement("script");
    element.type = "application/ld+json";
    element.id = id;
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(data);
};

export const useSeo = ({
  title,
  description,
  path,
  image = defaultImage,
  type = "website",
  jsonLd
}) => {
  useEffect(() => {
    const canonical = getCanonicalUrl(path || window.location.pathname);
    const pageTitle = title ? `${title} | ${siteName}` : `${siteName} | Find Verified Homes in Kenya`;
    const pageDescription =
      description ||
      "Find verified homes, rentals, apartments, bedsitters, office spaces, and houses for sale in Kenya on RendaHomes.";

    document.title = pageTitle;
    setLink("canonical", canonical);

    setMeta('meta[name="description"]', {
      identity: { name: "description" },
      values: { content: pageDescription }
    });
    setMeta('meta[name="robots"]', {
      identity: { name: "robots" },
      values: { content: "index, follow, max-image-preview:large" }
    });
    setMeta('meta[property="og:title"]', {
      identity: { property: "og:title" },
      values: { content: pageTitle }
    });
    setMeta('meta[property="og:description"]', {
      identity: { property: "og:description" },
      values: { content: pageDescription }
    });
    setMeta('meta[property="og:url"]', {
      identity: { property: "og:url" },
      values: { content: canonical }
    });
    setMeta('meta[property="og:image"]', {
      identity: { property: "og:image" },
      values: { content: image || defaultImage }
    });
    setMeta('meta[property="og:type"]', {
      identity: { property: "og:type" },
      values: { content: type }
    });
    setMeta('meta[name="twitter:title"]', {
      identity: { name: "twitter:title" },
      values: { content: pageTitle }
    });
    setMeta('meta[name="twitter:description"]', {
      identity: { name: "twitter:description" },
      values: { content: pageDescription }
    });
    setMeta('meta[name="twitter:image"]', {
      identity: { name: "twitter:image" },
      values: { content: image || defaultImage }
    });

    setJsonLd("page-jsonld", jsonLd);
  }, [description, image, jsonLd, path, title, type]);
};

export const buildListingJsonLd = (listing) => {
  if (!listing) return null;

  const location = [listing.area, listing.town, listing.county].filter(Boolean).join(", ");
  const images = (listing.images || []).filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: listing.title,
    description: listing.description,
    url: getCanonicalUrl(`/listings/${listing._id}`),
    price: Number(listing.price || 0),
    priceCurrency: "KES",
    availability: listing.availability === "available" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    category: listing.type,
    image: images,
    areaServed: location || "Kenya",
    seller: {
      "@type": "Organization",
      name: listing.landlord?.businessName || listing.landlord?.name || "RendaHomes landlord"
    }
  };
};

export const seoText = (value = "", max = 155) =>
  String(value).replace(/\s+/g, " ").trim().slice(0, max);
