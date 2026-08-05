import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiBriefcase,
  FiExternalLink,
  FiFileText,
  FiGrid,
  FiHelpCircle,
  FiHome,
  FiMapPin,
  FiSearch
} from "react-icons/fi";
import { landlordListPropertyUrl, portalLinks } from "../../../../config/portals";

const sections = [
  {
    title: "Property discovery",
    icon: FiHome,
    links: [
      { name: "Home", path: "/", description: "Search verified homes across Kenya" },
      { name: "All listings", path: "/listings", description: "Browse approved rental and sale listings" },
      { name: "Homes for rent", path: "/categories/rentals", description: "Available rental homes" },
      { name: "Homes for sale", path: "/categories/for-sale", description: "Properties listed for purchase" },
      { name: "Apartments", path: "/categories/apartments", description: "Apartment listings" },
      { name: "Bedsitters", path: "/categories/bedsitters", description: "Compact and affordable homes" }
    ]
  },
  {
    title: "Popular categories",
    icon: FiGrid,
    links: [
      { name: "Office spaces", path: "/categories/office", description: "Workspaces for teams and businesses" },
      { name: "Family homes", path: "/categories/family", description: "Larger homes for family living" },
      { name: "Luxury rentals", path: "/categories/luxury", description: "Premium rentals and homes" },
      { name: "Maisonettes", path: "/categories/maisonettes", description: "Spacious maisonette listings" },
      { name: "Villas", path: "/categories/villas", description: "Villa listings" },
      { name: "Student-friendly homes", path: "/categories/student", description: "Budget-friendly rentals" }
    ]
  },
  {
    title: "Home services",
    icon: FiBriefcase,
    links: [
      { name: "Services marketplace", path: "/services", description: "Move-in support and home services" },
      { name: "Movers", path: "/services/movers", description: "Moving and relocation partners" },
      { name: "Cleaning companies", path: "/services/cleaning", description: "Move-in and move-out cleaning" },
      { name: "Handyman and repairs", path: "/services/handyman", description: "Repairs, fittings, and maintenance" },
      { name: "Furniture and appliances", path: "/services/furniture", description: "Furnishing and appliances" },
      { name: "Internet and WiFi", path: "/services/internet", description: "Connectivity providers" }
    ]
  },
  {
    title: "Company and help",
    icon: FiHelpCircle,
    links: [
      { name: "About RendaHomes", path: "/about", description: "Who we are and what we are building" },
      { name: "FAQs", path: "/faqs", description: "Common tenant and landlord questions" },
      { name: "Support", path: "/support", description: "Contact the RendaHomes team" },
      { name: "Pricing", path: "/pricing", description: "Landlord listing plans" },
      { name: "List your property", path: "/list-your-property", description: "Landlord onboarding and free listing offer" },
      { name: "Blog", path: "/blog", description: "Guides, updates, and property insights" },
      { name: "Partner application", path: "/services/apply", description: "Apply as a home service partner" }
    ]
  },
  {
    title: "Legal",
    icon: FiFileText,
    links: [
      { name: "Privacy Policy", path: "/privacy-policy", description: "How RendaHomes handles personal data" },
      { name: "Terms of Service", path: "/terms-of-service", description: "Terms for using the platform" },
      { name: "Sitemap", path: "/sitemap", description: "All major public pages" }
    ]
  },
  {
    title: "Portals",
    icon: FiExternalLink,
    links: [
      { name: "Landlord signup", href: landlordListPropertyUrl(), description: "Create a landlord account and add listings" },
      { name: "Landlord dashboard", href: portalLinks.landlord.href, description: "Manage listings, inquiries, and subscriptions" },
      { name: "User dashboard", href: portalLinks.user.href, description: "Manage saved homes, inquiries, support, and agent access" }
    ]
  }
];

const locationLinks = [
  ["Nairobi rentals", "/listings?county=Nairobi"],
  ["Kiambu rentals", "/listings?county=Kiambu"],
  ["Kajiado rentals", "/listings?county=Kajiado"],
  ["Machakos rentals", "/listings?county=Machakos"],
  ["Kilimani homes", "/listings?town=Kilimani"],
  ["Rongai homes", "/listings?town=Rongai"],
  ["Thika Road homes", "/listings?search=Thika"],
  ["Westlands homes", "/listings?town=Westlands"]
];

export default function Sitemap() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#F6FAF8]">
      <section className="border-b border-[#DDEBE4] bg-[#013E43] text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 lg:px-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/10">
            <FiGrid className="text-2xl text-[#02BB31]" />
          </div>
          <p className="mt-5 text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">Site navigation</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">RendaHomes sitemap</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#CFE7DC]">
            Find the most important public pages for homes, rentals, landlord pricing, service partners, help, and RendaHomes policies.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.title} className="overflow-hidden rounded-2xl border border-[#DDEBE4] bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-[#DDEBE4] px-5 py-4">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E7F8EE] text-[#013E43]">
                    <Icon />
                  </span>
                  <h2 className="text-lg font-extrabold text-[#013E43]">{section.title}</h2>
                </div>
                <ul className="divide-y divide-[#EEF4F1]">
                  {section.links.map((link) => (
                    <li key={link.path || link.href}>
                      <SmartLink link={link} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <section className="mt-8 rounded-2xl border border-[#DDEBE4] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E7F8EE] text-[#013E43]">
              <FiMapPin />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-[#013E43]">Popular searches</h2>
              <p className="text-sm font-semibold text-[#065A57]">Quick location paths for renters and buyers.</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {locationLinks.map(([label, path]) => (
              <Link key={path} to={path} className="rounded-full border border-[#DDEBE4] px-4 py-2 text-sm font-bold text-[#065A57] transition hover:border-[#02BB31] hover:text-[#013E43]">
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-[#013E43] p-6 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10">
                <FiSearch className="text-xl text-[#02BB31]" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold">Start with property search</h2>
                <p className="mt-1 text-sm text-[#CFE7DC]">The fastest path is searching by county, town, budget, property type, and bedrooms.</p>
              </div>
            </div>
            <Link to="/listings" className="rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[#013E43]">
              Browse listings
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function SmartLink({ link }) {
  const content = (
    <>
      <div>
        <span className="font-extrabold text-[#013E43]">{link.name}</span>
        <p className="mt-1 text-xs font-semibold leading-5 text-[#065A57]">{link.description}</p>
      </div>
      {link.href ? <FiExternalLink className="shrink-0 text-[#02BB31]" /> : null}
    </>
  );

  const className = "flex items-start justify-between gap-4 px-5 py-4 transition hover:bg-[#F6FAF8]";

  if (link.href) {
    return (
      <a href={link.href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link to={link.path} className={className}>
      {content}
    </Link>
  );
}
