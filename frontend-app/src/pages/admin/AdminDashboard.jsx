import { createElement, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, Line } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from "chart.js";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiArrowRight,
  FiBell,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCloud,
  FiDatabase,
  FiCreditCard,
  FiActivity,
  FiFileText,
  FiGrid,
  FiHelpCircle,
  FiMail,
  FiMessageSquare,
  FiRefreshCw,
  FiServer,
  FiShield,
  FiSmartphone,
  FiUsers
} from "react-icons/fi";
import { getAdminCommercialOverview, getAdminOverviewTrends, getAdminPlatformHealth, getAdminSummary, getRecentActivity } from "../../services/admin.service";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

const defaultSummary = {
  pendingListings: 0,
  approvedListings: 0,
  rejectedListings: 0,
  landlords: 0,
  totalListings: 0,
  totalInquiries: 0,
  totalRevenue: 0,
  activeSubscriptions: 0,
  pendingPayments: 0,
  totalSupportTickets: 0,
  openSupportTickets: 0,
  pendingKycReviews: 0,
  newListingReports: 0,
  pendingServiceApplications: 0,
  activeAgents: 0,
  requestedStays: 0,
  newHelpRequests: 0,
  openAppSupportTickets: 0,
  activeAppSubscribers: 0,
  publishedAppUpdates: 0
};

const activityIcons = {
  listing_submission: FiGrid,
  payment_received: FiCreditCard,
  inquiry_sent: FiMessageSquare,
  support_ticket: FiHelpCircle,
  listing_report: FiAlertTriangle,
  stay_request: FiCalendar,
  help_request: FiBriefcase,
  app_support_ticket: FiSmartphone,
  kyc_submission: FiShield,
  service_application: FiFileText,
  agent_created: FiUsers,
  app_update: FiBell
};

const activityGroups = {
  property: ["listing_submission", "listing_approved", "listing_rejected", "listing_removed_from_public", "listing_restored", "listing_report", "stay_request"],
  people: ["inquiry_sent", "payment_received", "support_ticket", "kyc_submission", "kyc_approved", "kyc_rejected", "service_application", "service_application_approved", "service_application_rejected", "agent_created"],
  app: ["help_request", "app_support_ticket", "app_update", "app_update_draft"]
};

const formatNumber = (value) => new Intl.NumberFormat("en-KE").format(value || 0);
const formatCurrency = (value) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value || 0);

export default function AdminDashboard() {
  const [summary, setSummary] = useState(defaultSummary);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [trendRange, setTrendRange] = useState("30d");
  const [trendData, setTrendData] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [trendsError, setTrendsError] = useState("");
  const [commercialData, setCommercialData] = useState(null);
  const [commercialLoading, setCommercialLoading] = useState(true);
  const [commercialError, setCommercialError] = useState("");
  const [platformHealth, setPlatformHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState("");

  const fetchDashboardData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);
      setError("");
      const [summaryData, activityData] = await Promise.all([
        getAdminSummary(),
        getRecentActivity().catch(() => ({ activities: [] }))
      ]);
      setSummary({ ...defaultSummary, ...(summaryData.summary || {}) });
      setRecentActivity(activityData.activities || []);
      setLastUpdatedAt(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Could not load the latest platform activity.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(false), 45000);
    return () => clearInterval(interval);
  }, []);

  const fetchTrends = async (range) => {
    try {
      setTrendsLoading(true);
      setTrendsError("");
      const response = await getAdminOverviewTrends(range);
      setTrendData(response.trends || null);
    } catch (err) {
      setTrendsError(err.response?.data?.message || "Could not load activity trends.");
    } finally {
      setTrendsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends(trendRange);
    const interval = setInterval(() => fetchTrends(trendRange), 45000);
    return () => clearInterval(interval);
  }, [trendRange]);

  const fetchCommercial = async () => {
    try {
      setCommercialLoading(true);
      setCommercialError("");
      const response = await getAdminCommercialOverview();
      setCommercialData(response);
    } catch (err) {
      setCommercialError(err.response?.data?.message || "Could not load landlord plan and referral metrics.");
    } finally {
      setCommercialLoading(false);
    }
  };

  useEffect(() => {
    fetchCommercial();
    const interval = setInterval(fetchCommercial, 45000);
    return () => clearInterval(interval);
  }, []);

  const fetchPlatformHealth = async () => {
    try {
      setHealthLoading(true);
      setHealthError("");
      setPlatformHealth(await getAdminPlatformHealth());
    } catch (err) {
      setHealthError(err.response?.data?.message || "Could not load platform health status.");
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformHealth();
    const interval = setInterval(fetchPlatformHealth, 45000);
    return () => clearInterval(interval);
  }, []);

  const actionQueues = [
    { label: "Listings awaiting review", value: summary.pendingListings, path: "/admin/listings/pending", icon: FiGrid },
    { label: "Landlord KYC reviews", value: summary.pendingKycReviews, path: "/admin/kyc", icon: FiShield },
    { label: "Listing reports", value: summary.newListingReports, path: "/admin/listings/reports", icon: FiAlertTriangle },
    { label: "Service provider applications", value: summary.pendingServiceApplications, path: "/admin/services/applications", icon: FiFileText },
    { label: "Website support tickets", value: summary.openSupportTickets, path: "/admin/support", icon: FiHelpCircle },
    { label: "Mobile app support tickets", value: summary.openAppSupportTickets, path: "/admin/app/support-help?tab=tickets", icon: FiSmartphone },
    { label: "Property help requests", value: summary.newHelpRequests, path: "/admin/app/support-help?tab=requests", icon: FiBriefcase },
    { label: "Subscriptions awaiting payment", value: summary.pendingPayments, path: "/admin/payments", icon: FiCreditCard }
  ];
  const actionCount = actionQueues.reduce((total, queue) => total + queue.value, 0);
  const activityItems = useMemo(() => {
    if (activityFilter === "all") return recentActivity;
    const types = activityGroups[activityFilter] || [];
    return recentActivity.filter((activity) => types.includes(activity.type));
  }, [recentActivity, activityFilter]);

  const businessPulse = [
    { label: "Live listings", value: formatNumber(summary.approvedListings), detail: "Current approved inventory", path: "/admin/listings" },
    { label: "Landlords", value: formatNumber(summary.landlords), detail: "All registered landlord accounts", path: "/admin/landlords" },
    { label: "Listing inquiries", value: formatNumber(summary.totalInquiries), detail: "All-time inquiries", path: "/admin/inquiries" },
    { label: "Successful payments", value: formatCurrency(summary.totalRevenue), detail: "All-time recorded payments", path: "/admin/payments" }
  ];

  const formatActivityTime = (date) => {
    const value = new Date(date);
    const seconds = Math.floor((Date.now() - value.getTime()) / 1000);
    if (Number.isNaN(value.getTime())) return "";
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
    return value.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
  };

  if (loading) {
    return <div className="flex min-h-72 items-center justify-center"><div className="text-center"><div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-[#DDEAE3] border-t-[#0D915C]" /><p className="text-sm font-semibold text-[#013E43]">Loading operations dashboard…</p></div></div>;
  }

  if (error && !lastUpdatedAt) {
    return <div className="mx-auto max-w-xl rounded-xl border border-red-100 bg-white p-7 text-center"><FiAlertCircle className="mx-auto mb-3 text-3xl text-red-500" /><p className="text-sm font-semibold text-[#013E43]">{error}</p><button onClick={() => fetchDashboardData()} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#013E43] px-4 py-2.5 text-sm font-semibold text-white"><FiRefreshCw />Retry</button></div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#DDEAE3] pb-5">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0D915C]">RendaHomes operations</p><h1 className="mt-1 text-2xl font-semibold text-[#013E43]">Overview</h1><p className="mt-1 text-sm text-[#647C75]">A live view of admin work and marketplace activity.</p></div>
        <div className="flex items-center gap-3"><span className="text-xs text-[#647C75]">{lastUpdatedAt ? `Updated ${lastUpdatedAt.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}` : ""}</span><button onClick={() => { fetchDashboardData(false); fetchTrends(trendRange); fetchCommercial(); fetchPlatformHealth(); }} disabled={refreshing || trendsLoading || commercialLoading || healthLoading} className="inline-flex items-center gap-2 rounded-lg border border-[#BBD2C6] bg-white px-3 py-2 text-sm font-semibold text-[#013E43] transition hover:bg-[#F1F7F3] disabled:opacity-60"><FiRefreshCw className={refreshing || trendsLoading || commercialLoading || healthLoading ? "animate-spin" : ""} />Refresh</button></div>
      </header>

      {error ? <p role="status" className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900">Refresh failed. Showing the last loaded data.</p> : null}

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="min-w-0 border-y border-[#DDEAE3] bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-[#E8F0EB] px-4 py-4 sm:px-5"><div><h2 className="font-semibold text-[#013E43]">Admin action inbox</h2><p className="mt-0.5 text-xs text-[#647C75]">{formatNumber(actionCount)} open items across queues you can manage</p></div><span className="rounded-full bg-[#F1F7F3] px-2.5 py-1 text-xs font-semibold text-[#0D7250]">Live queues</span></div>
          <div className="divide-y divide-[#EEF4F0]">
            {actionQueues.map((queue) => <QueueLink key={queue.label} {...queue} />)}
          </div>
        </div>

        <div className="space-y-5">
          <section className="border-y border-[#DDEAE3] bg-white">
            <div className="border-b border-[#E8F0EB] px-4 py-4 sm:px-5"><h2 className="font-semibold text-[#013E43]">Marketplace activity</h2><p className="mt-0.5 text-xs text-[#647C75]">Demand signals, separate from admin work queues</p></div>
            <Link to="/admin/stay-requests" className="group flex items-center gap-3 px-4 py-4 transition hover:bg-[#F6FAF7] sm:px-5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700"><FiCalendar /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#013E43]">Short-stay requests awaiting host response</span><span className="mt-0.5 block text-xs text-[#647C75]">Hosts manage confirmations; admins can monitor demand.</span></span><span className={`min-w-8 rounded-full px-2 py-1 text-center text-xs font-bold ${summary.requestedStays > 0 ? "bg-amber-50 text-amber-800" : "bg-[#F1F7F3] text-[#647C75]"}`}>{formatNumber(summary.requestedStays)}</span><FiArrowRight className="shrink-0 text-[#9AAEA6] transition group-hover:translate-x-1 group-hover:text-[#0D915C]" /></Link>
          </section>

          <section className="border-y border-[#DDEAE3] bg-white">
            <div className="border-b border-[#E8F0EB] px-4 py-4 sm:px-5"><h2 className="font-semibold text-[#013E43]">Platform at a glance</h2><p className="mt-0.5 text-xs text-[#647C75]">Current totals; payment and inquiry figures are all-time.</p></div>
            <div className="grid divide-y divide-[#EEF4F0] sm:grid-cols-2 sm:divide-x sm:divide-y-0">{businessPulse.map((item) => <Link key={item.label} to={item.path} className="group px-4 py-4 transition hover:bg-[#F6FAF7] sm:px-5"><span className="text-xs font-semibold text-[#647C75]">{item.label}</span><span className="mt-1 flex items-center justify-between gap-2 text-lg font-semibold text-[#013E43]">{item.value}<FiArrowRight className="text-sm text-[#9AAEA6] transition group-hover:translate-x-1 group-hover:text-[#0D915C]" /></span><span className="mt-0.5 block text-[11px] text-[#647C75]">{item.detail}</span></Link>)}</div>
          </section>
        </div>
      </section>

      <section className="border-y border-[#DDEAE3] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8F0EB] px-4 py-4 sm:px-5">
          <div><h2 className="font-semibold text-[#013E43]">Activity trends</h2><p className="mt-0.5 text-xs text-[#647C75]">Daily activity and successful payments · East Africa Time</p></div>
          <div className="inline-flex rounded-md border border-[#DDEAE3] p-1" aria-label="Trend reporting period">{[["7d", "7 days"], ["30d", "30 days"], ["90d", "90 days"]].map(([value, label]) => <button key={value} type="button" aria-pressed={trendRange === value} onClick={() => setTrendRange(value)} className={`rounded px-3 py-1.5 text-xs font-semibold transition ${trendRange === value ? "bg-[#013E43] text-white" : "text-[#647C75] hover:bg-[#F1F7F3] hover:text-[#013E43]"}`}>{label}</button>)}</div>
        </div>
        {trendsError ? <p role="status" className="m-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">{trendsError}</p> : null}
        {trendsLoading && !trendData ? <div className="grid gap-5 p-5 lg:grid-cols-2"><ChartPlaceholder /><ChartPlaceholder /></div> : trendData ? <div className="grid gap-5 p-4 lg:grid-cols-[1.5fr_0.8fr] sm:p-5">
          <div className="min-w-0"><h3 className="mb-3 text-sm font-semibold text-[#013E43]">People and marketplace activity</h3><div className="h-64">{trendsLoading ? <ChartPlaceholder /> : <Line data={buildActivityChart(trendData.activity || [])} options={activityChartOptions} />}</div></div>
          <div className="min-w-0 border-t border-[#EEF4F0] pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"><h3 className="mb-3 text-sm font-semibold text-[#013E43]">Successful payments</h3><div className="h-64">{trendsLoading ? <ChartPlaceholder /> : <Bar data={buildPaymentChart(trendData.payments || [])} options={paymentChartOptions} />}</div><p className="mt-2 text-[11px] text-[#647C75]">Based on recorded payment dates; this is not net revenue or recurring revenue.</p></div>
        </div> : null}
      </section>

      <section className="border-y border-[#DDEAE3] bg-white">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#E8F0EB] px-4 py-4 sm:px-5"><div><h2 className="font-semibold text-[#013E43]">Platform health</h2><p className="mt-0.5 text-xs text-[#647C75]">Live API and database check; integrations show configuration only.</p></div><span className="text-xs text-[#647C75]">{platformHealth?.checkedAt ? `Checked ${new Date(platformHealth.checkedAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}</span></div>
        {healthError ? <p role="status" className="m-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">{healthError}</p> : null}
        {healthLoading && !platformHealth ? <div className="grid gap-5 p-5 md:grid-cols-2"><ChartPlaceholder /><ChartPlaceholder /></div> : platformHealth ? <div className="grid divide-y divide-[#EEF4F0] md:grid-cols-[1.1fr_0.9fr] md:divide-x md:divide-y-0">
          <div className="px-4 py-5 sm:px-5">
            <div className="mb-4 flex items-center gap-2"><FiServer className="text-[#0D915C]" /><h3 className="text-sm font-semibold text-[#013E43]">Service status</h3></div>
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <HealthStatusItem label="Admin API" status={platformHealth.api?.status} detail={`${formatNumber(platformHealth.api?.responseTimeMs || 0)} ms response`} icon={FiActivity} />
              <HealthStatusItem label="MongoDB" status={platformHealth.database?.status} icon={FiDatabase} />
              <HealthStatusItem label="Email provider" status={platformHealth.integrations?.email?.status} detail="Configuration check only" icon={FiMail} />
              <HealthStatusItem label="Paystack" status={platformHealth.integrations?.payments?.status} detail="Configuration check only" icon={FiCreditCard} />
              <HealthStatusItem label="Cloudinary" status={platformHealth.integrations?.cloudinary?.status} detail="Configuration check only" icon={FiCloud} />
              <HealthStatusItem label="API process uptime" status="informational" detail={formatUptime(platformHealth.process?.uptimeSeconds)} icon={FiClock} />
            </div>
          </div>
          <div className="px-4 py-5 sm:px-5">
            <div className="mb-4 flex items-center gap-2"><FiBell className="text-[#0D915C]" /><h3 className="text-sm font-semibold text-[#013E43]">Mobile app communications</h3></div>
            <p className="text-xs text-[#647C75]">Active update-email subscribers: <strong className="text-[#013E43]">{platformHealth.appCommunications?.activeEmailSubscribers == null ? "Unavailable" : formatNumber(platformHealth.appCommunications.activeEmailSubscribers)}</strong></p>
            {platformHealth.appCommunications?.latestPublishedUpdate ? <div className="mt-4 border-l-2 border-[#16865A] pl-3"><p className="text-xs font-semibold text-[#013E43]">{platformHealth.appCommunications.latestPublishedUpdate.title}</p><p className="mt-1 text-[11px] text-[#647C75]">Published {formatDateTime(platformHealth.appCommunications.latestPublishedUpdate.publishedAt)}</p><p className="mt-1 text-[11px] text-[#647C75]">Notification attempt recorded: {formatDateTime(platformHealth.appCommunications.latestPublishedUpdate.notificationAttemptAt)}</p></div> : <p className="mt-4 text-xs text-[#647C75]">No published app update recorded.</p>}
            <p className="mt-4 border-t border-[#EEF4F0] pt-3 text-[11px] leading-5 text-[#647C75]">Email delivery results and Paystack webhook history are not stored yet. The update timestamp indicates an attempt, not confirmed delivery.</p>
          </div>
        </div> : null}
      </section>

      <section className="border-y border-[#DDEAE3] bg-white">
        <div className="border-b border-[#E8F0EB] px-4 py-4 sm:px-5"><h2 className="font-semibold text-[#013E43]">Landlord growth and monetization</h2><p className="mt-0.5 text-xs text-[#647C75]">Plan adoption, referral outcomes, and standalone WhatsApp listing access.</p></div>
        {commercialError ? <p role="status" className="m-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">{commercialError}</p> : null}
        {commercialLoading && !commercialData ? <div className="grid gap-5 p-5 xl:grid-cols-3"><ChartPlaceholder /><ChartPlaceholder /><ChartPlaceholder /></div> : commercialData ? <div className="grid divide-y divide-[#EEF4F0] xl:grid-cols-[0.9fr_1.1fr_1fr] xl:divide-x xl:divide-y-0">
          <div className="min-w-0 px-4 py-5 sm:px-5">
            <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-[#013E43]">Landlord plan mix</h3><p className="mt-1 text-xs text-[#647C75]">Current plans: {formatNumber(commercialData.plans?.totalLandlords || 0)} landlords</p></div><Link to="/admin/subscriptions" className="whitespace-nowrap text-xs font-semibold text-[#0D915C] hover:text-[#013E43]">Manage <FiArrowRight className="inline" /></Link></div>
            <div className="mt-4 space-y-4">{(commercialData.plans?.distribution || []).map((plan) => <PlanMixRow key={plan.plan} plan={plan} total={commercialData.plans?.totalLandlords || 0} />)}</div>
            {commercialData.plans?.withoutSubscription > 0 ? <p className="mt-4 text-[11px] text-[#647C75]">{formatNumber(commercialData.plans.withoutSubscription)} landlord accounts have no subscription record.</p> : null}
          </div>

          <div className="min-w-0 px-4 py-5 sm:px-5">
            <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-[#013E43]">Referral agent outcomes</h3><p className="mt-1 text-xs text-[#647C75]">{formatNumber(commercialData.referrals?.activeAgents || 0)} active of {formatNumber(commercialData.referrals?.totalAgents || 0)} referral agents</p></div><Link to="/admin/agents" className="whitespace-nowrap text-xs font-semibold text-[#0D915C] hover:text-[#013E43]">Manage <FiArrowRight className="inline" /></Link></div>
            <div className="mt-4 grid grid-cols-3 divide-x divide-[#EEF4F0] border-y border-[#EEF4F0] py-3"><CompactMetric label="Referred landlords" value={formatNumber(commercialData.referrals?.referredLandlords || 0)} /><CompactMetric label="Paid conversions" value={formatNumber(commercialData.referrals?.paidLandlords || 0)} /><CompactMetric label="Conversion" value={`${commercialData.referrals?.conversionRate || 0}%`} /></div>
            <div className="mt-3 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs"><span className="text-[#647C75]">Attributed successful payments</span><strong className="text-[#013E43]">{formatCurrency(commercialData.referrals?.attributedPayments || 0)}</strong></div>
            <div className="mt-1 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs"><span className="text-[#647C75]">Estimated commission</span><strong className="text-[#013E43]">{formatCurrency(commercialData.referrals?.estimatedCommission || 0)}</strong></div>
            <p className="mt-2 text-[10px] leading-4 text-[#647C75]">Current commission rates applied to historical successful payments. This is an estimate, not a payout balance.</p>
            {(commercialData.referrals?.topAgents || []).length ? <div className="mt-4 border-t border-[#EEF4F0] pt-3"><p className="mb-2 text-[11px] font-semibold uppercase text-[#647C75]">Leading by landlord referrals</p><div className="space-y-2">{commercialData.referrals.topAgents.slice(0, 3).map((agent) => <Link key={agent.id} to="/admin/agents" className="flex items-center justify-between gap-3 text-xs hover:text-[#0D915C]"><span className="min-w-0 truncate font-medium text-[#013E43]">{agent.name} <span className="text-[#8A9C96]">{agent.status}</span></span><span className="whitespace-nowrap text-[#647C75]">{formatNumber(agent.referredLandlords)} · {formatNumber(agent.paidLandlords)} paid</span></Link>)}</div></div> : null}
          </div>

          <div className="min-w-0 px-4 py-5 sm:px-5">
            <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-[#013E43]">WhatsApp listing add-on</h3><p className="mt-1 text-xs text-[#647C75]">Standalone paid access · KES {formatNumber(commercialData.whatsappAddon?.monthlyPrice || 300)}/month</p></div><Link to="/admin/subscriptions" className="whitespace-nowrap text-xs font-semibold text-[#0D915C] hover:text-[#013E43]">Plans <FiArrowRight className="inline" /></Link></div>
            <p className="mt-4 text-2xl font-semibold text-[#013E43]">{formatNumber(commercialData.whatsappAddon?.activeAccess || 0)}<span className="ml-2 text-xs font-medium text-[#647C75]">active access</span></p>
            <div className="mt-4 divide-y divide-[#EEF4F0] border-y border-[#EEF4F0]">
              <AddonStatus label="Auto-renewing" value={commercialData.whatsappAddon?.autoRenewing || 0} />
              <AddonStatus label="Non-renewing, access not expired" value={commercialData.whatsappAddon?.nonRenewing || 0} />
              <AddonStatus label="Payment pending" value={commercialData.whatsappAddon?.pendingPayment || 0} />
              <AddonStatus label="Past due" value={commercialData.whatsappAddon?.pastDue || 0} />
            </div>
            <div className="mt-3 flex justify-between gap-3 text-xs"><span className="text-[#647C75]">Estimated monthly recurring</span><strong className="text-[#013E43]">{formatCurrency(commercialData.whatsappAddon?.estimatedMonthlyRecurring || 0)}</strong></div>
            <p className="mt-2 text-[10px] leading-4 text-[#647C75]">Estimate uses KES 300 × active auto-renewing add-ons; add-on receipts are not separately recorded. Premium and Pro include WhatsApp listing and are not counted here.</p>
          </div>
        </div> : null}
      </section>

      <section className="border-y border-[#DDEAE3] bg-white">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8F0EB] px-4 py-4 sm:px-5"><div><h2 className="font-semibold text-[#013E43]">Recent activity</h2><p className="mt-0.5 text-xs text-[#647C75]">Click an event to open its workspace.</p></div><span className="text-xs text-[#647C75]">Auto-refresh · 45s</span></div>
          <div className="flex flex-wrap gap-1 border-b border-[#EEF4F0] px-4 py-2 sm:px-5">{[["all", "All"], ["property", "Properties"], ["people", "People & revenue"], ["app", "App"]].map(([value, label]) => <button key={value} onClick={() => setActivityFilter(value)} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${activityFilter === value ? "bg-[#013E43] text-white" : "text-[#647C75] hover:bg-[#F1F7F3] hover:text-[#013E43]"}`}>{label}</button>)}</div>
          <div className="divide-y divide-[#EEF4F0]">
            {activityItems.length ? activityItems.slice(0, 8).map((activity, index) => {
              const Icon = activityIcons[activity.type] || FiCheckCircle;
              return <Link key={`${activity.type}-${activity.createdAt}-${index}`} to={activity.path || "/admin/dashboard"} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition hover:bg-[#F6FAF7] sm:px-5"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#F1F7F3] text-[#0D915C]"><Icon /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#013E43]">{activity.description}</span><span className="block truncate text-xs text-[#647C75]">{activity.details}</span></span><span className="whitespace-nowrap text-[11px] text-[#647C75]">{formatActivityTime(activity.createdAt)}</span></Link>;
            }) : <p className="px-5 py-10 text-center text-sm text-[#647C75]">No activity in this view yet.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

function QueueLink({ label, value, path, icon: Icon, detail }) {
  return <Link to={path} className="group flex items-center gap-3 px-4 py-3 transition hover:bg-[#F6FAF7] sm:px-5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#F1F7F3] text-[#0D915C]">{createElement(Icon)}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#013E43]">{label}</span>{detail ? <span className="block truncate text-xs text-[#647C75]">{detail}</span> : null}</span><span className={`min-w-8 rounded-full px-2 py-1 text-center text-xs font-bold ${value > 0 ? "bg-amber-50 text-amber-800" : "bg-[#F1F7F3] text-[#647C75]"}`}>{formatNumber(value)}</span><FiArrowRight className="text-sm text-[#9AAEA6] transition group-hover:translate-x-1 group-hover:text-[#0D915C]" /></Link>;
}

function PlanMixRow({ plan, total }) {
  const label = { normal: "Free", basic: "Basic", premium: "Premium", pro: "Pro" }[plan.plan] || plan.plan;
  const percentage = total ? Math.min(100, Math.round((plan.current / total) * 100)) : 0;
  return <div>
    <div className="flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-[#013E43]">{label}</span><span className="text-[#647C75]">{formatNumber(plan.current)} current</span></div>
    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#EEF4F0]"><div className="h-full rounded-full bg-[#16865A] transition-all" style={{ width: `${percentage}%` }} /></div>
    <div className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-[#83958E]"><span>{percentage}% of landlords</span>{plan.grace ? <span>{formatNumber(plan.grace)} grace</span> : null}{plan.pending ? <span>{formatNumber(plan.pending)} awaiting payment</span> : null}</div>
  </div>;
}

function CompactMetric({ label, value }) {
  return <div className="min-w-0 px-2 first:pl-0 last:pr-0"><p className="truncate text-[10px] font-medium text-[#647C75]">{label}</p><p className="mt-1 truncate text-base font-semibold text-[#013E43]">{value}</p></div>;
}

function AddonStatus({ label, value }) {
  return <div className="flex items-center justify-between gap-3 py-2 text-xs"><span className="text-[#647C75]">{label}</span><span className="font-semibold text-[#013E43]">{formatNumber(value)}</span></div>;
}

function HealthStatusItem({ label, status, detail, icon: Icon }) {
  const stateLabel = {
    responding: "Responding",
    connected: "Connected",
    configured: "Configured",
    missing_configuration: "Not configured",
    disconnected: "Disconnected",
    unavailable: "Unavailable",
    informational: "Info"
  }[status] || "Unknown";
  const tone = ["responding", "connected", "configured"].includes(status)
    ? "bg-emerald-50 text-emerald-800"
    : status === "informational"
      ? "bg-[#F1F7F3] text-[#647C75]"
      : "bg-amber-50 text-amber-800";
  return <div className="flex min-w-0 items-start gap-2.5"><span className="mt-0.5 text-[#7B9389]">{createElement(Icon)}</span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-[#013E43]">{label}</span>{detail ? <span className="mt-0.5 block text-[10px] text-[#647C75]">{detail}</span> : null}</span><span className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold ${tone}`}>{stateLabel}</span></div>;
}

function formatUptime(seconds = 0) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days ? `${days}d ` : ""}${hours}h ${minutes}m`;
}

function formatDateTime(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" });
}

function ChartPlaceholder() {
  return <div className="flex h-full items-center justify-center rounded-md bg-[#F8FBF9]"><div className="h-7 w-7 animate-spin rounded-full border-2 border-[#DDEAE3] border-t-[#0D915C]" /></div>;
}

const chartLabels = (rows) => rows.map(({ date }) => new Date(`${date}T12:00:00+03:00`).toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "Africa/Nairobi" }));
const chartGrid = { color: "#E8F0EB", drawBorder: false };
const chartTicks = { color: "#647C75", font: { size: 10 }, maxTicksLimit: 7 };

function buildActivityChart(rows) {
  const line = (label, key, color) => ({
    label,
    data: rows.map((row) => row[key]),
    borderColor: color,
    backgroundColor: color,
    borderWidth: 2,
    pointRadius: rows.length > 31 ? 0 : 2,
    pointHoverRadius: 4,
    tension: 0.3
  });
  return {
    labels: chartLabels(rows),
    datasets: [
      line("New landlords", "landlords", "#16865A"),
      line("Listings submitted", "listingsSubmitted", "#2674C8"),
      line("Listings approved", "listingsApproved", "#D18A17"),
      line("Listing inquiries", "inquiries", "#B95067"),
      line("Stay requests", "stayRequests", "#178C91")
    ]
  };
}

function buildPaymentChart(rows) {
  return {
    labels: chartLabels(rows),
    datasets: [{
      label: "KES received",
      data: rows.map((row) => row.amount),
      backgroundColor: "#16865A",
      borderRadius: 3,
      maxBarThickness: 18
    }]
  };
}

const activityChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: { position: "bottom", labels: { color: "#425D55", usePointStyle: true, boxWidth: 7, padding: 14, font: { size: 10 } } },
    tooltip: { mode: "index", intersect: false }
  },
  scales: {
    x: { grid: { display: false }, ticks: chartTicks },
    y: { beginAtZero: true, grid: chartGrid, ticks: { ...chartTicks, precision: 0 } }
  }
};

const paymentChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: ({ raw }) => formatCurrency(raw) } } },
  scales: {
    x: { grid: { display: false }, ticks: chartTicks },
    y: { beginAtZero: true, grid: chartGrid, ticks: { ...chartTicks, callback: (value) => new Intl.NumberFormat("en-KE", { notation: "compact", maximumFractionDigits: 0 }).format(value) } }
  }
};
