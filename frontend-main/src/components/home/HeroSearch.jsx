import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiArrowUpRight, FiMapPin, FiSearch } from "react-icons/fi";
import { landlordListPropertyUrl, mainRoutes, portalLinks } from "../../config/portals";
import HeroListingShowcase from "./HeroListingShowcase";

const quickLocations = ["Nairobi", "Nakuru", "Eldoret"];

const getListingImage = (listing) => {
  const image = listing?.images?.[0];
  if (typeof image === "string") return image;
  return image?.url || image?.path || null;
};

export default function HeroSearch({ listings = [] }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [purpose, setPurpose] = useState("rent");
  const [type, setType] = useState("");
  const [guests, setGuests] = useState("");
  const [selectedListingId, setSelectedListingId] = useState(null);

  const selectedListing = useMemo(
    () => listings.find((listing) => listing._id === selectedListingId) || listings[0],
    [listings, selectedListingId]
  );
  const heroImage = getListingImage(selectedListing) || "/assets/hero-home.jpg";

  const submitSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (purpose) params.set("purpose", purpose);
    if (type) params.set("type", type);
    if (purpose === "short_stay" && guests) params.set("guests", guests);
    navigate(`${mainRoutes.listings}?${params.toString()}`);
  };

  const goToLocation = (location) => {
    const params = new URLSearchParams({ search: location, purpose });
    if (purpose === "short_stay" && guests) params.set("guests", guests);
    navigate(`${mainRoutes.listings}?${params.toString()}`);
  };

  return (
    <section className="relative isolate overflow-hidden border-b border-[#A8D8C1] bg-[#013E43]">
      <div
        aria-hidden="true"
        className="absolute inset-0 scale-[1.02] bg-cover bg-center transition-[background-image] duration-700"
        style={{ backgroundImage: `url("${heroImage}")` }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[#013E43]/80" />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(1,35,38,0.94)_0%,rgba(1,49,51,0.82)_48%,rgba(1,62,67,0.66)_100%)]" />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,rgba(1,35,38,0.3),transparent_45%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-10">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8BEE9C]" />
              Property search across Kenya
            </div>

            <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-[3.75rem]">
              Find a place that feels like yours.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/85 sm:text-base">
              Explore homes for rent, sale, and short stays, with clear details and direct landlord contact.
            </p>

            <form onSubmit={submitSearch} className="mt-6 rounded-2xl border border-white/70 bg-white p-2 shadow-[0_22px_60px_rgba(0,0,0,0.22)]">
              <div className={`grid gap-2 sm:grid-cols-[minmax(0,1fr)_110px] ${purpose === "short_stay" ? "lg:grid-cols-[minmax(0,1fr)_105px_130px_105px_auto]" : "lg:grid-cols-[minmax(0,1fr)_105px_130px_auto]"}`}>
                <label className="relative block sm:col-span-2 lg:col-span-1">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#02BB31]" />
                  <input
                    aria-label="Search location or property"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search county, town, estate, or keyword"
                    className="h-12 w-full rounded-xl border border-[#D6E8DF] bg-white pl-11 pr-4 text-sm font-semibold text-[#013E43] outline-none transition placeholder:font-medium placeholder:text-[#667C75] focus:border-[#0D915C] focus:ring-2 focus:ring-[#0D915C]/20"
                  />
                </label>
                <select
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                  aria-label="Listing purpose"
                  className="h-12 rounded-xl border border-[#D6E8DF] bg-white px-3 text-sm font-bold text-[#013E43] outline-none transition focus:border-[#0D915C] focus:ring-2 focus:ring-[#0D915C]/20"
                >
                  <option value="rent">Rent</option>
                  <option value="sale">Buy</option>
                  <option value="short_stay">BnB / Short stay</option>
                </select>
                {purpose === "short_stay" && (
                  <select
                    value={guests}
                    onChange={(event) => setGuests(event.target.value)}
                    aria-label="Number of guests"
                    className="h-12 rounded-xl border border-[#D6E8DF] bg-white px-3 text-sm font-bold text-[#013E43] outline-none focus:border-[#0D915C] focus:ring-2 focus:ring-[#0D915C]/20"
                  >
                    <option value="">Any guests</option>
                    {[1, 2, 3, 4, 5, 6, 8].map((count) => <option key={count} value={count}>{count === 8 ? "8+ guests" : `${count} guest${count === 1 ? "" : "s"}`}</option>)}
                  </select>
                )}
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  aria-label="Property type"
                  className="h-12 rounded-xl border border-[#D6E8DF] bg-white px-3 text-sm font-bold text-[#013E43] outline-none transition focus:border-[#0D915C] focus:ring-2 focus:ring-[#0D915C]/20"
                >
                  <option value="">Any type</option>
                  <option value="apartment">Apartment</option>
                  <option value="bedsitter">Bedsitter</option>
                  <option value="maisonette">Maisonette</option>
                  <option value="office">Office</option>
                </select>
                <button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#058A46] px-5 text-sm font-extrabold text-white transition hover:bg-[#006F3B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#058A46]">
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/10 px-3 py-1.5 text-xs font-bold text-white transition hover:border-white/60 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <FiMapPin />
                  {location}
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold">
              <Link to={mainRoutes.listings} className="inline-flex items-center gap-1 text-white transition hover:text-[#B6F2C2]">
                Browse listings <FiArrowRight />
              </Link>
              <a href={landlordListPropertyUrl()} title={portalLinks.landlord.purpose} className="inline-flex items-center gap-1 text-white/80 transition hover:text-white">
                List property <FiArrowUpRight />
              </a>
            </div>
          </div>

          <div className="min-w-0">
            <HeroListingShowcase listings={listings} selectedListingId={selectedListing?._id} onSelectListing={setSelectedListingId} />
          </div>
        </div>

      </div>
    </section>
  );
}
