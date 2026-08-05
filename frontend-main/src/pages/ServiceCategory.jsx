import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiGlobe, FiMail, FiMapPin, FiPhone, FiSearch } from "react-icons/fi";
import { FaBuilding, FaWhatsapp } from "react-icons/fa";
import LoadingScreen from "../components/common/LoadingScreen";
import { getPartnersByCategory, getServiceCategories } from "../services/services.service";
import { getApiErrorMessage } from "../utils/apiError";

const formatPhoneForWhatsApp = (phone = "") => phone.replace(/^0/, "254").replace(/[^\d]/g, "");

export default function ServiceCategory() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const { category } = useParams();
  const [categories, setCategories] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [categoryData, partnerData] = await Promise.all([
          getServiceCategories(),
          getPartnersByCategory(category)
        ]);
        setCategories(categoryData.categories || []);
        setPartners(partnerData.partners || []);
      } catch (err) {
        setError(getApiErrorMessage(err, "Could not load service providers."));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [category]);

  const activeCategory = categories.find((item) => item.key === category);
  const locations = [...new Set(partners.map((partner) => partner.location).filter(Boolean))];
  const filteredPartners = useMemo(() => {
    return partners.filter((partner) => {
      const term = search.toLowerCase();
      const matchesSearch =
        !term ||
        partner.companyName?.toLowerCase().includes(term) ||
        partner.description?.toLowerCase().includes(term) ||
        partner.contactPerson?.toLowerCase().includes(term);
      const matchesLocation = !location || partner.location === location;
      return matchesSearch && matchesLocation;
    });
  }, [partners, search, location]);

  if (!loading && !error && categories.length && !activeCategory) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <LoadingScreen label="Loading service providers" />;
  }

  return (
    <div className="bg-[#F0F7F4]">
      <section className="border-b border-[#A8D8C1] bg-[#013E43] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-extrabold text-[#A8D8C1] hover:text-white">
            <FiArrowLeft />
            Back home
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            {activeCategory?.label || "Service providers"}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#A8D8C1] sm:text-base">
            {activeCategory?.description || "Browse approved service partners and contact the one that fits your needs."}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-[1.25rem] border border-[#A8D8C1] bg-white p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <label className="relative block">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#02BB31]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search company, service, or contact"
                className="h-12 w-full rounded-xl border border-[#A8D8C1] pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#013E43] focus:ring-4 focus:ring-[#F0F7F4]"
              />
            </label>
            <select
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="h-12 rounded-xl border border-[#A8D8C1] px-3 text-sm font-bold text-[#013E43] outline-none focus:border-[#013E43] focus:ring-4 focus:ring-[#F0F7F4]"
            >
              <option value="">All locations</option>
              {locations.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <p className="mt-3 text-sm font-semibold text-[#065A57]">
            Showing {filteredPartners.length} of {partners.length} providers
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-[#065A57]">{error}</div>
        ) : filteredPartners.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredPartners.map((partner) => <ProviderCard key={partner._id} partner={partner} />)}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-[#02BB31] bg-white p-10 text-center">
            <h2 className="text-xl font-extrabold text-[#013E43]">No providers found</h2>
            <p className="mt-2 text-sm text-[#065A57]">Try a different search or location.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function ProviderCard({ partner }) {
  return (
    <article className="rounded-[1.35rem] border border-[#A8D8C1] bg-white p-5 shadow-[0_18px_45px_rgba(22,33,31,0.06)]">
      <div className="flex items-start gap-4">
        {partner.logo ? (
          <img src={partner.logo} alt={partner.companyName} className="h-16 w-16 rounded-2xl border border-[#A8D8C1] object-cover" />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#013E43] text-white">
            <FaBuilding />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="line-clamp-1 text-lg font-extrabold text-[#013E43]">{partner.companyName}</h2>
          <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#065A57]">
            <FiMapPin className="text-[#02BB31]" />
            {partner.location || "Location not specified"}
          </p>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#065A57]">{partner.description}</p>

      <div className="mt-4 space-y-2 text-sm text-[#065A57]">
        {partner.phone ? <p className="flex items-center gap-2"><FiPhone className="text-[#02BB31]" /> {partner.phone}</p> : null}
        {partner.email ? <p className="flex items-center gap-2 break-all"><FiMail className="text-[#02BB31]" /> {partner.email}</p> : null}
        {partner.website ? (
          <a href={partner.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 break-all text-[#013E43]">
            <FiGlobe className="text-[#02BB31]" /> {partner.website.replace(/^https?:\/\//, "")}
          </a>
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {partner.phone ? (
          <a href={`tel:${partner.phone}`} className="rounded-xl bg-[#013E43] px-4 py-3 text-center text-sm font-extrabold text-white">
            Call
          </a>
        ) : null}
        {partner.phone ? (
          <a
            href={`https://wa.me/${formatPhoneForWhatsApp(partner.phone)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#02BB31] px-4 py-3 text-sm font-extrabold text-white"
          >
            <FaWhatsapp /> WhatsApp
          </a>
        ) : null}
      </div>
    </article>
  );
}
