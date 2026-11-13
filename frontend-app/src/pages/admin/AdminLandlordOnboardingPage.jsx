import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiExternalLink, FiRefreshCw, FiSend } from "react-icons/fi";
import { getLandlordOnboarding, retryLandlordFollowup } from "../../services/admin.service";

const stages = {
  email_unverified: "Email not verified",
  plan_payment: "Plan payment pending",
  no_listing: "No property added",
  listing_review: "Listing under review",
  listing_needs_changes: "Listing needs changes",
  listing_live: "Approved listing",
  listing_in_progress: "Listing in progress",
  listing_removed: "Listing removed"
};

const stageStyle = {
  email_unverified: "bg-amber-50 text-amber-800",
  plan_payment: "bg-orange-50 text-orange-800",
  no_listing: "bg-rose-50 text-rose-800",
  listing_review: "bg-sky-50 text-sky-800",
  listing_needs_changes: "bg-red-50 text-red-800",
  listing_live: "bg-emerald-50 text-emerald-800",
  listing_in_progress: "bg-slate-100 text-slate-700",
  listing_removed: "bg-slate-100 text-slate-700"
};

const followupLabel = (record) => {
  if (!record.followup) return "Not sent";
  if (record.followup.status === "sent") return "Sent";
  if (record.followup.status === "failed") return "Failed";
  if (record.followup.status === "unknown") return "Delivery unknown";
  if (record.followup.status === "suppressed") return "No longer eligible";
  return record.followup.status;
};

export default function AdminLandlordOnboardingPage() {
  const [data, setData] = useState({ records: [], pagination: { page: 1, pages: 1, total: 0 }, followup: {} });
  const [stageFilter, setStageFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getLandlordOnboarding({ page, limit: 25 });
      setData(result);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load landlord onboarding progress.");
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const retry = async (record) => {
    try {
      setRetryingId(record._id);
      const result = await retryLandlordFollowup(record._id);
      toast.success(result.message || "Follow-up sent.");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send this follow-up.");
    } finally { setRetryingId(""); }
  };

  const records = (data.records || []).filter((record) => stageFilter === "all" || record.stage === stageFilter);
  const counts = data.stageCounts || {};

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-[#DDEAE3] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0D915C]">Landlord funnel</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#013E43]">Onboarding progress</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#55706A]">See verified account, plan, and listing milestones, and whether a setup reminder was delivered.</p>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 self-start rounded-md border border-[#DDEAE3] px-3 py-2 text-sm font-medium text-[#013E43] hover:bg-white disabled:opacity-50 sm:self-auto"><FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh</button>
      </header>

      <section className="flex flex-wrap items-center gap-3 border-b border-[#DDEAE3] pb-4 text-sm">
        <span className={`rounded-full px-3 py-1.5 font-semibold ${data.followup?.enabled ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
          Follow-up email {data.followup?.enabled && data.followup?.emailConfigured ? "enabled" : "disabled"}
        </span>
        <span className="text-[#55706A]">One reminder after {data.followup?.delayHours || 24} hours · verified email · no listing</span>
        {data.whatsappUrl && <a href={data.whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#0D915C] hover:underline">Open WhatsApp support <FiExternalLink /></a>}
        {!data.whatsappUrl && <span className="text-[#7B8B86]">WhatsApp contact is not configured in admin contact details.</span>}
      </section>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {Object.entries(stages).map(([key, label]) => (
          <button key={key} onClick={() => { setStageFilter(stageFilter === key ? "all" : key); setPage(1); }} className={`rounded-md border px-3 py-3 text-left transition ${stageFilter === key ? "border-[#0D915C] bg-[#F0F8F3]" : "border-[#DDEAE3] bg-white hover:border-[#9CBCAE]"}`}>
            <span className="block text-xl font-semibold text-[#013E43]">{counts[key] || 0}</span>
            <span className="mt-1 block text-xs leading-4 text-[#55706A]">{label}</span>
          </button>
        ))}
      </section>
      <p className="-mt-4 text-xs text-[#71827D]">Stage totals reflect the current page of records.</p>

      <section>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold text-[#013E43]">Recent landlord accounts <span className="font-normal text-[#71827D]">({data.pagination?.total || 0})</span></h3>
          <select value={stageFilter} onChange={(event) => { setStageFilter(event.target.value); setPage(1); }} className="rounded-md border border-[#C8D8D0] bg-white px-3 py-2 text-sm text-[#013E43]">
            <option value="all">All stages</option>
            {Object.entries(stages).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>
        {loading ? <p className="py-8 text-sm text-[#55706A]">Loading onboarding records...</p> : records.length === 0 ? (
          <p className="border-y border-[#DDEAE3] py-8 text-sm text-[#55706A]">No landlord accounts in this stage on this page.</p>
        ) : (
          <div className="divide-y divide-[#DDEAE3] border-y border-[#DDEAE3]">
            {records.map((record) => (
              <article key={record._id} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
                <Link to={`/admin/onboarding/${record._id}`} className="min-w-0 rounded-sm outline-none hover:text-[#0D915C] focus-visible:ring-2 focus-visible:ring-[#0D915C]">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate font-semibold text-[#013E43]">{record.name}</h4>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${stageStyle[record.stage] || "bg-slate-100 text-slate-700"}`}>{stages[record.stage] || record.stage}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-[#55706A]">{record.email} · Joined {new Date(record.createdAt).toLocaleDateString()}</p>
                  <p className="mt-1 text-xs text-[#71827D]">
                    {record.subscription ? `${record.subscription.plan} · ${record.subscription.status}` : "No subscription record"}
                    {` · ${record.listingCounts.total} total listing${record.listingCounts.total === 1 ? "" : "s"}`}
                    {` · Follow-up: ${followupLabel(record)}`}
                  </p>
                </Link>
                {record.followup?.status === "failed" && <button onClick={() => retry(record)} disabled={retryingId === record._id} className="inline-flex items-center gap-2 self-start rounded-md border border-[#C8D8D0] px-3 py-2 text-sm font-semibold text-[#013E43] hover:bg-[#F7FBF8] disabled:opacity-50"><FiSend /> {retryingId === record._id ? "Retrying..." : "Retry failed email"}</button>}
                {record.followup?.status === "unknown" && <span className="self-start text-xs text-amber-800">Not retried to avoid duplicate delivery.</span>}
              </article>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between text-sm text-[#55706A]">
          <span>Page {data.pagination?.page || page} of {Math.max(1, data.pagination?.pages || 1)}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-md border border-[#DDEAE3] px-3 py-1.5 disabled:opacity-40">Previous</button>
            <button disabled={page >= (data.pagination?.pages || 1) || loading} onClick={() => setPage((value) => value + 1)} className="rounded-md border border-[#DDEAE3] px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        </div>
      </section>
      <p className="text-xs leading-5 text-[#71827D]">Progress reflects persisted account verification, subscription, and listing records. This version does not track unsaved form steps. Automated WhatsApp outreach is not used; the email’s WhatsApp link opens the configured RendaHomes support contact.</p>
    </div>
  );
}
