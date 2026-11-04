import { useEffect, useState } from "react";
import { FiCalendar, FiCheck, FiClock, FiMapPin, FiRefreshCw, FiX } from "react-icons/fi";
import { getAgentViewings, updateViewing } from "../../services/marketplace.service";
import { getApiErrorMessage } from "../../utils/apiError";

const localDateTime = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const displayTime = (value, timezone = "Africa/Nairobi") => new Date(value).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: timezone });
const statusTone = {
  requested: "bg-amber-50 text-amber-900",
  confirmed: "bg-emerald-50 text-emerald-900",
  reschedule_proposed: "bg-sky-50 text-sky-900",
  declined: "bg-rose-50 text-rose-900",
  cancelled: "bg-slate-100 text-slate-700",
  completed: "bg-slate-100 text-slate-700"
};

export default function AgentViewings() {
  const [viewings, setViewings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [rescheduleId, setRescheduleId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAgentViewings();
      setViewings(data.viewings || []);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load assigned viewings."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (item, action, payload = {}) => {
    setBusyId(item._id);
    setError("");
    setNotice("");
    try {
      const data = await updateViewing(item._id, action, payload);
      setViewings((current) => current.map((viewing) => viewing._id === item._id ? data.viewing : viewing));
      setRescheduleId("");
      setNotice("Viewing updated.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not update this viewing."));
    } finally {
      setBusyId("");
    }
  };

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#DDEAE3] pb-5">
      <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#168557]">Appointments</p><h2 className="mt-1 text-2xl font-bold text-[#123D38]">Assigned viewings</h2><p className="mt-1 text-sm text-slate-600">Coordinate times for customers who accepted your property suggestion.</p></div>
      <button type="button" onClick={load} aria-label="Refresh viewings" title="Refresh viewings" className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-white"><FiRefreshCw className={loading ? "animate-spin" : ""} /></button>
    </header>
    {error && <p role="alert" className="border-y border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</p>}
    {notice && <p role="status" aria-live="polite" className="border-y border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p>}
    {loading ? <p className="py-12 text-center text-sm text-slate-500">Loading assigned viewings…</p> : !viewings.length ? <div className="border-y border-slate-200 py-12 text-center"><FiCalendar className="mx-auto text-2xl text-emerald-800" /><p className="mt-3 font-semibold text-slate-800">No assigned viewings yet</p><p className="mt-1 text-sm text-slate-500">When a customer accepts your property suggestion and requests a viewing, it will appear here.</p></div> : <div className="divide-y divide-slate-200 border-y border-slate-200 bg-white">
      {viewings.map((item) => <article key={item._id} className="py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900">{item.listing?.title || "Property viewing"}</h3><span className={`rounded px-2 py-1 text-xs font-semibold capitalize ${statusTone[item.status] || "bg-slate-100 text-slate-700"}`}>{item.status.replaceAll("_", " ")}</span></div>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><FiMapPin />{[item.listing?.area, item.listing?.town, item.listing?.county].filter(Boolean).join(", ")}</p>
            <p className="mt-2 text-sm text-slate-700">{item.customer?.name || "Customer"}{item.customer?.email ? ` · ${item.customer.email}` : ""}{item.customer?.phone ? ` · ${item.customer.phone}` : ""}</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-700"><FiClock />{displayTime(item.status === "reschedule_proposed" && item.proposedStartAt ? item.proposedStartAt : item.confirmedStartAt || item.requestedStartAt, item.timezone)}</p>
            {item.customerMessage && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Customer note: {item.customerMessage}</p>}
            {item.proposalMessage && <p className="mt-2 text-sm text-slate-600">Time proposal: {item.proposalMessage}</p>}
          </div>
          <a href={`${import.meta.env.VITE_MAIN_SITE_URL || "https://rendahomes.com"}/listings/${item.listing?._id}`} className="text-sm font-semibold text-emerald-800 hover:underline">View property</a>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {item.status === "requested" && <><button disabled={busyId === item._id} onClick={() => act(item, "confirm")} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#126542] px-3 text-sm font-semibold text-white disabled:opacity-50"><FiCheck />Confirm requested time</button><button disabled={busyId === item._id} onClick={() => act(item, "decline", { message: "Please contact the customer to discuss another time." })} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 disabled:opacity-50"><FiX />Decline</button></>}
          {["requested", "confirmed"].includes(item.status) && <button disabled={busyId === item._id} onClick={() => setRescheduleId(rescheduleId === item._id ? "" : item._id)} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 disabled:opacity-50"><FiRefreshCw />Propose another time</button>}
          {item.status === "reschedule_proposed" && String(item.proposalBy) !== String(item.assignedAgent?._id) && <button disabled={busyId === item._id} onClick={() => act(item, "confirm")} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#126542] px-3 text-sm font-semibold text-white disabled:opacity-50"><FiCheck />Accept proposed time</button>}
          {item.status === "confirmed" && <><button disabled={busyId === item._id} onClick={() => act(item, "complete", { outcome: "viewed" })} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-emerald-300 px-3 text-sm font-semibold text-emerald-900 disabled:opacity-50"><FiCheck />Mark viewed</button><button disabled={busyId === item._id} onClick={() => act(item, "complete", { outcome: "no_show" })} className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 disabled:opacity-50">Mark no-show</button></>}
          {["requested", "confirmed", "reschedule_proposed"].includes(item.status) && <button disabled={busyId === item._id} onClick={() => act(item, "cancel", { reason: "Cancelled by assigned agent" })} className="min-h-10 rounded-md px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Cancel viewing</button>}
        </div>
        {rescheduleId === item._id && <RescheduleForm busy={busyId === item._id} onCancel={() => setRescheduleId("")} onSubmit={(payload) => act(item, "reschedule", payload)} />}
      </article>)}
    </div>}
    <p className="text-xs text-slate-500">Contact details appear only after the customer consents to share them for the viewing.</p>
  </div>;
}

function RescheduleForm({ busy, onCancel, onSubmit }) {
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [message, setMessage] = useState("");
  return <form onSubmit={(event) => { event.preventDefault(); onSubmit({ startAt: new Date(startAt).toISOString(), endAt: new Date(endAt).toISOString(), message }); }} className="mt-4 grid max-w-3xl gap-3 border-l-2 border-emerald-700 pl-4 sm:grid-cols-2">
    <label className="text-xs font-semibold text-slate-700">New start<input required type="datetime-local" min={localDateTime(new Date())} value={startAt} onChange={(event) => setStartAt(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
    <label className="text-xs font-semibold text-slate-700">New end<input required type="datetime-local" min={startAt || localDateTime(new Date())} value={endAt} onChange={(event) => setEndAt(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
    <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Message<input maxLength={1200} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
    <div className="flex gap-2 sm:col-span-2"><button disabled={busy} className="min-h-10 rounded-md bg-[#123D38] px-3 text-sm font-semibold text-white disabled:opacity-50">Send time proposal</button><button type="button" onClick={onCancel} className="min-h-10 rounded-md px-3 text-sm font-semibold text-slate-600">Cancel</button></div>
  </form>;
}
