import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiArrowUpRight, FiMapPin, FiSearch } from "react-icons/fi";
import { listingCategories } from "../../config/listingCategories";
import { landlordListPropertyUrl, mainRoutes, portalLinks } from "../../config/portals";
import HeroListingShowcase from "./HeroListingShowcase";
import HeroStats from "./HeroStats";

const quickLocations = ["Nairobi", "Nakuru", "Eldoret"];
const quickCategories = listingCategories.slice(0, 5);

export default function HeroSearch({ listings = [] }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [purpose, setPurpose] = useState("rent");
  const [type, setType] = useState("");

  const submitSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (purpose) params.set("purpose", purpose);
    if (type) params.set("type", type);
    navigate(`${mainRoutes.listings}?${params.toString()}`);
  };

  const goToLocation = (location) => {
    navigate(`${mainRoutes.listings}?search=${encodeURIComponent(location)}&purpose=${purpose}`);
  };

  return (
    <section className="relative overflow-hidden border-b border-[#A8D8C1] bg-[#F0F7F4]">
      <div className="absolute inset-0 bg-[#013E43]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,187,49,0.18),transparent_40%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
              
              Public property search
            </div>

            <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-[4rem]">
              Find the right home without the noise.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#A8D8C1] sm:text-base">
              Search approved rentals, homes for sale, and office spaces by county, town, type, and budget.
            </p>

            <form onSubmit={submitSearch} className="mt-6 rounded-[1.25rem] border border-[#A8D8C1] bg-white p-2 shadow-[0_24px_70px_rgba(1,62,67,0.22)]">
              <div className="grid gap-2 md:grid-cols-[1fr_118px_132px_auto]">
                <label className="relative block md:col-span-2 lg:col-span-1">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#02BB31]" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search county, town, estate, or keyword"
                    className="h-12 w-full rounded-xl border border-[#A8D8C1] bg-white pl-11 pr-4 text-sm font-semibold text-[#013E43] outline-none transition focus:border-[#013E43] focus:ring-4 focus:ring-[#F0F7F4]"
                  />
                </label>
                <select
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                  className="h-12 rounded-xl border border-[#A8D8C1] bg-white px-3 text-sm font-bold text-[#013E43] outline-none transition focus:border-[#013E43] focus:ring-4 focus:ring-[#F0F7F4]"
                >
                  <option value="rent">Rent</option>
                  <option value="sale">Buy</option>
                </select>
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="h-12 rounded-xl border border-[#A8D8C1] bg-white px-3 text-sm font-bold text-[#013E43] outline-none transition focus:border-[#013E43] focus:ring-4 focus:ring-[#F0F7F4]"
                >
                  <option value="">Any type</option>
                  <option value="apartment">Apartment</option>
                  <option value="bedsitter">Bedsitter</option>
                  <option value="maisonette">Maisonette</option>
                  <option value="office">Office</option>
                </select>
                <button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#02BB31] px-5 text-sm font-extrabold text-white transition hover:bg-[#0D915C]">
                  Search
                  <FiArrowRight />
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {quickLocations.map((location) => (
                <button
                  key={location}
                  onClick={() => goToLocation(location)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/15 transition hover:bg-white/20"
                >
                  <FiMapPin />
                  {location}
                </button>
              ))}
            </div>

            {/* <div className="mt-5 flex flex-wrap gap-2">
              {quickCategories.map((category) => (
                <Link
                  key={category.slug}
                  to={`/categories/${category.slug}`}
                  className="rounded-full border border-[#A8D8C1]/30 bg-white/10 px-3 py-1.5 text-xs font-extrabold text-white backdrop-blur transition hover:bg-white/20"
                >
                  {category.title}
                </Link>
              ))}
            </div> */}

            {/* <div className="mt-5">
              <HeroStats />
            </div> */}

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold">
              <Link to={mainRoutes.listings} className="inline-flex items-center gap-1 text-white">
                Browse listings <FiArrowRight />
              </Link>
              <a href={landlordListPropertyUrl()} title={portalLinks.landlord.purpose} className="inline-flex items-center gap-1 text-[#A8D8C1] hover:text-white">
                List property <FiArrowUpRight />
              </a>
              <a href={portalLinks.user.href} title={portalLinks.user.purpose} className="inline-flex items-center gap-1 text-[#A8D8C1] hover:text-white">
                User portal <FiArrowUpRight />
              </a>
            </div>
          </div>

          <div className="min-w-0">
            <HeroListingShowcase listings={listings} />
          </div>
        </div>

      </div>
    </section>
  );
}
