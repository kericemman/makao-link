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
