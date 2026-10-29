import { useState } from "react";
import { Link } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
import { FiArrowRight, FiCheck, FiCheckCircle, FiHome, FiLayers, FiShield, FiUsers } from "react-icons/fi";
import WhatsAppListingWalkthrough from "../components/WhatsAppListingWalkthrough";
import { landlordListPropertyUrl, portalLinks } from "../config/portals";
import { useSeo } from "../utils/seo";

const whatsappUrl =
  "https://wa.me/254738388000?text=Hello%20RendaHomes%2C%20I%20want%20help%20listing%20my%20property.";

const assurances = [
  { icon: FiHome, title: "Two active listings free", text: "Start listing without a subscription." },
  { icon: FiShield, title: "Reviewed before publishing", text: "Listings are checked before they appear publicly." },
  { icon: FiUsers, title: "Talk to interested tenants", text: "Keep control of calls, inquiries, and viewings." }
];

const packages = [
  {
    key: "normal",
    name: "Free",
    price: 0,
    limit: 2,
    detail: "For an individual landlord starting with one or two properties.",
    benefits: [
      "Publish up to 2 active listings",
      "Create and manage listings in your landlord dashboard",
      "Receive tenant inquiries for your properties",
      "Update listing details and availability",
      "Listings reviewed before they go public",
      "Property pages discoverable on RendaHomes"
    ],
    featured: false
  },
  {
    key: "basic",
    name: "Basic",
    price: 500,
    limit: 7,
    detail: "For growing property owners managing several listings.",
    benefits: [
      "Publish up to 7 active listings",
      "Create and manage listings in your landlord dashboard",
      "Receive tenant inquiries for your properties",
      "Update listing details and availability",
      "Listings reviewed before they go public",
      "Property pages discoverable on RendaHomes"
    ],
    featured: false
  },
  {
    key: "premium",
    name: "Premium",
    price: 1500,
    limit: 15,
    detail: "For active property owners managing 8 to 15 listings.",
    benefits: [
      "Publish up to 15 active listings",
      "Eligible listings can appear in featured discovery",
      "Create and manage listings in your landlord dashboard",
      "Receive and manage tenant inquiries",
      "Update listing details and availability",
      "Listings reviewed before they go public",
      "WhatsApp listing intake for property details, photos, and location (planned)",
      "WhatsApp updates for review progress and your published listing link (planned)",
      "Opt-in WhatsApp alerts for inquiries, viewing requests, and follow-ups (planned)"
    ],
    featured: true
  },
  {
    key: "pro",
    name: "Pro",
    price: 2500,
    limit: 50,
    detail: "For real-estate companies and property owners managing larger portfolios.",
    inherits: "All Premium benefits, plus:",
    benefits: [
      "Expanded capacity for up to 50 active listings",
      "WhatsApp intake for multiple properties and building categories (planned)",
      "Coordinated onboarding for a company property portfolio",
      "Guided onboarding for company portfolios"
    ],
    note: "A dedicated company/team dashboard and automated WhatChimp workflows are still being developed.",
    featured: false
  }
];

export default function ListYourProperty() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [expandedPlans, setExpandedPlans] = useState({});
  const landlordUrl = landlordListPropertyUrl();

  useSeo({
    title: "List Your Property Free in Kenya",
    description:
      "List two properties free on RendaHomes. Get WhatsApp guidance, publish through your landlord account, and receive direct tenant inquiries.",
    path: "/list-your-property",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "RendaHomes landlord listing",
      areaServed: "Kenya",
      provider: {
        "@type": "Organization",
        name: "RendaHomes",
        url: "https://rendahomes.com"
      },
      description:
        "Property listing service for Kenyan landlords to publish rentals, homes for sale, apartments, bedsitters, and office spaces."
    }
  });

  return (
    <main className="bg-white">
      <section className="relative isolate overflow-hidden bg-[#013E43] text-white">
        <img
          src="/assets/hero-home.jpg"
          alt="Bright furnished apartment living room"
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[#012E31]/75" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(1,35,38,0.94)_0%,rgba(1,49,51,0.76)_55%,rgba(1,62,67,0.45)_100%)]" />

        <div className="relative mx-auto grid min-h-[520px] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.62fr] lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-sm font-bold text-[#B6F2C2]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#65D87A]" />
              For Kenyan landlords
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Your property. Your listing. Your next tenant.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">
              Share your property details with our team on WhatsApp. We will guide you through creating your account and publishing your listing.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#078A45] px-6 text-sm font-bold text-white transition hover:bg-[#087341] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <FaWhatsapp aria-hidden="true" className="text-lg" />
                Get help on WhatsApp
              </a>
              <a
                href={landlordUrl}
                title={portalLinks.landlord.purpose}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/60 bg-white/10 px-6 text-sm font-bold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Create landlord account <FiArrowRight aria-hidden="true" />
              </a>
            </div>
            <p className="mt-5 text-sm font-semibold text-white/80">Two active listings are free to start.</p>
          </div>

          <div className="hidden justify-self-end lg:block">
            <p className="max-w-xs border-l-2 border-[#65D87A] pl-5 text-lg font-semibold leading-7 text-white">
              Reach property seekers online while staying in control of every conversation.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-[#DDEBE4] bg-[#F6FAF8]">
        <div className="mx-auto grid max-w-7xl divide-y divide-[#DDEBE4] px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
          {assurances.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3 py-5 sm:px-5 lg:py-6">
              <Icon aria-hidden="true" className="mt-0.5 shrink-0 text-xl text-[#0D915C]" />
              <div>
                <h2 className="text-sm font-bold text-[#013E43]">{title}</h2>
                <p className="mt-1 text-sm leading-5 text-[#536C61]">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14 lg:px-8 lg:py-20">
        <div>
          <p className="text-sm font-bold text-[#0D915C]">WhatsApp-assisted listing</p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-[#013E43] sm:text-4xl">
            Start with a message. Finish when you are ready.
          </h2>
          <p className="mt-4 text-base leading-7 text-[#536C61]">
            WhatsApp is the easy first step. Our team helps you prepare, then you add and manage the property in your landlord account. Once reviewed and approved, it can be found on the website and app.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#078A45] px-5 text-sm font-bold text-white transition hover:bg-[#087341] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#078A45]"
          >
            <FaWhatsapp aria-hidden="true" className="text-lg" />
            Message RendaHomes
          </a>
          <p className="mt-3 text-xs leading-5 text-[#647C75]">Your account and listing are completed in the landlord portal.</p>
        </div>

        <WhatsAppListingWalkthrough whatsappUrl={whatsappUrl} landlordUrl={landlordUrl} />
      </section>

      <section className="border-y border-[#DDEBE4] bg-[#F6FAF8]" aria-labelledby="listing-packages-title">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
          <div className="max-w-2xl">
            <p className="text-sm font-bold text-[#0D915C]">Simple listing packages</p>
            <h2 id="listing-packages-title" className="mt-2 text-3xl font-extrabold leading-tight text-[#013E43] sm:text-4xl">
              Start with the space you have.
            </h2>
            <p className="mt-3 text-base leading-7 text-[#536C61]">
              Choose a plan for your active property listings. You can change plans later from your landlord dashboard. Planned WhatsApp listing and notification features are for Premium and Pro.
            </p>
          </div>

          <div className="mt-8 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {packages.map((plan) => (
              <article
                key={plan.key}
                className={`flex h-full min-h-[430px] flex-col border p-5 ${plan.featured ? "border-[#0D915C] bg-[#EAF6EF] shadow-md" : "border-[#DDEBE4] bg-white"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#013E43]">{plan.name}</h3>
                    <p className="mt-2 min-h-10 text-sm leading-5 text-[#647C75]">{plan.detail}</p>
                  </div>
                  {plan.featured && <span className="shrink-0 text-xs font-bold text-[#0D915C]">POPULAR</span>}
                </div>
                <p className="mt-4 text-3xl font-extrabold text-[#013E43]">
                  {plan.price === 0 ? "Free" : `KES ${plan.price.toLocaleString()}`}
                  {plan.price > 0 && <span className="ml-1 text-sm font-medium text-[#647C75]">/ month</span>}
                </p>
                {plan.inherits && <p className="mt-4 border-t border-[#E6EFEA] pt-4 text-sm font-semibold text-[#24443A]">{plan.inherits}</p>}
                <ul className={`${plan.inherits ? "mt-2" : "mt-4 border-t border-[#E6EFEA] pt-4"} space-y-2 text-sm leading-5 text-[#24443A]`}>
                  {plan.benefits.slice(0, expandedPlans[plan.key] ? plan.benefits.length : 5).map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2">
                      <FiCheck aria-hidden="true" className="mt-0.5 shrink-0 text-[#0D915C]" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                {plan.benefits.length > 5 && (
                  <button
                    type="button"
                    aria-expanded={Boolean(expandedPlans[plan.key])}
                    onClick={() => setExpandedPlans((current) => ({ ...current, [plan.key]: !current[plan.key] }))}
                    className="mt-3 self-start text-sm font-semibold text-[#0D915C] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D915C]"
                  >
                    {expandedPlans[plan.key] ? "View less" : "View more"}
                  </button>
                )}
                {plan.note && <p className="mt-3 text-xs leading-5 text-[#647C75]">{plan.note}</p>}
                <a
                  href={`${portalLinks.landlord.href.replace(/\/$/, "")}/register?plan=${plan.key}`}
                  className={`mt-auto inline-flex min-h-10 items-center justify-center gap-2 pt-5 text-sm font-semibold ${plan.featured ? "text-[#0D915C]" : "text-[#013E43]"}`}
                >
                  {plan.price === 0 ? "Start for free" : "Choose plan"}
                  <FiArrowRight aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-4 border border-[#CFE2D8] bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-3">
              <FiLayers aria-hidden="true" className="mt-1 shrink-0 text-xl text-[#0D915C]" />
              <div>
                <h3 className="font-bold text-[#013E43]">Managing an apartment block or many properties?</h3>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-[#536C61]">
                  Talk to us about portfolio onboarding and grouped unit types. Multi-unit inventory tools are not part of the self-service plans yet; we’ll help you find the right way to present your property.
                </p>
              </div>
            </div>
            <a
              href={`${whatsappUrl}%20I%20manage%20an%20apartment%20block%20or%20property%20portfolio.`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 text-sm font-semibold text-[#078A45]"
            >
              <FaWhatsapp aria-hidden="true" className="text-lg" />
              Discuss your portfolio <FiArrowRight aria-hidden="true" />
            </a>
          </div>
          <p className="mt-4 text-xs leading-5 text-[#647C75]">Paid plans are billed monthly. Your package limit applies to active listings. Automated WhatChimp listing and notification workflows are planned for Premium and Pro, but are not live yet; current listing submission is completed in the landlord portal.</p>
        </div>
      </section>

      <section className="border-t border-[#DDEBE4] bg-[#F6FAF8]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-start gap-3">
            <FiCheckCircle aria-hidden="true" className="mt-1 shrink-0 text-xl text-[#0D915C]" />
            <p className="max-w-2xl text-sm leading-6 text-[#24443A]">
              You decide when a listing is ready. RendaHomes reviews it before it goes public, and tenant inquiries come directly to you.
            </p>
          </div>
          <Link to="/listings" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#013E43] hover:text-[#0D915C]">
            See homes on RendaHomes <FiArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
