export const portalLinks = {
  landlord: {
    label: "Landlord portal",
    href: import.meta.env.VITE_LANDLORD_URL || (import.meta.env.DEV ? "http://localhost:5174" : "https://landlord.rendahomes.com"),
    purpose: "For owners to add properties, manage listings, subscriptions, and inquiries."
  },
  user: {
    label: "User portal",
    href: import.meta.env.VITE_USER_URL || (import.meta.env.DEV ? "http://localhost:5175" : "https://user.rendahomes.com"),
    purpose: "For tenants, agents, service providers, saved homes, and support history."
  }
};

export const mainRoutes = {
  home: "/",
  listings: "/listings",
  listingDetails: (id) => `/listings/${id}`
};

export const joinPortalUrl = (base, path = "") => `${base.replace(/\/$/, "")}${path}`;

export const landlordListPropertyUrl = () =>
  `${joinPortalUrl(portalLinks.landlord.href, "/login")}?next=${encodeURIComponent("/listings/new")}`;

const propertyRequestSearchFields = ["purpose", "search", "county", "town", "type", "bedrooms", "bathrooms", "minPrice", "maxPrice", "guests"];

export const userPropertyRequestUrl = (filters = {}) => {
  const query = new URLSearchParams();
  for (const field of propertyRequestSearchFields) {
    const value = String(filters[field] ?? "").trim();
    if (value) query.set(field, value);
  }
  const requestPath = `/property-requests${query.size ? `?${query.toString()}` : ""}`;
  return `${joinPortalUrl(portalLinks.user.href, "/login")}?next=${encodeURIComponent(requestPath)}`;
};
