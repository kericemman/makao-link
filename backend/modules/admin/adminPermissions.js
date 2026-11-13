const ADMIN_PERMISSION_CATALOG = [
  { key: "dashboard.read", label: "Dashboard overview", description: "View operational totals, activity, and system status." },
  { key: "traffic.read", label: "Website traffic", description: "View aggregated page views and broad traffic sources." },
  { key: "listings.read", label: "Listings: view", description: "View listings and moderation history." },
  { key: "listings.review", label: "Listings: review", description: "Approve or reject submitted listings." },
  { key: "listings.manage", label: "Listings: manage", description: "Remove, restore, or change listing trust status." },
  { key: "listings.delete", label: "Listings: permanently delete", description: "Permanently delete listings from trash." },
  { key: "landlords.read", label: "Landlords", description: "View landlord accounts and account status." },
  { key: "landlord_onboarding.manage", label: "Landlord onboarding", description: "Review setup progress and follow-up delivery status." },
  { key: "assisted_listings.manage", label: "Assisted listings", description: "Create, review, approve, and resend assisted-listing setup." },
  { key: "kyc.review", label: "KYC reviews", description: "View submitted documents and review landlord verification." },
  { key: "inquiries.manage", label: "Inquiries", description: "View and manage tenant inquiries." },
  { key: "stays.manage", label: "Stay requests", description: "View short-stay requests and related listing context." },
  { key: "payments.read", label: "Payments", description: "View payment records and revenue reporting." },
  { key: "subscriptions.manage", label: "Subscriptions", description: "View and manage subscription records." },
  { key: "support.manage", label: "Support", description: "Read and respond to support tickets." },
  { key: "contacts.manage", label: "Contact messages", description: "Read and manage website contact messages." },
  { key: "services.manage", label: "Service providers", description: "Review and manage service applications." },
  { key: "agents.manage", label: "Agents", description: "Create agents and manage agent applications and instructions." },
  { key: "listing_reports.manage", label: "Listing reports", description: "Review listing reports and update their status." },
  { key: "content.manage", label: "Website content", description: "Manage blog posts and newsletter subscribers." },
  { key: "app_content.manage", label: "App content", description: "Manage app updates, policies, support categories, and app tickets." }
];

const ADMIN_PERMISSION_KEYS = ADMIN_PERMISSION_CATALOG.map(({ key }) => key);

const getRequestPath = (req) => String(req?.originalUrl || req?.url || "").split("?")[0];

const requiredAdminPermission = (req) => {
  const method = String(req?.method || "GET").toUpperCase();
  const path = getRequestPath(req);

  if (/^\/api\/admin\/managers(?:\/|$)/.test(path)) return null;
  if (/^\/api\/organizations\/users\/[^/]+\/roles$/.test(path)) return null;
  if (/^\/api\/settings(?:\/|$)/.test(path)) return null;

  if (/^\/api\/admin\/(?:summary|notifications(?:\/.*)?|activity|platform-health)$/.test(path)) return "dashboard.read";
  if (/^\/api\/admin\/(?:overview-trends|overview-commercial)$/.test(path)) return "dashboard.read";
  if (path === "/api/admin/traffic") return method === "GET" ? "traffic.read" : null;
  if (path === "/api/admin/landlords") return method === "GET" ? "landlords.read" : null;
  if (/^\/api\/admin\/landlord-onboarding(?:\/|$)/.test(path)) return "landlord_onboarding.manage";
  if (/^\/api\/admin\/assisted-listing-drafts(?:\/|$)/.test(path)) return "assisted_listings.manage";
  if (path === "/api/admin/payments") return method === "GET" ? "payments.read" : null;
  if (path === "/api/admin/subscriptions") return method === "GET" ? "subscriptions.manage" : null;
  if (path === "/api/admin/stay-requests") return method === "GET" ? "stays.manage" : null;
  if (path === "/api/admin/inquiries") return method === "GET" ? "inquiries.manage" : null;
  if (/^\/api\/admin\/listings(?:\/|$)/.test(path)) {
    if (/^\/api\/admin\/listings\/pending$/.test(path)) return "listings.review";
    if (/\/permanent$/.test(path)) return "listings.delete";
    if (/\/(?:approve|reject)$/.test(path)) return "listings.review";
    if (/\/(?:trash|restore|trust)$/.test(path)) return "listings.manage";
    return method === "GET" ? "listings.read" : null;
  }
  if (/^\/api\/admin\/service-applications(?:\/|$)/.test(path)) return "services.manage";
  if (/^\/api\/admin\/agent(?:s|\-applications|\-instructions)(?:\/|$)/.test(path)) return "agents.manage";
  if (/^\/api\/admin\/content(?:\/|$)/.test(path)) return "app_content.manage";
  if (/^\/api\/kyc\/admin(?:\/|$)/.test(path)) return "kyc.review";
  if (/^\/api\/support\/admin(?:\/|$)/.test(path)) return "support.manage";
  if (/^\/api\/contact\/admin(?:\/|$)/.test(path)) return "contacts.manage";
  if (/^\/api\/listing-reports\/admin(?:\/|$)/.test(path)) return "listing_reports.manage";
  if (/^\/api\/blog\/admin(?:\/|$)/.test(path)) return "content.manage";

  return null;
};

const isSuperAdmin = (user) => [user?.role, ...(user?.roles || [])].includes("admin");
const isAdminManager = (user) => !isSuperAdmin(user) && [user?.role, ...(user?.roles || [])].includes("admin_manager");
const managerHasPermission = (user, permission) => Boolean(
  user?.adminManagerStatus === "active" && permission &&
  Array.isArray(user?.adminPermissions) && user.adminPermissions.includes(permission)
);

module.exports = {
  ADMIN_PERMISSION_CATALOG,
  ADMIN_PERMISSION_KEYS,
  isAdminManager,
  isSuperAdmin,
  managerHasPermission,
  requiredAdminPermission
};
