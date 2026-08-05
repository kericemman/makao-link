import { Link } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiHome } from "react-icons/fi";
import { landlordListPropertyUrl, portalLinks } from "../config/portals";
import { useSeo } from "../utils/seo";

const pageContent = {
  about: {
    eyebrow: "About RendaHomes",
    title: "Find verified homes faster across Kenya.",
    intro:
      "RendaHomes is built for one job first: helping renters and buyers discover real properties with clear details, useful filters, and direct landlord contact.",
    points: [
      "Browse rentals, apartments, bedsitters, offices, and homes for sale from one clean listing platform.",
      "Search by county, town, budget, bedrooms, bathrooms, purpose, and property type.",
      "Call landlords directly or send an inquiry and manage the conversation from your user account.",
      "Use move-in services for movers, cleaning, repairs, furniture, and internet after finding a home."
    ]
  },
  faqs: {
    eyebrow: "Questions",
    title: "Frequently asked questions.",
    intro:
      "Quick answers for tenants, landlords, agents, and service partners using RendaHomes.",
    points: [
      "You can browse listings without an account. Create an account when you want to save homes or manage inquiries.",
      "Use filters on the listings page to narrow homes by location, price, bedrooms, bathrooms, and property type.",
      "Landlords can list two properties for free, then upgrade from the landlord dashboard when they need more active listings.",
      "Every submitted listing is reviewed before it appears publicly on RendaHomes."
    ]
  },
  pricing: {
    eyebrow: "Landlord pricing",
    title: "Start free, then upgrade when your portfolio grows.",
    intro:
      "Landlords can publish up to two properties for free. Paid plans unlock more listings and stronger visibility.",
    points: [
      "Create a landlord account and publish your first two properties for free.",
      "Upgrade only when your listing limit is full or your portfolio needs more active properties.",
      "Manage plans, listing status, property images, inquiries, and support from the landlord dashboard.",
      "Paid landlords can complete KYC verification to strengthen trust with admin and renters."
    ]
  }
};

export default function PublicInfo({ type = "about" }) {
  const content = pageContent[type] || pageContent.about;
  const pagePath = type === "about" ? "/about" : type === "faqs" ? "/faqs" : "/pricing";

  useSeo({
    title: content.title,
    description: content.intro,
    path: pagePath
  });

  return (
    <main className="bg-[#F6FAF8]">
      <section className="border-b border-[#DDEBE4] bg-[#013E43] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">{content.eyebrow}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">{content.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#CFE7DC]">{content.intro}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
            <p className="text-sm font-bold text-[#CFE7DC]">Start here</p>
            <div className="mt-4 grid gap-2">
              <LinkButton to="/listings" label="Find a home" icon={FiHome} />
              <a href={landlordListPropertyUrl()} className="inline-flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-[#013E43]">
                List your property <FiArrowRight />
              </a>
              <a href={portalLinks.user.href} className="inline-flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm font-extrabold text-white">
                User dashboard <FiArrowRight />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          {content.points.map((point) => (
            <div key={point} className="rounded-2xl border border-[#DDEBE4] bg-white p-5 shadow-sm">
              <FiCheckCircle className="text-xl text-[#02BB31]" />
              <p className="mt-3 text-sm font-semibold leading-6 text-[#065A57]">{point}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function LinkButton({ to, label, icon: Icon }) {
  return (
    <Link to={to} className="inline-flex items-center justify-between rounded-xl bg-[#02BB31] px-4 py-3 text-sm font-extrabold text-white">
      <span className="inline-flex items-center gap-2"><Icon /> {label}</span>
      <FiArrowRight />
    </Link>
  );
}
