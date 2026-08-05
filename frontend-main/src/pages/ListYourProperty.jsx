import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiHelpCircle,
  FiHome,
  FiMessageSquare,
  FiPhone,
  FiShield,
  FiUpload,
  FiUsers
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { landlordListPropertyUrl, portalLinks } from "../config/portals";
import { useSeo } from "../utils/seo";

const whatsappUrl =
  "https://wa.me/254738388000?text=Hello%20RendaHomes%2C%20I%20want%20help%20listing%20my%20property.";

const benefits = [
  {
    icon: FiHome,
    title: "List 2 properties free",
    text: "Start without paying first. Add your first two active listings and see how tenant inquiries come in."
  },
  {
    icon: FiMessageSquare,
    title: "Receive direct tenant inquiries",
    text: "Interested tenants can call or send an inquiry so you stay in control of your property conversations."
  },
  {
    icon: FiShield,
    title: "Build trust with verification",
    text: "Approved listings show trust signals, and paid landlords can complete KYC for stronger credibility."
  },
  {
    icon: FiHelpCircle,
    title: "Get assisted onboarding",
    text: "If you are busy, send property details on WhatsApp and RendaHomes can guide you through setup."
  }
];

const steps = [
  "Create your landlord account",
  "Add property details, location, price, and photos",
  "RendaHomes reviews the listing before publishing",
  "Start receiving tenant calls and inquiries"
];

const trustPoints = [
  "Admin-reviewed listings before they appear publicly",
  "Availability and active status shown to users",
  "KYC review path for paid landlords",
  "Support tickets when you need help"
];

const whatsappChecklist = [
  "Property county, town, estate/area, and nearby landmark",
  "Rent or sale price, property type, bedrooms, and bathrooms",
  "Clear photos of rooms, outside, access, and amenities",
  "The phone number tenants should call"
];

export default function ListYourProperty() {
  const landlordUrl = landlordListPropertyUrl();

  useSeo({
    title: "List Your Property Free in Kenya",
    description:
      "Landlords can list two properties free on RendaHomes, receive direct tenant inquiries, and build trust through reviewed listings and KYC verification.",
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
    <main className="bg-[#F6FAF8]">
      <section className="border-b border-[#DDEBE4] bg-[#013E43] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8 lg:py-18">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">
              For Kenyan landlords
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              List your property free and reach serious tenants directly.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#CFE7DC]">
              RendaHomes helps landlords publish verified rentals, apartments, bedsitters, houses, and office spaces without handing control to random agents.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={landlordUrl}
                title={portalLinks.landlord.purpose}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#02BB31] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#0D915C]"
              >
                Start listing
                <FiArrowRight />
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-white/15"
              >
                <FaWhatsapp />
                Get WhatsApp help
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <HeroStat value="2" label="free active listings" />
              <HeroStat value="Direct" label="tenant inquiries" />
              <HeroStat value="Reviewed" label="before publishing" />
            </div>
          </div>

          <aside className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-2xl shadow-black/10">
            <p className="text-sm font-bold text-[#CFE7DC]">What you get</p>
            <div className="mt-4 space-y-3">
              {trustPoints.map((point) => (
                <div key={point} className="flex gap-3 rounded-xl bg-white/10 p-3">
                  <FiCheckCircle className="mt-0.5 shrink-0 text-[#02BB31]" />
                  <p className="text-sm font-semibold leading-6 text-white">{point}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article key={benefit.title} className="rounded-2xl border border-[#DDEBE4] bg-white p-5 shadow-sm">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#F0F7F4] text-[#0D915C]">
                  <Icon />
                </div>
                <h2 className="mt-4 text-lg font-extrabold text-[#013E43]">{benefit.title}</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-[#065A57]">{benefit.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-[#DDEBE4] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">Simple process</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#013E43]">
              Publish faster without losing control.
            </h2>
            <p className="mt-4 text-sm font-medium leading-7 text-[#065A57]">
              The landlord dashboard is built for property owners who want clean listing management, direct inquiries, and a clear upgrade path when the free limit is full.
            </p>
          </div>

          <div className="grid gap-3">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-4 rounded-2xl border border-[#DDEBE4] bg-[#F6FAF8] p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#013E43] text-sm font-extrabold text-white">
                  {index + 1}
                </span>
                <p className="text-sm font-extrabold text-[#013E43]">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          <MiniCard icon={FiUpload} title="Photos matter" text="Upload clear photos of the actual rooms, exterior, and access points to earn more serious inquiries." />
          <MiniCard icon={FiClock} title="Keep availability fresh" text="Mark listings taken or available from your dashboard so tenants do not chase stale homes." />
          <MiniCard icon={FiUsers} title="Agents can refer landlords" text="RendaHomes agents can onboard landlords through referral links and track performance from the user portal." />
        </div>
      </section>

      <section className="border-y border-[#DDEBE4] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">WhatsApp-assisted onboarding</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#013E43]">
              Busy landlord? Send the details and we guide you.
            </h2>
            <p className="mt-4 text-sm font-medium leading-7 text-[#065A57]">
              You do not have to figure out everything alone. RendaHomes can help you prepare the right listing details before publishing.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#02BB31] px-6 py-3 text-sm font-extrabold text-white"
            >
              <FaWhatsapp />
              Send property details
            </a>
          </div>

          <div className="rounded-2xl border border-[#DDEBE4] bg-[#F6FAF8] p-5">
            <p className="text-sm font-bold text-[#013E43]">What to send</p>
            <div className="mt-4 space-y-3">
              {whatsappChecklist.map((item) => (
                <div key={item} className="flex gap-3">
                  <FiCheckCircle className="mt-0.5 shrink-0 text-[#02BB31]" />
                  <p className="text-sm font-semibold leading-6 text-[#065A57]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#013E43] p-6 text-white sm:p-8 lg:flex lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">Ready to start?</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">List your first property today.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#CFE7DC]">
              Start with two free active listings. Upgrade later only when your portfolio needs more room.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <a href={landlordUrl} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#02BB31] px-6 py-3 text-sm font-extrabold text-white">
              Create landlord account
              <FiArrowRight />
            </a>
            <a href="tel:+254738388000" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-extrabold text-[#013E43]">
              <FiPhone />
              Call RendaHomes
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroStat({ value, label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="text-xl font-extrabold text-white">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#A8D8C1]">{label}</p>
    </div>
  );
}

function MiniCard({ icon: Icon, title, text }) {
  return (
    <article className="rounded-2xl border border-[#DDEBE4] bg-white p-5 shadow-sm">
      <Icon className="text-xl text-[#0D915C]" />
      <h3 className="mt-3 text-base font-extrabold text-[#013E43]">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-[#065A57]">{text}</p>
    </article>
  );
}
