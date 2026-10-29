import { useCallback, useEffect, useMemo, useState } from "react";
import { getSubscribers, updateSubscriberStatus } from "../../services/app/adminContent.service";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiDownload,
  FiGlobe,
  FiMail,
  FiRefreshCw,
  FiSearch,
  FiSmartphone,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";

const dateLabel = (date) => {
  if (!date) return "—";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingEmail, setUpdatingEmail] = useState("");
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const loadSubscribers = useCallback(async () => {
    try {
      setFetching(true);
      setError("");
      const { data } = await getSubscribers();
      setSubscribers(data.subscribers || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load subscribers");
      toast.error("Failed to load subscribers", {
        style: { background: "#013E43", color: "#fff" },
      });
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    loadSubscribers();
  }, [loadSubscribers]);

  const filteredSubscribers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return subscribers
      .filter((subscriber) => !query || subscriber.email?.toLowerCase().includes(query))
      .filter((subscriber) => sourceFilter === "all" || subscriber.sources?.includes(sourceFilter))
      .filter((subscriber) => statusFilter === "all" || (statusFilter === "active" ? subscriber.isActive : !subscriber.isActive))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [subscribers, search, sourceFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: subscribers.length,
    website: subscribers.filter((subscriber) => subscriber.sources?.includes("website")).length,
    mobile: subscribers.filter((subscriber) => subscriber.sources?.includes("mobile_app")).length,
    active: subscribers.filter((subscriber) => subscriber.isActive).length,
  }), [subscribers]);

  const toggleSubscriber = async (subscriber) => {
    try {
      setUpdatingEmail(subscriber.email);
      await updateSubscriberStatus({ email: subscriber.email, isActive: !subscriber.isActive });
      setSubscribers((current) => current.map((item) => item.email === subscriber.email
        ? { ...item, isActive: !subscriber.isActive }
        : item));
      toast.success(subscriber.isActive ? "Subscriber deactivated" : "Subscriber activated", {
        style: { background: "#013E43", color: "#fff" },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update subscriber", {
        style: { background: "#013E43", color: "#fff" },
      });
    } finally {
      setUpdatingEmail("");
    }
  };

  const exportSubscribers = () => {
    const rows = [
      ["email", "audiences", "status", "joined"],
      ...filteredSubscribers.map((subscriber) => [
        subscriber.email,
        (subscriber.sources || []).join("; "),
        subscriber.isActive ? "active" : "inactive",
        subscriber.createdAt,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `rendahomes-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (fetching) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-[#DDEAE3] border-t-[#0D915C]" />
          <p className="text-sm font-semibold text-[#013E43]">Loading subscriber audiences...</p>
        </div>
      </div>
    );
  }

  if (error && subscribers.length === 0) {
    return (
      <div role="alert" className="mx-auto max-w-xl border-y border-red-200 bg-white px-5 py-8 text-center">
        <FiAlertCircle className="mx-auto mb-3 text-3xl text-red-600" />
        <p className="text-sm font-semibold text-[#013E43]">{error}</p>
        <button onClick={loadSubscribers} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0D915C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#08764C]">
          <FiRefreshCw /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b border-[#DDEAE3] pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0D915C]">Audience</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#013E43]">Subscribers</h1>
          <p className="mt-1 text-sm text-[#647C75]">Website and mobile app update audiences, combined by email address.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={loadSubscribers} title="Refresh subscribers" aria-label="Refresh subscribers" className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#DDEAE3] text-[#41635A] transition hover:bg-[#F1F7F3]">
            <FiRefreshCw />
          </button>
          <button type="button" onClick={exportSubscribers} disabled={!filteredSubscribers.length} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#013E43] px-4 text-sm font-semibold text-white transition hover:bg-[#075B53] disabled:cursor-not-allowed disabled:opacity-50">
            <FiDownload /> Export CSV
          </button>
        </div>
      </header>

      <section aria-label="Subscriber overview" className="grid grid-cols-2 border-y border-[#DDEAE3] sm:grid-cols-4">
        {[
          ["Unique subscribers", stats.total],
          ["Website audience", stats.website],
          ["Mobile app audience", stats.mobile],
          ["Active emails", stats.active],
        ].map(([label, value], index) => (
          <div key={label} className={`py-4 ${index % 2 ? "pl-4 sm:pl-5" : "pr-4 sm:pr-5"} ${index > 1 ? "border-t border-[#DDEAE3] sm:border-t-0" : ""} ${index > 0 ? "sm:border-l sm:border-[#DDEAE3] sm:pl-5" : ""}`}>
            <p className="text-xs font-medium text-[#647C75]">{label}</p>
            <p className="mt-1 text-xl font-semibold text-[#013E43]">{value}</p>
          </div>
        ))}
      </section>
      <p className="-mt-4 text-xs text-[#647C75]">People subscribed to both audiences appear once and are counted in each audience total.</p>

      <section aria-label="Subscriber filters" className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <FiSearch aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#647C75]" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by email" className="h-11 w-full rounded-lg border border-[#DDEAE3] bg-white pl-10 pr-3 text-sm text-[#013E43] outline-none placeholder:text-[#84958F] focus:border-[#0D915C] focus:ring-2 focus:ring-[#0D915C]/15" />
        </label>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <select aria-label="Filter by audience" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="h-11 min-w-0 rounded-lg border border-[#DDEAE3] bg-white px-3 text-sm text-[#013E43] outline-none focus:border-[#0D915C]">
            <option value="all">All audiences</option>
            <option value="website">Website</option>
            <option value="mobile_app">Mobile app</option>
          </select>
          <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 min-w-0 rounded-lg border border-[#DDEAE3] bg-white px-3 text-sm text-[#013E43] outline-none focus:border-[#0D915C]">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </section>

      <div className="flex items-center justify-between border-b border-[#DDEAE3] pb-2 text-xs text-[#647C75]">
        <span>{filteredSubscribers.length} of {subscribers.length} unique subscribers</span>
      </div>

      {filteredSubscribers.length === 0 ? (
        <div className="border-y border-[#DDEAE3] px-5 py-12 text-center">
          <FiUsers className="mx-auto mb-3 text-2xl text-[#83958E]" />
          <h2 className="text-base font-semibold text-[#013E43]">No subscribers found</h2>
          <p className="mt-1 text-sm text-[#647C75]">{search || sourceFilter !== "all" || statusFilter !== "all" ? "Try adjusting your search or filters." : "New website and mobile app signups will appear here."}</p>
        </div>
      ) : (
        <div className="divide-y divide-[#E7EFEB]">
          {filteredSubscribers.map((subscriber) => (
            <article key={subscriber.email} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(145px,auto)_auto] sm:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F0F0] text-[#013E43]"><FiMail aria-hidden="true" /></div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#013E43]">{subscriber.email}</p>
                  <p className="mt-0.5 text-xs text-[#647C75]">Joined {dateLabel(subscriber.createdAt)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {subscriber.sources?.includes("website") && <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F0F0] px-2.5 py-1 text-xs font-medium text-[#013E43]"><FiGlobe aria-hidden="true" /> Website</span>}
                {subscriber.sources?.includes("mobile_app") && <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF5EF] px-2.5 py-1 text-xs font-medium text-[#08764C]"><FiSmartphone aria-hidden="true" /> Mobile app</span>}
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${subscriber.isActive ? "bg-emerald-50 text-emerald-800" : "bg-[#F1F5F3] text-[#526760]"}`}>
                  {subscriber.isActive ? <FiCheckCircle aria-hidden="true" /> : <FiXCircle aria-hidden="true" />}
                  {subscriber.isActive ? "Active" : "Inactive"}
                </span>
                <button type="button" disabled={updatingEmail === subscriber.email} onClick={() => toggleSubscriber(subscriber)} className="min-w-24 rounded-lg border border-[#DDEAE3] px-3 py-2 text-xs font-semibold text-[#41635A] transition hover:bg-[#F1F7F3] disabled:opacity-50">
                  {updatingEmail === subscriber.email ? "Saving..." : subscriber.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
