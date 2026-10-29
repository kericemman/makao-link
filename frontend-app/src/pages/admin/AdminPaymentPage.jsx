import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminPayments } from "../../services/admin.service";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDownload,
  FiInfo,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import toast from "react-hot-toast";

const subscriptionStatus = {
  free: "bg-[#F1F5F3] text-[#526760]",
  pending_payment: "bg-amber-50 text-amber-800",
  active: "bg-emerald-50 text-emerald-800",
  grace: "bg-orange-50 text-orange-800",
  expired: "bg-red-50 text-red-700",
  cancelled: "bg-[#F1F5F3] text-[#526760]",
};

const paymentStatus = {
  success: "bg-emerald-50 text-emerald-800",
  failed: "bg-red-50 text-red-700",
  pending: "bg-amber-50 text-amber-800",
};

const paymentIcons = {
  success: FiCheckCircle,
  failed: FiAlertCircle,
  pending: FiClock,
};

const formatDate = (date) => {
  if (!date) return "—";
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime())
    ? "—"
    : parsedDate.toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const formatCurrency = (amount, currency = "KES") => {
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const AdminPaymentsPage = () => {
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminPayments();
      setRecords(data.records || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load payment records");
      toast.error("Failed to load payment records", {
        style: { background: "#013E43", color: "#fff" },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const cutoff = new Date();
    if (dateRange === "today") cutoff.setHours(0, 0, 0, 0);
    if (dateRange === "week") cutoff.setDate(cutoff.getDate() - 7);
    if (dateRange === "month") cutoff.setMonth(cutoff.getMonth() - 1);

    return records
      .filter((record) => filter === "all" || record.subscription?.status === filter)
      .filter((record) => {
        if (!term) return true;
        return [
          record.landlord?.name,
          record.landlord?.email,
          record.latestPayment?.reference,
        ].some((value) => value?.toLowerCase().includes(term));
      })
      .filter((record) => {
        if (dateRange === "all") return true;
        const paidAt = record.latestPayment?.paidAt;
        return paidAt && new Date(paidAt) >= cutoff;
      })
      .sort((a, b) => {
        const dateA = a.latestPayment?.paidAt ? new Date(a.latestPayment.paidAt) : new Date(0);
        const dateB = b.latestPayment?.paidAt ? new Date(b.latestPayment.paidAt) : new Date(0);
        return dateB - dateA;
      });
  }, [records, filter, searchTerm, dateRange]);

  const stats = useMemo(() => ({
    accounts: records.length,
    latestPaymentValue: records.reduce((sum, record) =>
      sum + (record.latestPayment?.status === "success" ? Number(record.latestPayment.amount) || 0 : 0), 0),
    activeSubscriptions: records.filter((record) => record.subscription?.status === "active").length,
    pendingSubscriptions: records.filter((record) => record.subscription?.status === "pending_payment").length,
  }), [records]);

  const exportPayments = () => {
    const columns = ["landlord", "email", "subscription_status", "plan", "reference", "payment_status", "amount", "currency", "paid_at"];
    const rows = filteredRecords.map((record) => [
      record.landlord?.name,
      record.landlord?.email,
      record.subscription?.status,
      record.latestPayment?.plan || record.subscription?.plan,
      record.latestPayment?.reference,
      record.latestPayment?.status,
      record.latestPayment?.amount,
      record.latestPayment?.currency || "KES",
      record.latestPayment?.paidAt,
    ]);
    const csv = [columns, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "rendahomes-payments.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-[#DDEAE3] border-t-[#0D915C]" />
          <p className="text-sm font-semibold text-[#013E43]">Loading payment records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="mx-auto max-w-xl border-y border-red-200 bg-white px-5 py-8 text-center">
        <FiAlertCircle className="mx-auto mb-3 text-3xl text-red-600" />
        <p className="text-sm font-semibold text-[#013E43]">{error}</p>
        <button onClick={fetchPayments} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0D915C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#08764C]">
          <FiRefreshCw /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b border-[#DDEAE3] pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0D915C]">Revenue</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#013E43]">Payments</h1>
          <p className="mt-1 text-sm text-[#647C75]">Review landlord billing activity and latest transaction status.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={fetchPayments} title="Refresh payments" aria-label="Refresh payments" className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#DDEAE3] text-[#41635A] transition hover:bg-[#F1F7F3]">
            <FiRefreshCw />
          </button>
          <button type="button" onClick={exportPayments} disabled={!filteredRecords.length} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#013E43] px-4 text-sm font-semibold text-white transition hover:bg-[#075B53] disabled:cursor-not-allowed disabled:opacity-50">
            <FiDownload /> Export CSV
          </button>
        </div>
      </header>

      <section aria-label="Payment overview" className="grid grid-cols-2 border-y border-[#DDEAE3] sm:grid-cols-4">
        {[
          ["Landlord accounts", stats.accounts],
          ["Latest successful payment value", formatCurrency(stats.latestPaymentValue)],
          ["Active subscriptions", stats.activeSubscriptions],
          ["Awaiting payment", stats.pendingSubscriptions],
        ].map(([label, value], index) => (
          <div key={label} className={`py-4 ${index % 2 ? "pl-4 sm:pl-5" : "pr-4 sm:pr-5"} ${index > 1 ? "border-t border-[#DDEAE3] sm:border-t-0" : ""} ${index > 0 ? "sm:border-l sm:border-[#DDEAE3] sm:pl-5" : ""}`}>
            <p className="text-xs font-medium text-[#647C75]">{label}</p>
            <p className="mt-1 text-xl font-semibold text-[#013E43]">{value}</p>
          </div>
        ))}
      </section>
      <p className="-mt-4 text-xs text-[#647C75]">Payment value sums each landlord account’s latest successful transaction only; it is not lifetime revenue.</p>

      <section aria-label="Payment filters" className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <FiSearch aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#647C75]" />
          <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search landlord or transaction reference" className="h-11 w-full rounded-lg border border-[#DDEAE3] bg-white pl-10 pr-3 text-sm text-[#013E43] outline-none placeholder:text-[#84958F] focus:border-[#0D915C] focus:ring-2 focus:ring-[#0D915C]/15" />
        </label>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <select aria-label="Filter by subscription status" value={filter} onChange={(event) => setFilter(event.target.value)} className="h-11 min-w-0 rounded-lg border border-[#DDEAE3] bg-white px-3 text-sm text-[#013E43] outline-none focus:border-[#0D915C]">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="pending_payment">Pending payment</option>
            <option value="grace">Grace</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
            <option value="free">Free</option>
          </select>
          <select aria-label="Filter by payment date" value={dateRange} onChange={(event) => setDateRange(event.target.value)} className="h-11 min-w-0 rounded-lg border border-[#DDEAE3] bg-white px-3 text-sm text-[#013E43] outline-none focus:border-[#0D915C]">
            <option value="all">Any date</option>
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
        </div>
      </section>

      <div className="flex items-center justify-between border-b border-[#DDEAE3] pb-2 text-xs text-[#647C75]">
        <span>{filteredRecords.length} of {records.length} landlord accounts</span>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="border-y border-[#DDEAE3] px-5 py-12 text-center">
          <FiCreditCard className="mx-auto mb-3 text-2xl text-[#83958E]" />
          <h2 className="text-base font-semibold text-[#013E43]">No payment records found</h2>
          <p className="mt-1 text-sm text-[#647C75]">{searchTerm || filter !== "all" || dateRange !== "all" ? "Try adjusting your search or filters." : "Billing activity will appear here when available."}</p>
        </div>
      ) : (
        <div className="divide-y divide-[#E7EFEB]">
          {filteredRecords.map((record) => {
            const latest = record.latestPayment;
            const paymentState = latest?.status || "none";
            const PaymentIcon = paymentIcons[paymentState] || FiInfo;
            const subscriptionState = record.subscription?.status || "free";
            return (
              <article key={record._id} className="grid gap-4 py-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(190px,0.8fr)_minmax(180px,0.75fr)_auto] lg:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F0F0] text-sm font-semibold text-[#013E43]">
                    {(record.landlord?.name || "?").trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-[#013E43]">{record.landlord?.name || "Unknown landlord"}</h2>
                    <p className="truncate text-xs text-[#647C75]">{record.landlord?.email || "No email"}</p>
                    <p className="mt-1 text-xs text-[#526760]">{record.subscription?.plan || "Free"} plan <span className="px-1 text-[#B0C1BA]">·</span> {record.activeListings || 0} active listings</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:block">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${subscriptionStatus[subscriptionState] || subscriptionStatus.free}`}>
                    {subscriptionState.replaceAll("_", " ")}
                  </span>
                  {record.subscription?.currentPeriodEnd && <p className="mt-1 text-xs text-[#647C75]">Period ends {formatDate(record.subscription.currentPeriodEnd)}</p>}
                </div>

                <div className="min-w-0">
                  {latest ? (
                    <>
                      <p className="text-sm font-semibold text-[#013E43]">{formatCurrency(latest.amount, latest.currency)}</p>
                      <p className="truncate font-mono text-xs text-[#647C75]">{latest.reference || "No reference"}</p>
                    </>
                  ) : <p className="text-sm text-[#647C75]">No payment recorded</p>}
                  {latest?.paidAt && <p className="text-xs text-[#647C75]">{formatDate(latest.paidAt)}</p>}
                </div>

                <div className="flex items-center gap-2 lg:justify-end">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${paymentStatus[paymentState] || "bg-[#F1F5F3] text-[#526760]"}`}>
                    <PaymentIcon aria-hidden="true" />{paymentState === "none" ? "No payment" : paymentState}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminPaymentsPage;
