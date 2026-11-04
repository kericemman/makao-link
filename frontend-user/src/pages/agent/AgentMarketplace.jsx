import { useEffect, useState } from "react";
import { FiArrowRight, FiMapPin, FiRefreshCw } from "react-icons/fi";
import { getAgentMarketplaceRequests, getAgentEligibleListings, submitAgentProposal } from "../../services/marketplace.service";

export default function AgentMarketplace() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingListings, setLoadingListings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accessMessage, setAccessMessage] = useState("");
  const [notice, setNotice] = useState(null);

  const loadRequests = async () => {
    setLoading(true);
    setAccessMessage("");
    try {
      const data = await getAgentMarketplaceRequests();
      setRequests(data.requests || []);
    } catch (error) {
      setRequests([]);
      setAccessMessage(error.response?.data?.message || "Agent marketplace is not available for this account.");
    } finally { setLoading(false); }
  };

  useEffect(() => { loadRequests(); }, []);

  const openRequest = async (request) => {
    setSelected(request);
    setListings([]);
    setSelectedListing("");
    setMessage("");
    if (request.proposalStatus) return;
    setLoadingListings(true);
    try {
      const data = await getAgentEligibleListings(request._id);
      setListings(data.listings || []);
    } catch (error) {
      setNotice({ type: "error", message: error.response?.data?.message || "Could not load authorized properties for this request." });
    } finally { setLoadingListings(false); }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!selected || !selectedListing) return;
    setSaving(true);
    try {
      await submitAgentProposal(selected._id, { listingId: selectedListing, message: message.trim() });
      setNotice({ type: "success", message: "Property suggestion sent to the customer." });
      await loadRequests();
      setSelected(null);
    } catch (error) {
      setNotice({ type: "error", message: error.response?.data?.message || "Could not send this suggestion." });
    } finally { setSaving(false); }
  };

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#DDEAE3] pb-5">
      <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#168557]">Customer requests</p><h2 className="mt-1 text-2xl font-bold text-[#123D38]">Property opportunities</h2><p className="mt-1 max-w-2xl text-sm text-slate-600">Review requests shared for agent suggestions and propose only an available property you are authorized to advertise.</p></div>
      <button type="button" onClick={loadRequests} aria-label="Refresh requests" title="Refresh requests" className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-white"><FiRefreshCw className={loading ? "animate-spin" : ""} /></button>
    </header>
    {notice && <p role="status" aria-live="polite" className={`border-y px-4 py-3 text-sm ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"}`}>{notice.message}</p>}
    {accessMessage && <p role="status" className="border-y border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{accessMessage}</p>}
    {loading ? <p className="py-12 text-center text-sm text-slate-500">Loading shared requests…</p> : !requests.length ? <div className="border-y border-slate-200 py-12 text-center"><p className="font-semibold text-slate-800">No requests available</p><p className="mt-1 text-sm text-slate-500">Requests appear here only when a customer allows agent suggestions in your service area.</p></div> : <div className="divide-y divide-slate-200 border-y border-slate-200 bg-white">
      {requests.map((request) => <article key={request._id} className="flex flex-wrap items-start justify-between gap-4 py-5">
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold capitalize text-slate-900">{request.purpose === "short_stay" ? "Short stay" : request.purpose}</h3><span className="rounded bg-slate-100 px-2 py-1 text-xs capitalize text-slate-600">{request.propertyTypes?.join(", ") || "Any property type"}</span></div><p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><FiMapPin />{request.preferredLocations?.map((location) => [location.town, location.county].filter(Boolean).join(", ")).join(" · ")}</p><p className="mt-1 text-sm text-slate-700">KES {Number(request.budgetMin || 0).toLocaleString()}–{Number(request.budgetMax).toLocaleString()} {request.pricePeriod} · {request.minBedrooms ?? "Any"}+ bedrooms{request.minBathrooms !== null ? ` · ${request.minBathrooms}+ bathrooms` : ""}</p><p className="mt-1 text-xs text-slate-500">Shared {new Date(request.createdAt).toLocaleDateString()}{request.moveInDate ? ` · Move-in ${new Date(request.moveInDate).toLocaleDateString()}` : ""}{request.guestCount ? ` · ${request.guestCount} guests` : ""}</p></div>
        <div className="flex items-center gap-3">{request.proposalStatus ? <span className="text-xs font-semibold capitalize text-slate-600">Suggestion {request.proposalStatus}</span> : <button type="button" onClick={() => openRequest(request)} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#123D38] px-3 text-sm font-semibold text-white">Suggest a property <FiArrowRight /></button>}</div>
      </article>)}
    </div>}

    {selected && <div role="dialog" aria-modal="true" aria-labelledby="proposal-title" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setSelected(null); }}>
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">{selected.preferredLocations?.map((location) => [location.town, location.county].filter(Boolean).join(", ")).join(" · ")}</p><h3 id="proposal-title" className="mt-1 text-xl font-bold text-slate-900">Choose an authorized property</h3></div><button type="button" disabled={saving} onClick={() => setSelected(null)} className="text-sm font-semibold text-slate-600">Close</button></div>
        {loadingListings ? <p className="py-10 text-center text-sm text-slate-500">Checking your authorized listings…</p> : !listings.length ? <p className="py-10 text-center text-sm text-slate-600">No available authorized listings match this request in your service area.</p> : <div className="divide-y divide-slate-200">{listings.map((listing) => <label key={listing._id} className="flex cursor-pointer items-start gap-3 py-4"><input type="radio" name="listing" value={listing._id} checked={selectedListing === listing._id} onChange={() => setSelectedListing(listing._id)} className="mt-1 accent-emerald-700" /><img src={listing.images?.[0] || ""} alt="" className="h-16 w-20 shrink-0 bg-slate-100 object-cover" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{listing.title}</span><span className="mt-1 block text-sm font-bold text-emerald-800">KES {Number(listing.price).toLocaleString()}</span><span className="text-xs text-slate-500">{listing.town}, {listing.county} · {listing.bedrooms ?? "-"} beds</span><span className="mt-1 block text-xs font-semibold capitalize text-slate-600">{listing.classification} fit</span></span></label>)}</div>}
        {listings.length > 0 && <><label className="mt-4 block text-xs font-semibold text-slate-700">Message to customer <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} rows={3} placeholder="Explain how this property fits their requirements" className="mt-1 w-full resize-y border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-700" /></label><div className="mt-4 flex justify-end"><button type="submit" disabled={saving || !selectedListing} className="min-h-10 rounded-md bg-[#123D38] px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Sending…" : "Send suggestion"}</button></div></>}
      </form>
    </div>}
  </div>;
}
