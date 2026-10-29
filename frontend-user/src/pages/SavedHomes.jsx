import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiHeart, FiImage, FiMapPin, FiTrash2 } from "react-icons/fi";
import { portalLinks } from "../config/portals";
import { getSavedHomes, removeSavedHome, saveHome } from "../services/savedHomes.service";

export default function SavedHomes() {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState("");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const saveListingId = params.get("saveListing");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        if (saveListingId) await saveHome(saveListingId);
        const listings = await getSavedHomes();
        if (active) setSaved(listings);
        if (active && saveListingId) navigate("/saved", { replace: true });
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || "Could not load your saved homes.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [navigate, saveListingId]);

  const remove = async (listingId) => {
    setRemovingId(listingId);
    setError("");
    try {
      const nextSaved = await removeSavedHome(listingId);
      setSaved(nextSaved);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not remove this home. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#0D915C]">Saved homes</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#013E43]">Your shortlist</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#065A57]">Your saved homes are linked to your account and available wherever you sign in.</p>
        </div>
        <a href={portalLinks.main.href} className="inline-flex items-center rounded-lg bg-[#013E43] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005C57]">Browse homes</a>
      </div>

      {error ? <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}

      {loading ? (
        <div className="mt-8 flex h-48 items-center justify-center" role="status" aria-label="Loading saved homes">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#A8D8C1] border-t-[#0D915C]" />
        </div>
      ) : saved.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {saved.map((listing) => (
            <SavedCard key={listing._id} listing={listing} removing={removingId === listing._id} onRemove={() => remove(listing._id)} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-[#DDEAE3] bg-white px-6 py-12 text-center">
          <FiHeart className="mx-auto text-3xl text-[#0D915C]" />
          <p className="mt-3 text-lg font-extrabold text-[#013E43]">No saved homes yet</p>
          <p className="mt-1 text-sm text-[#61756C]">Save a listing while browsing and it will appear here.</p>
          <a href={portalLinks.main.href} className="mt-5 inline-flex rounded-lg bg-[#013E43] px-5 py-3 text-sm font-semibold text-white">Find a home</a>
        </div>
      )}
    </section>
  );
}

function SavedCard({ listing, removing, onRemove }) {
  const image = imageFor(listing);
  const location = [listing.area, listing.town, listing.county].filter(Boolean).join(", ") || "Location on request";
  const price = new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(Number(listing.price || 0));
  const priceLabel = listing.purpose === "short_stay" ? `${price}/night` : listing.purpose === "rent" ? `${price}/mo` : price;

  return (
    <article className="overflow-hidden rounded-xl border border-[#DDEAE3] bg-white">
      <a href={`${portalLinks.main.href}/listings/${listing._id}`} className="block">
        <div className="aspect-[1.5] bg-[#F0F7F4]">
          {image ? <img src={image} alt={listing.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[#61756C]"><FiImage /></div>}
        </div>
        <div className="p-4">
          <p className="text-lg font-bold text-[#013E43]">{priceLabel}</p>
          <h2 className="mt-1 truncate font-semibold text-[#183B32]" title={listing.title}>{listing.title}</h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-[#61756C]"><FiMapPin className="shrink-0 text-[#0D915C]" />{location}</p>
        </div>
      </a>
      <div className="flex items-center justify-between border-t border-[#E7EEE9] px-4 py-3">
        <span className="text-xs font-medium capitalize text-[#61756C]">{listing.type || listing.purpose}</span>
        <button type="button" onClick={onRemove} disabled={removing} aria-label={`Remove ${listing.title} from saved homes`} title="Remove saved home" className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-[#9B3027] hover:bg-red-50 disabled:opacity-50">
          <FiTrash2 aria-hidden="true" />{removing ? "Removing..." : "Remove"}
        </button>
      </div>
    </article>
  );
}

function imageFor(listing) {
  const first = listing?.images?.[0];
  if (!first) return null;
  if (typeof first === "string") return first;
  return first.url || first.path || null;
}
