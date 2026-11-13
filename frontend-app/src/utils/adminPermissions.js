export const ADMIN_PERMISSION_CATALOG = [
  { key: "dashboard.read", label: "Dashboard overview", description: "Operational totals, activity, and system status." },
  { key: "traffic.read", label: "Website traffic", description: "Aggregated page views and broad referral sources." },
  { key: "listings.read", label: "Listings: view", description: "Listings and moderation history." },
  { key: "listings.review", label: "Listings: review", description: "Approve or reject submitted listings." },
  { key: "listings.manage", label: "Listings: manage", description: "Trash, restore, and trust status actions." },
  { key: "listings.delete", label: "Listings: permanently delete", description: "Permanently remove listings from trash." },
  { key: "landlords.read", label: "Landlords", description: "Landlord accounts and status." },
  { key: "landlord_onboarding.manage", label: "Landlord onboarding", description: "Setup progress and follow-up delivery status." },
  { key: "assisted_listings.manage", label: "Assisted listings", description: "Create and review assisted landlord listings." },
  { key: "kyc.review", label: "KYC reviews", description: "View documents and review landlord verification." },
  { key: "inquiries.manage", label: "Inquiries", description: "Tenant inquiries." },
  { key: "stays.manage", label: "Stay requests", description: "Short-stay requests." },
  { key: "payments.read", label: "Payments", description: "Payment records and revenue reporting." },
  { key: "subscriptions.manage", label: "Subscriptions", description: "Subscription records and billing plans." },
  { key: "support.manage", label: "Support", description: "Support tickets and replies." },
  { key: "contacts.manage", label: "Contact messages", description: "Website contact messages." },
  { key: "services.manage", label: "Service providers", description: "Service applications and partner intake." },
  { key: "agents.manage", label: "Agents", description: "Agent accounts, applications, and instructions." },
  { key: "listing_reports.manage", label: "Listing reports", description: "User reports about listings." },
  { key: "content.manage", label: "Website content", description: "Blog posts and newsletter subscribers." },
  { key: "app_content.manage", label: "App content", description: "Mobile updates, policies, support, and settings." }
];

export const getAdminPermissionForPath = (path = "") => {
  if (path === "/admin/dashboard") return "dashboard.read";
  if (path.startsWith("/admin/traffic")) return "traffic.read";
  if (path.startsWith("/admin/managers")) return null;
  if (path.startsWith("/admin/listings/reports")) return "listing_reports.manage";
  if (path.startsWith("/admin/listings/pending")) return "listings.review";
  if (path.startsWith("/admin/listings")) return ["listings.read", "listings.manage", "listings.delete"];
  if (path.startsWith("/admin/stay-requests")) return "stays.manage";
  if (path.startsWith("/admin/landlords/assisted-listing")) return "assisted_listings.manage";
  if (path.startsWith("/admin/onboarding")) return "landlord_onboarding.manage";
  if (path.startsWith("/admin/landlords")) return "landlords.read";
  if (path.startsWith("/admin/kyc")) return "kyc.review";
  if (path.startsWith("/admin/agents")) return "agents.manage";
  if (path.startsWith("/admin/payments")) return "payments.read";
  if (path.startsWith("/admin/subscriptions")) return "subscriptions.manage";
  if (path.startsWith("/admin/inquiries")) return "inquiries.manage";
  if (path.startsWith("/admin/support")) return "support.manage";
  if (path.startsWith("/admin/contact-info")) return "app_content.manage";
  if (path.startsWith("/admin/contact")) return "contacts.manage";
  if (path.startsWith("/admin/services")) return "services.manage";
  if (path.startsWith("/admin/blog") || path.startsWith("/admin/subscribers")) return "content.manage";
  if (path.startsWith("/admin/app/")) return "app_content.manage";
  return null;
};

export const hasSuperAdminRole = (user) => [user?.role, ...(user?.roles || [])].includes("admin");
export const canAccessAdminPath = (user, path) => {
  if (hasSuperAdminRole(user)) return true;
  if (![user?.role, ...(user?.roles || [])].includes("admin_manager")) return false;
  const permission = getAdminPermissionForPath(path);
  return Boolean(user?.adminManagerStatus === "active" && (
    Array.isArray(permission)
      ? permission.some((key) => user?.adminPermissions?.includes(key))
      : permission && user?.adminPermissions?.includes(permission)
  ));
};

export const getAdminHomePath = (user) => {
  if (hasSuperAdminRole(user) || user?.adminPermissions?.includes("dashboard.read")) return "/admin/dashboard";
  const first = ADMIN_PERMISSION_CATALOG.find(({ key }) => user?.adminPermissions?.includes(key));
  const paths = {
    "listings.read": "/admin/listings",
    "listings.review": "/admin/listings/pending",
    "listings.manage": "/admin/listings",
    "listings.delete": "/admin/listings",
    "landlords.read": "/admin/landlords",
    "landlord_onboarding.manage": "/admin/onboarding",
    "traffic.read": "/admin/traffic",
    "assisted_listings.manage": "/admin/landlords/assisted-listing",
    "kyc.review": "/admin/kyc",
    "inquiries.manage": "/admin/inquiries",
    "stays.manage": "/admin/stay-requests",
    "payments.read": "/admin/payments",
    "subscriptions.manage": "/admin/subscriptions",
    "support.manage": "/admin/support",
    "contacts.manage": "/admin/contact",
    "services.manage": "/admin/services/applications",
    "agents.manage": "/admin/agents",
    "listing_reports.manage": "/admin/listings/reports",
    "content.manage": "/admin/blogs",
    "app_content.manage": "/admin/app/updates"
  };
  return paths[first?.key] || "/login";
};
