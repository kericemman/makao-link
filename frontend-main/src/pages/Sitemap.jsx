import { Link } from "react-router-dom";
import { joinPortalUrl, landlordListPropertyUrl, portalLinks } from "../config/portals";

const sections = [
  {
    title: "Find property",
    links: [
      ["Home", "/"],
      ["All listings", "/listings"],
      ["Rentals", "/categories/rentals"],
      ["For sale", "/categories/for-sale"],
      ["Apartments", "/categories/apartments"],
      ["Office spaces", "/categories/office"],
      ["Family homes", "/categories/family"],
      ["Luxury rentals", "/categories/luxury"]
    ]
  },
  {
    title: "Services",
    links: [
      ["Movers", "/services/movers"],
      ["Cleaning", "/services/cleaning"],
      ["Repairs", "/services/repairs"],
      ["Internet", "/services/internet"]
    ]
  },
  {
    title: "Company",
    links: [
      ["About", "/about"],
      ["List your property", "/list-your-property"],
      ["Blog", "/blog"],
      ["FAQs", "/faqs"],
      ["Support", "/support"],
      ["Pricing", "/pricing"]
    ]
  },
  {
    title: "Legal",
    links: [
      ["Privacy Policy", "/privacy-policy"],
      ["Terms of Service", "/terms-of-service"],
      ["Sitemap", "/sitemap"]
    ]
  }
];

export default function Sitemap() {
  return (
    <main className="bg-[#F6FAF8]">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">Sitemap</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#013E43]">Every useful RendaHomes route.</h1>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {sections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-[#DDEBE4] bg-white p-5 shadow-sm">
              <h2 className="font-extrabold text-[#013E43]">{section.title}</h2>
              <ul className="mt-4 space-y-2">
                {section.links.map(([label, href]) => (
                  <li key={href}>
                    <Link to={href} className="text-sm font-semibold text-[#065A57] hover:text-[#013E43]">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <ExternalCard label="List your property" href={landlordListPropertyUrl()} />
          <ExternalCard label="Landlord dashboard" href={portalLinks.landlord.href} />
          <ExternalCard label="User and agent dashboard" href={joinPortalUrl(portalLinks.user.href, "/login")} />
        </div>
      </section>
    </main>
  );
}

function ExternalCard({ label, href }) {
  return <a href={href} className="rounded-2xl border border-[#DDEBE4] bg-white p-5 text-sm font-extrabold text-[#013E43] shadow-sm hover:border-[#02BB31]">{label}</a>;
}
