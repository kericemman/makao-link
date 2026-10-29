import { useEffect, useMemo, useState } from "react";
import { FiCalendar, FiExternalLink, FiRefreshCw, FiSearch, FiUsers } from "react-icons/fi";
import { getAdminStayRequests } from "../../services/admin.service";

const statuses = ["all", "requested", "confirmed", "declined", "cancelled", "completed"];
const formatDate = (value) => new Date(value).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
const statusColor = {
  requested: "bg-amber-50 text-amber-800",
  confirmed: "bg-emerald-50 text-emerald-800",
  declined: "bg-rose-50 text-rose-800",
  cancelled: "bg-slate-100 text-slate-700",
  completed: "bg-sky-50 text-sky-800"
};

export default function AdminStayRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("requested");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminStayRequests();
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load stay requests.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => requests.filter((request) => {
    const matchesStatus = status === "all" || request.status === status;
    const content = [request.requestCode, request.guestName, request.guestEmail, request.guestPhone, request.listing?.title, request.landlord?.name]
      .filter(Boolean).join(" ").toLowerCase();
    return matchesStatus && content.includes(search.toLowerCase());
  }), [requests, status, search]);

  const pendingCount = requests.filter((request) => request.status === "requested").length;

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0D915C]">Property operations</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#013E43]">Short-stay requests</h1>
          <p className="mt-1 text-sm text-[#647C75]">Monitor guest requests. Hosts confirm availability and bookings from their landlord portal.</p>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-[#BBD2C6] bg-white px-3 py-2 text-sm font-semibold text-[#013E43] hover:bg-[#F1F7F3] disabled:opacity-60"><FiRefreshCw className={loading ? "animate-spin" : ""} />Refresh</button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[#DDEAE3] py-3">
        <div className="flex items-center gap-2 text-sm text-[#647C75]"><FiCalendar className="text-[#0D915C]" /><span><strong className="text-[#013E43]">{pendingCount}</strong> awaiting host response</span></div>
        <div className="flex flex-1 flex-wrap justify-end gap-2 sm:flex-nowrap">
          <label className="relative min-w-[200px] flex-1 sm:max-w-xs"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D915C]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search guests or properties" className="h-10 w-full rounded-lg border border-[#DDEAE3] bg-white pl-9 pr-3 text-sm text-[#013E43] outline-none focus:border-[#0D915C]" /></label>
          <select aria-label="Filter stay requests by status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-[#DDEAE3] bg-white px-3 text-sm font-semibold capitalize text-[#013E43] outline-none focus:border-[#0D915C]">{statuses.map((value) => <option key={value} value={value}>{value === "all" ? "All statuses" : value.replace("_", " ")}</option>)}</select>
        </div>
      </div>

      {error ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}
      {loading ? <div className="py-16 text-center text-sm text-[#647C75]">Loading stay requests…</div> : filtered.length ? (
        <div className="divide-y divide-[#E8F0EB] border-y border-[#DDEAE3]">
          {filtered.map((request) => <article key={request._id} className="grid gap-4 py-4 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
            <div className="flex min-w-0 gap-3">
              {request.listing?.images?.[0] ? <img src={request.listing.images[0]} alt="" className="h-16 w-20 shrink-0 rounded-md object-cover" /> : <div className="grid h-16 w-20 shrink-0 place-items-center rounded-md bg-[#F1F7F3] text-[#0D915C]"><FiCalendar /></div>}
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-semibold text-[#013E43]">{request.listing?.title || "Listing unavailable"}</h2><span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor[request.status] || "bg-slate-100 text-slate-700"}`}>{request.status}</span></div><p className="mt-1 truncate text-sm text-[#647C75]">{[request.listing?.town, request.listing?.county].filter(Boolean).join(", ")}</p><p className="mt-1 text-xs font-medium text-[#0D915C]">{request.requestCode}</p></div>
            </div>
            <div className="text-sm"><p className="font-semibold text-[#013E43]">{request.guestName} <span className="font-normal text-[#647C75]">· {request.guests} guest{request.guests === 1 ? "" : "s"}</span></p><p className="mt-1 text-[#647C75]">{formatDate(request.checkIn)} – {formatDate(request.checkOut)}</p><p className="mt-1 truncate text-xs text-[#647C75]">Host: {request.landlord?.name || "Unknown"} · {request.guestPhone}</p></div>
            {request.listing?._id ? <a href={`https://rendahomes.com/listings/${request.listing._id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0D915C] hover:text-[#013E43]">View listing <FiExternalLink /></a> : <span className="text-xs text-[#647C75]">Listing removed</span>}
          </article>)}
        </div>
      ) : <div className="border-y border-[#DDEAE3] py-14 text-center"><FiUsers className="mx-auto text-2xl text-[#0D915C]" /><p className="mt-2 font-semibold text-[#013E43]">No matching stay requests</p><p className="mt-1 text-sm text-[#647C75]">Try another status or search.</p></div>}
    </section>
  );
}
