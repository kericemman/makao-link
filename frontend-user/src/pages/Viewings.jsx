import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiCalendar, FiCheck, FiClock, FiMapPin, FiRefreshCw, FiX } from "react-icons/fi";
import { cancelViewing, getMyViewings, getPublicListing, proposeViewingTime, requestViewing, respondToViewingProposal } from "../services/marketplace.service";
import { getApiErrorMessage } from "../utils/apiError";

const localDateTime = (date) => {
  const value = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return value.toISOString().slice(0, 16);
};
const when = (value, timezone = "Africa/Nairobi") => new Date(value).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: timezone });

export default function Viewings() {
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get("listingId") || "";
  const propertyRequestId = searchParams.get("propertyRequestId") || "";
  const inquiryType = searchParams.get("inquiryType") || undefined;
  const inquiryId = searchParams.get("inquiryId") || undefined;
  const [listing, setListing] = useState(null);
  const [viewings, setViewings] = useState([]);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [message, setMessage] = useState("");
  const [shareConsent, setShareConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [rescheduleId, setRescheduleId] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await getMyViewings();
      setViewings(data.viewings || []);
      setError("");
    } catch (err) { setError(getApiErrorMessage(err, "Could not load your viewings.")); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!listingId) return;
    getPublicListing(listingId).then((data) => setListing(data.listing)).catch((err) => setError(getApiErrorMessage(err, "This property is not available for a viewing.")));
  }, [listingId]);
  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!listingId || !startAt || !endAt) return;
    setSubmitting(true); setError("");
    try {
      const key = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await requestViewing({ listingId, requestedStartAt: new Date(startAt).toISOString(), requestedEndAt: new Date(endAt).toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Nairobi", customerMessage: message, contactSharingConsent: shareConsent, ...(propertyRequestId ? { propertyRequestId } : {}), ...(inquiryType && inquiryId ? { inquiryType, inquiryId } : {}) }, key);
      setMessage(""); setShareConsent(false); setStartAt(""); setEndAt("");
      await load();
    } catch (err) { setError(getApiErrorMessage(err, "Could not request this viewing.")); }
    finally { setSubmitting(false); }
  };

  const updateViewing = async (id, action, payload = {}) => {
    setBusyId(id); setError("");
    try {
      if (action === "cancel") await cancelViewing(id, payload.reason);
      else if (action === "reschedule") await proposeViewingTime(id, payload);
      else await respondToViewingProposal(id);
      setRescheduleId("");
      await load();
    } catch (err) { setError(getApiErrorMessage(err, "Could not update this viewing.")); }
    finally { setBusyId(""); }
  };

  const statusTone = { requested: "bg-amber-50 text-amber-800", confirmed: "bg-emerald-50 text-emerald-800", reschedule_proposed: "bg-sky-50 text-sky-800", declined: "bg-rose-50 text-rose-800", cancelled: "bg-slate-100 text-slate-700", completed: "bg-slate-100 text-slate-700" };

  return <div className="space-y-7">
    <header className="border-b border-[#DDEAE3] pb-5"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#168557]">Appointments</p><h1 className="mt-1 text-2xl font-bold text-[#123D38]">My viewings</h1><p className="mt-1 text-sm text-slate-600">Your requested time is not confirmed until the advertiser accepts it.</p></header>
    {error && <p role="alert" className="rounded-md bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{error}</p>}

    {listingId && <section className="max-w-3xl border-b border-slate-200 pb-7">
      <h2 className="text-lg font-semibold text-slate-900">Request a viewing{listing?.title ? `: ${listing.title}` : ""}</h2>
      {listing && <p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><FiMapPin />{[listing.area, listing.town, listing.county].filter(Boolean).join(", ")}</p>}
      <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-700">Preferred start time<input required type="datetime-local" min={localDateTime(new Date())} value={startAt} onChange={(event) => setStartAt(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-900" /></label>
        <label className="text-xs font-semibold text-slate-700">Preferred end time<input required type="datetime-local" min={startAt || localDateTime(new Date())} value={endAt} onChange={(event) => setEndAt(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-900" /></label>
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Note for the advertiser<textarea maxLength={1200} value={message} onChange={(event) => setMessage(event.target.value)} rows={3} placeholder="Anything they should know before the viewing?" className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900" /></label>
        <label className="flex gap-2.5 text-sm text-slate-700 sm:col-span-2"><input required type="checkbox" checked={shareConsent} onChange={(event) => setShareConsent(event.target.checked)} className="mt-0.5 accent-emerald-700" /><span>I agree to share my account contact details with this property’s advertiser to arrange the viewing.</span></label>
        <button disabled={submitting} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#123D38] px-4 text-sm font-semibold text-white hover:bg-[#18574C] disabled:opacity-60 sm:col-span-2"><FiCalendar />{submitting ? "Sending request…" : "Request this viewing"}</button>
      </form>
    </section>}

    {!listingId && <div className="border-b border-slate-200 pb-6"><p className="text-sm text-slate-600">Request a viewing from a property page, or browse available homes.</p><a href={import.meta.env.VITE_MAIN_SITE_URL || "https://rendahomes.com"} className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#123D38] px-4 py-2.5 text-sm font-semibold text-white"><FiMapPin />Browse homes</a></div>}

    <section>
      <div className="mb-3 flex items-center justify-between"><div><h2 className="text-lg font-semibold text-slate-900">Your appointments</h2><p className="mt-1 text-sm text-slate-500">Times are displayed in the time zone used when you requested them.</p></div><button type="button" onClick={load} title="Refresh viewings" aria-label="Refresh viewings" className="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:bg-slate-100"><FiRefreshCw /></button></div>
      {loading ? <p className="py-12 text-center text-sm text-slate-500">Loading viewings…</p> : !viewings.length ? <p className="border-y border-slate-200 py-10 text-center text-sm text-slate-600">No viewing requests yet.</p> : <div className="divide-y divide-slate-200 border-y border-slate-200">{viewings.map((item) => <article key={item._id} className="py-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900">{item.listing?.title || "Property viewing"}</h3><span className={`rounded px-2 py-1 text-xs font-semibold capitalize ${statusTone[item.status] || "bg-slate-100 text-slate-700"}`}>{item.status.replaceAll("_", " ")}</span></div><p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><FiMapPin />{[item.listing?.town, item.listing?.county].filter(Boolean).join(", ")}</p><p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700"><span className="inline-flex items-center gap-1"><FiCalendar />{when(item.status === "reschedule_proposed" && item.proposedStartAt ? item.proposedStartAt : item.confirmedStartAt || item.requestedStartAt, item.timezone)}</span><span className="inline-flex items-center gap-1"><FiClock />Advertiser: {item.advertiser?.name || "Property owner"}</span></p>{item.proposalMessage && <p className="mt-2 text-sm text-slate-600">{item.proposalMessage}</p>}{item.customerMessage && <p className="mt-2 text-sm text-slate-600">Your note: {item.customerMessage}</p>}</div><a href={`${import.meta.env.VITE_MAIN_SITE_URL || "https://rendahomes.com"}/listings/${item.listing?._id}`} className="text-sm font-semibold text-emerald-800 hover:underline">View property</a></div>
        {item.status === "reschedule_proposed" && String(item.proposalBy) !== String(item.customer?._id) && <div className="mt-4 flex flex-wrap gap-2"><button disabled={busyId === item._id} onClick={() => updateViewing(item._id, "confirm")} className="inline-flex items-center gap-2 rounded-md bg-[#126542] px-3 py-2 text-sm font-semibold text-white"><FiCheck />Accept new time</button></div>}
        {["requested", "confirmed"].includes(item.status) && <div className="mt-4 flex flex-wrap gap-2"><button disabled={busyId === item._id} onClick={() => setRescheduleId(rescheduleId === item._id ? "" : item._id)} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"><FiRefreshCw />Suggest another time</button><button disabled={busyId === item._id} onClick={() => updateViewing(item._id, "cancel", { reason: "Cancelled by customer" })} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"><FiX />Cancel</button></div>}
        {rescheduleId === item._id && <RescheduleForm busy={busyId === item._id} onCancel={() => setRescheduleId("")} onSubmit={(payload) => updateViewing(item._id, "reschedule", payload)} />}
      </article>)}</div>}
    </section>
  </div>;
}

function RescheduleForm({ busy, onCancel, onSubmit }) {
  const [startAt, setStartAt] = useState(""); const [endAt, setEndAt] = useState(""); const [message, setMessage] = useState("");
  return <form onSubmit={(event) => { event.preventDefault(); onSubmit({ startAt: new Date(startAt).toISOString(), endAt: new Date(endAt).toISOString(), message }); }} className="mt-4 grid gap-3 border-l-2 border-emerald-700 pl-4 sm:grid-cols-2">
    <label className="text-xs font-semibold text-slate-700">New start<input required type="datetime-local" min={localDateTime(new Date())} value={startAt} onChange={(event) => setStartAt(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
    <label className="text-xs font-semibold text-slate-700">New end<input required type="datetime-local" min={startAt || localDateTime(new Date())} value={endAt} onChange={(event) => setEndAt(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
    <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Message<input maxLength={1200} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
    <div className="flex gap-2 sm:col-span-2"><button disabled={busy} className="rounded-md bg-[#123D38] px-3 py-2 text-sm font-semibold text-white">Send proposal</button><button type="button" onClick={onCancel} className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600">Cancel</button></div>
  </form>;
}
