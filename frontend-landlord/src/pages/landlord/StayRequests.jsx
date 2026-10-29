import { useEffect, useState } from "react";
import { FiCalendar, FiCheck, FiClock, FiUsers, FiX } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { getLandlordStayRequests, updateLandlordStayRequest } from "../../services/listings.service";
import toast from "react-hot-toast";

const dateLabel = (value) => new Date(value).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
const waPhone = (value = "") => value.replace(/\D/g, "").replace(/^0/, "254");

export default function StayRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getLandlordStayRequests();
      setRequests(data.requests || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load stay requests.");
    } finally { setLoading(false); }
  };

  useEffect(() => { loadRequests(); }, []);

  const changeStatus = async (request, status) => {
    setBusyId(request._id);
    try {
      const data = await updateLandlordStayRequest(request._id, status);
      setRequests((current) => current.map((item) => item._id === request._id ? { ...item, status: data.request.status } : item));
      toast.success(status === "confirmed" ? "Dates confirmed" : "Request declined");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update this request.");
    } finally { setBusyId(""); }
  };

  const statusStyle = { requested: "bg-amber-50 text-amber-800", confirmed: "bg-emerald-50 text-emerald-800", declined: "bg-rose-50 text-rose-800", cancelled: "bg-slate-100 text-slate-700", completed: "bg-sky-50 text-sky-800" };

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-sm font-semibold text-[#126542]">GUEST BOOKINGS</p><h1 className="mt-1 text-2xl font-bold text-[#14231B]">Stay requests</h1><p className="mt-1 text-sm text-slate-600">Review dates and confirm availability before guests make plans.</p></div>
        <button onClick={loadRequests} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Refresh</button>
      </header>
      {loading ? <div className="py-16 text-center text-sm text-slate-500">Loading stay requests…</div> : requests.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center"><FiCalendar className="mx-auto text-2xl text-[#126542]" /><p className="mt-3 font-semibold text-slate-800">No stay requests yet</p><p className="mt-1 text-sm text-slate-500">Requests for your short-term stay listings will appear here.</p></div>
      ) : (
        <div className="divide-y divide-slate-200 border-y border-slate-200 bg-white">
          {requests.map((request) => {
            const waMessage = `Hi ${request.guestName}, about your stay request ${request.requestCode} for ${request.listing?.title || "our property"} from ${dateLabel(request.checkIn)} to ${dateLabel(request.checkOut)}. `;
            const waHref = `https://wa.me/${waPhone(request.guestPhone)}?text=${encodeURIComponent(waMessage)}`;
            return <article key={request._id} className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="flex gap-4">
                {request.listing?.images?.[0] ? <img src={request.listing.images[0]} alt="" className="h-20 w-24 shrink-0 rounded-lg object-cover" /> : null}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-900">{request.listing?.title || "Short-term stay"}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[request.status] || "bg-slate-100 text-slate-700"}`}>{request.status}</span></div>
                  <p className="mt-1 text-sm text-slate-600">{request.guestName} · {request.guestPhone} · {request.guestEmail}</p>
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700"><span className="inline-flex items-center gap-1"><FiCalendar />{dateLabel(request.checkIn)} – {dateLabel(request.checkOut)}</span><span className="inline-flex items-center gap-1"><FiUsers />{request.guests} guest{request.guests === 1 ? "" : "s"}</span><span className="inline-flex items-center gap-1"><FiClock />{request.requestCode}</span></p>
                  {request.message ? <p className="mt-2 max-w-3xl text-sm text-slate-600">“{request.message}”</p> : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {request.status === "requested" && <>
                  <button disabled={busyId === request._id} onClick={() => changeStatus(request, "confirmed")} className="inline-flex items-center gap-2 rounded-lg bg-[#126542] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0e5134] disabled:opacity-50"><FiCheck />Confirm dates</button>
                  <button disabled={busyId === request._id} onClick={() => changeStatus(request, "declined")} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><FiX />Decline</button>
                </>}
                <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"><FaWhatsapp />WhatsApp guest</a>
              </div>
            </article>;
          })}
        </div>
      )}
      <p className="text-xs text-slate-500">A request is not a confirmed reservation. Confirm dates here before telling the guest the stay is secured.</p>
    </main>
  );
}
