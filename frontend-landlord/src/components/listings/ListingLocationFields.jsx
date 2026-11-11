import { FiCrosshair, FiMapPin, FiNavigation } from "react-icons/fi";

export default function ListingLocationFields({ formData, onChange, onUseCurrentLocation, loading, metaLoading, mapSrc, mapLatitude, mapLongitude }) {
  return (
    <>
      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium text-[#0F172A]">Specific Area / Landmark (Optional)</label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><FiMapPin className="h-5 w-5 text-[#0D915C]" /></div>
          <input name="area" value={formData.area} onChange={onChange} placeholder="e.g., Next to Garden City Mall" className="w-full rounded-lg border-2 border-[#E2E8F0] py-3 pl-10 pr-4 outline-none transition-colors focus:border-[#126542]" disabled={loading || metaLoading} />
        </div>
        <p className="mt-1 text-xs text-[#475569]">Optional: Add specific directions or landmark</p>
      </div>
      <div className="md:col-span-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><label className="block text-sm font-medium text-[#0F172A]">Map Location (Optional)</label><p className="mt-1 text-xs text-[#475569]">Add coordinates so tenants can understand the property area better.</p></div>
          <button type="button" onClick={onUseCurrentLocation} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#164E3B]"><FiCrosshair />Use my location</button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-[#475569]">Latitude<input name="latitude" type="number" step="any" min="-90" max="90" value={formData.latitude} onChange={onChange} placeholder="-1.286389" className="mt-1 w-full rounded-lg border-2 border-[#E2E8F0] bg-white px-4 py-3 outline-none transition-colors focus:border-[#126542]" disabled={loading || metaLoading} /></label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[#475569]">Longitude<input name="longitude" type="number" step="any" min="-180" max="180" value={formData.longitude} onChange={onChange} placeholder="36.817223" className="mt-1 w-full rounded-lg border-2 border-[#E2E8F0] bg-white px-4 py-3 outline-none transition-colors focus:border-[#126542]" disabled={loading || metaLoading} /></label>
        </div>
        <div className="mt-4">
          <label htmlFor="googleMapsUrl" className="block text-xs font-semibold uppercase tracking-wide text-[#475569]">Google Maps link (optional)</label>
          <input id="googleMapsUrl" name="googleMapsUrl" type="url" inputMode="url" value={formData.googleMapsUrl} onChange={onChange} placeholder="https://maps.app.goo.gl/..." className="mt-1 w-full rounded-lg border-2 border-[#E2E8F0] bg-white px-4 py-3 outline-none transition-colors focus:border-[#126542]" disabled={loading || metaLoading} />
          <p className="mt-1 text-xs text-[#475569]">Paste a Google Maps share link so viewers can open the location.</p>
        </div>
        <div className="mt-4 overflow-hidden rounded-md border border-[#E2E8F0] bg-white"><iframe title="Property map preview" src={mapSrc} className="h-72 w-full" loading="lazy" /></div>
        <a href={`https://www.openstreetmap.org/?mlat=${mapLatitude}&mlon=${mapLongitude}#map=16/${mapLatitude}/${mapLongitude}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#475569] hover:text-[#0F172A]"><FiNavigation />Open map in new tab</a>
      </div>
    </>
  );
}
