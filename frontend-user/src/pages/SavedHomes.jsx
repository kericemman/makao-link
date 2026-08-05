import { FiHeart, FiImage, FiMapPin } from "react-icons/fi";
import { portalLinks } from "../config/portals";

export default function SavedHomes() {
  const saved = getSaved();

  return (
    <section className="rounded-[1.5rem] border border-[#A8D8C1] bg-white p-6">
      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">Saved homes</p>
      <h1 className="mt-2 text-3xl font-extrabold text-[#013E43]">Your shortlist</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#065A57]">
        Saved homes are kept on this device for now. Browse the main listing platform to continue discovering properties.
      </p>

      {saved.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {saved.map((listing) => (
            <SavedCard key={typeof listing === "string" ? listing : listing._id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl bg-[#F0F7F4] p-6 text-center">
          <FiHeart className="mx-auto text-3xl text-[#02BB31]" />
          <p className="mt-3 text-lg font-extrabold text-[#013E43]">No saved homes yet</p>
          <a href={portalLinks.main.href} className="mt-4 inline-flex rounded-full bg-[#013E43] px-5 py-3 text-sm font-extrabold text-white">Browse homes</a>
        </div>
      )}
    </section>
  );
}

function getSaved() {
  try {
    return JSON.parse(localStorage.getItem("renda_saved_listings") || "[]");
  } catch {
    return [];
  }
}

function SavedCard({ listing }) {
  if (typeof listing === "string") {
    return (
      <a href={`${portalLinks.main.href}/listings/${listing}`} className="rounded-2xl border border-[#A8D8C1] bg-white p-5 transition hover:border-[#02BB31]">
        <p className="font-extrabold text-[#013E43]">Saved listing</p>
        <p className="mt-1 text-sm font-semibold text-[#065A57]">Open this listing on the main website.</p>
      </a>
    );
  }

  const image = imageFor(listing);
  const location = [listing.area, listing.town, listing.county].filter(Boolean).join(", ") || listing.location || "Location on request";

  return (
    <a href={`${portalLinks.main.href}/listings/${listing._id}`} className="overflow-hidden rounded-2xl border border-[#A8D8C1] bg-white transition hover:border-[#02BB31]">
      <div className="aspect-[1.35] bg-[#F0F7F4]">
        {image ? (
          <img src={image} alt={listing.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[#065A57]">
            <FiImage />
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="font-extrabold text-[#013E43]">{listing.title || "Saved listing"}</p>
        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#065A57]">
          <FiMapPin className="text-[#02BB31]" />
          {location}
        </p>
      </div>
    </a>
  );
}

function imageFor(listing) {
  const first = listing?.images?.[0];
  if (!first) return null;
  if (typeof first === "string") return first;
  return first.url || first.path || null;
}
