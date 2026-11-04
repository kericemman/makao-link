import { useEffect, useState } from "react";
import { FiCalendar, FiCheck, FiClock, FiRefreshCw, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { getAdvertiserViewings, updateViewing } from "../../services/marketplace.service";

const toLocal = (value, timezone = "Africa/Nairobi") => new Date(value).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: timezone });
const localDateTime = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const tones = { requested: "bg-amber-50 text-amber-800", confirmed: "bg-emerald-50 text-emerald-800", reschedule_proposed: "bg-sky-50 text-sky-800", declined: "bg-rose-50 text-rose-800", cancelled: "bg-slate-100 text-slate-700", completed: "bg-slate-100 text-slate-700" };

export default function Viewings() {
  const [viewings, setViewings] = useState([]); const [loading, setLoading] = useState(true); const [busyId, setBusyId] = useState(""); const [proposalId, setProposalId] = useState("");
  const load = async () => { setLoading(true); try { const data = await getAdvertiserViewings(); setViewings(data.viewings || []); } catch (error) { toast.error(error.response?.data?.message || "Could not load viewing requests."); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const act = async (viewing, action, payload = {}) => {
    setBusyId(viewing._id);
    try { const data = await updateViewing(viewing._id, action, payload); setViewings((items) => items.map((item) => item._id === viewing._id ? data.viewing : item)); setProposalId(""); toast.success("Viewing updated"); }
    catch (error) { toast.error(error.response?.data?.message || "Could not update this viewing."); }
    finally { setBusyId(""); }
  };

  return <main className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-5"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Appointments</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Viewings</h1><p className="mt-1 text-sm text-slate-600">Respond to customer time requests and record completed viewings.</p></div><button onClick={load} title="Refresh viewings" aria-label="Refresh viewings" className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-white"><FiRefreshCw className={loading ? "animate-spin" : ""} /></button></header>
    {loading ? <p className="py-12 text-center text-sm text-slate-500">Loading viewings…</p> : !viewings.length ? <div className="border-y border-slate-200 py-12 text-center"><FiCalendar className="mx-auto text-2xl text-emerald-800" /><p className="mt-3 font-semibold text-slate-800">No viewing requests yet</p><p className="mt-1 text-sm text-slate-500">Customer requests for your listings will appear here.</p></div> : <div className="divide-y divide-slate-200 border-y border-slate-200 bg-white">{viewings.map((item) => <article key={item._id} className="py-5">
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-900">{item.listing?.title || "Property viewing"}</h2><span className={`rounded px-2 py-1 text-xs font-semibold capitalize ${tones[item.status] || "bg-slate-100 text-slate-700"}`}>{item.status.replaceAll("_", " ")}</span></div><p className="mt-1 text-sm text-slate-600">{item.customer?.name || "Customer"}{item.customer?.email ? ` · ${item.customer.email}` : ""}{item.customer?.phone ? ` · ${item.customer.phone}` : ""}</p><p className="mt-2 flex items-center gap-1 text-sm text-slate-700"><FiClock />Preferred: {toLocal(item.status === "reschedule_proposed" && item.proposedStartAt ? item.proposedStartAt : item.confirmedStartAt || item.requestedStartAt, item.timezone)}</p>{item.customerMessage && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">“{item.customerMessage}”</p>}{item.proposalMessage && <p className="mt-2 text-sm text-slate-600">Proposal: {item.proposalMessage}</p>}</div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.status === "requested" && <><button disabled={busyId === item._id} onClick={() => act(item, "confirm")} className="inline-flex items-center gap-2 rounded-md bg-[#126542] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><FiCheck />Confirm requested time</button><button disabled={busyId === item._id} onClick={() => act(item, "decline", { message: "Please contact us to discuss another time." })} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"><FiX />Decline</button></>}
        {["requested", "confirmed"].includes(item.status) && <button disabled={busyId === item._id} onClick={() => setProposalId(proposalId === item._id ? "" : item._id)} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"><FiRefreshCw />Propose another time</button>}
        {item.status === "reschedule_proposed" && String(item.proposalBy) !== String(item.advertiser?._id) && <><button disabled={busyId === item._id} onClick={() => act(item, "confirm")} className="inline-flex items-center gap-2 rounded-md bg-[#126542] px-3 py-2 text-sm font-semibold text-white"><FiCheck />Accept proposed time</button><button disabled={busyId === item._id} onClick={() => act(item, "decline", { message: "The proposed time is not available." })} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"><FiX />Decline proposal</button></>}
        {item.status === "confirmed" && <><button disabled={busyId === item._id} onClick={() => act(item, "complete", { outcome: "viewed" })} className="inline-flex items-center gap-2 rounded-md border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-900">Mark viewed</button><button disabled={busyId === item._id} onClick={() => act(item, "complete", { outcome: "no_show" })} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Mark no-show</button></>}
        {["requested", "confirmed", "reschedule_proposed"].includes(item.status) && <button disabled={busyId === item._id} onClick={() => act(item, "cancel", { reason: "Cancelled by advertiser" })} className="rounded-md px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Cancel viewing</button>}
      </div>
      {proposalId === item._id && <ProposalForm busy={busyId === item._id} onCancel={() => setProposalId("")} onSubmit={(payload) => act(item, "reschedule", payload)} />}
    </article>)}</div>}
    <p className="text-xs text-slate-500">These are requested appointments, not exclusive calendar reservations. Confirm a time only after checking your availability.</p>
  </main>;
}

function ProposalForm({ busy, onCancel, onSubmit }) {
  const [startAt, setStartAt] = useState(""); const [endAt, setEndAt] = useState(""); const [message, setMessage] = useState("");
  return <form onSubmit={(event) => { event.preventDefault(); onSubmit({ startAt: new Date(startAt).toISOString(), endAt: new Date(endAt).toISOString(), message }); }} className="mt-4 grid max-w-3xl gap-3 border-l-2 border-emerald-700 pl-4 sm:grid-cols-2">
    <label className="text-xs font-semibold text-slate-700">New start<input required type="datetime-local" min={localDateTime(new Date())} value={startAt} onChange={(event) => setStartAt(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
    <label className="text-xs font-semibold text-slate-700">New end<input required type="datetime-local" min={startAt || localDateTime(new Date())} value={endAt} onChange={(event) => setEndAt(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
    <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Message<input maxLength={1200} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
    <div className="flex gap-2 sm:col-span-2"><button disabled={busy} className="rounded-md bg-[#123D38] px-3 py-2 text-sm font-semibold text-white">Send proposed time</button><button type="button" onClick={onCancel} className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600">Cancel</button></div>
  </form>;
}
