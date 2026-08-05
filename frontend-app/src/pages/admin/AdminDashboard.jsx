import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminSummary, getRecentActivity } from "../../services/admin.service";
import {
  FiAlertCircle,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiGrid,
  FiHelpCircle,
  FiMessageSquare,
  FiRefreshCw,
  FiUsers
} from "react-icons/fi";

const defaultSummary = {
  pendingListings: 0,
  approvedListings: 0,
  rejectedListings: 0,
  landlords: 0,
  tenants: 0,
  totalListings: 0,
  totalInquiries: 0,
  totalRevenue: 0,
  activeSubscriptions: 0,
  pendingPayments: 0,
  totalSupportTickets: 0,
  openSupportTickets: 0
};

const activityMap = {
  listing_submission: { path: "/admin/listings/pending", icon: FiClock, label: "Listing" },
  payment_received: { path: "/admin/payments", icon: FiCreditCard, label: "Payment" },
  inquiry_sent: { path: "/admin/inquiries", icon: FiMessageSquare, label: "Inquiry" },
  support_ticket: { path: "/admin/support", icon: FiHelpCircle, label: "Support" }
};

export default function AdminDashboard() {
  const [summary, setSummary] = useState(defaultSummary);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboardData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      if (!showLoader) setRefreshing(true);
      setError("");

      const [summaryData, activityData] = await Promise.all([
        getAdminSummary(),
        getRecentActivity().catch(() => ({ activities: [] }))
      ]);

      setSummary({ ...defaultSummary, ...(summaryData.summary || {}) });
      setRecentActivity(activityData.activities || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(false), 20000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (value) => new Intl.NumberFormat("en-KE").format(value || 0);
  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0
    }).format(value || 0);

  const reviewLoad = summary.pendingListings + summary.openSupportTickets + summary.pendingPayments;
  const approvalRate = summary.totalListings ? Math.round((summary.approvedListings / summary.totalListings) * 100) : 0;

  const metrics = useMemo(
    () => [
      {
        label: "Live listings",
        value: formatNumber(summary.approvedListings),
        detail: `${formatNumber(summary.totalListings)} total listings`,
        icon: FiGrid,
        path: "/admin/listings"
      },
      {
        label: "Revenue",
        value: formatCurrency(summary.totalRevenue),
        detail: `${formatNumber(summary.activeSubscriptions)} active subscriptions`,
        icon: FiCreditCard,
        path: "/admin/payments"
      },
      {
        label: "Landlords",
        value: formatNumber(summary.landlords),
        detail: "Registered property owners",
        icon: FiUsers,
        path: "/admin/landlords"
      },
      {
        label: "Inquiries",
        value: formatNumber(summary.totalInquiries),
        detail: "Tenant messages received",
        icon: FiMessageSquare,
        path: "/admin/inquiries"
      }
    ],
    [summary]
  );

  const priorityItems = [
    {
      label: "Pending listings",
      value: summary.pendingListings,
      detail: "Listings waiting for approval",
      path: "/admin/listings/pending",
      icon: FiClock
    },
    {
      label: "Open support",
      value: summary.openSupportTickets,
      detail: `${summary.totalSupportTickets} total tickets`,
      path: "/admin/support",
      icon: FiHelpCircle
    },
    {
      label: "Pending payments",
      value: summary.pendingPayments,
      detail: "Payments or plans needing review",
      path: "/admin/payments",
      icon: FiCreditCard
    }
  ];

  const quickActions = [
    { label: "Review listings", path: "/admin/listings/pending", icon: FiClock },
    { label: "Open inquiries", path: "/admin/inquiries", icon: FiMessageSquare },
    { label: "Check payments", path: "/admin/payments", icon: FiCreditCard },
    { label: "Support queue", path: "/admin/support", icon: FiHelpCircle }
  ];

  const formatActivityTime = (date) => {
    const value = new Date(date);
    const diffInSeconds = Math.floor((Date.now() - value.getTime()) / 1000);

    if (Number.isNaN(value.getTime())) return "";
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
    return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <div className="rounded-xl border border-[#DDEAE3] bg-white px-8 py-7 text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-[#DDEAE3] border-t-[#0D915C]" />
          <p className="text-sm font-semibold text-[#013E43]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-red-100 bg-white p-7 text-center">
        <FiAlertCircle className="mx-auto mb-3 text-3xl text-red-500" />
        <p className="text-sm font-semibold text-[#013E43]">{error}</p>
        <button
          onClick={() => fetchDashboardData()}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#013E43] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <FiRefreshCw />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#A8D8C1] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0D915C]">Admin Dashboard</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#013E43]">Platform overview</h2>
            <p className="mt-1 max-w-2xl text-sm text-[#647C75]">
              Monitor listings, payments, landlord activity, inquiries, and support work from one clean view.
            </p>
          </div>
          <button
            onClick={() => fetchDashboardData(false)}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#A8D8C1] bg-[#F0F7F4] px-3 py-2 text-sm font-semibold text-[#013E43] hover:border-[#02BB31] hover:bg-white"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.path}
              to={action.path}
              className="group rounded-xl border border-[#A8D8C1] bg-white p-4 text-center text-[#013E43] shadow-sm transition hover:-translate-y-0.5 hover:border-[#02BB31] hover:bg-gradient-to-r hover:from-[#02BB31] hover:to-[#0D915C] hover:text-white hover:shadow-lg hover:shadow-[#02BB31]/20"
            >
              <Icon className="mx-auto mb-2 text-xl text-[#02BB31] transition group-hover:text-white" />
              <span className="text-sm font-semibold">{action.label}</span>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Link key={metric.label} to={metric.path} className="group rounded-xl border border-[#A8D8C1] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#02BB31] hover:shadow-lg">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F0F7F4] text-[#02BB31] transition group-hover:bg-[#02BB31] group-hover:text-white">
                  <Icon />
                </span>
                <FiArrowRight className="text-[#8A9C96] transition group-hover:translate-x-1 group-hover:text-[#02BB31]" />
              </div>
              <p className="mt-4 text-sm font-medium text-[#647C75]">{metric.label}</p>
              <p className="mt-1 text-2xl font-semibold text-[#013E43]">{metric.value}</p>
              <p className="mt-1 text-xs text-[#647C75]">{metric.detail}</p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-xl border border-[#A8D8C1] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#DDEAE3] px-5 py-4">
            <div>
              <h3 className="font-semibold text-[#013E43]">Needs attention</h3>
              <p className="text-xs text-[#647C75]">{formatNumber(reviewLoad)} open admin tasks</p>
            </div>
          </div>
          <div className="divide-y divide-[#EEF4F0]">
            {priorityItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path} className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4 transition hover:bg-[#F0F7F4]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F0F7F4] text-[#02BB31] transition group-hover:bg-[#02BB31] group-hover:text-white">
                    <Icon />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[#013E43]">{item.label}</span>
                    <span className="block text-xs text-[#647C75]">{item.detail}</span>
                  </span>
                  <span className="text-lg font-semibold text-[#013E43]">{formatNumber(item.value)}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-[#A8D8C1] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#DDEAE3] px-5 py-4">
            <div>
              <h3 className="font-semibold text-[#013E43]">Recent activity</h3>
              <p className="text-xs text-[#647C75]">Latest platform events</p>
            </div>
            <span className="text-xs text-[#647C75]">Auto-refresh</span>
          </div>
          <div className="divide-y divide-[#EEF4F0]">
            {recentActivity.length ? (
              recentActivity.slice(0, 7).map((activity, index) => {
                const config = activityMap[activity.type] || { path: "/admin/dashboard", icon: FiCheckCircle, label: "Activity" };
                const Icon = config.icon;

                return (
                  <Link
                    key={`${activity.type}-${activity.createdAt}-${index}`}
                    to={config.path}
                    className="group grid grid-cols-[auto_1fr_auto] items-start gap-3 px-5 py-4 transition hover:bg-[#F0F7F4]"
                  >
                    <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#F0F7F4] text-[#02BB31] transition group-hover:bg-[#02BB31] group-hover:text-white">
                      <Icon />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[#013E43]">{activity.description}</span>
                      <span className="mt-0.5 block truncate text-xs text-[#647C75]">{activity.details || config.label}</span>
                    </span>
                    <span className="whitespace-nowrap text-xs text-[#647C75]">{formatActivityTime(activity.createdAt)}</span>
                  </Link>
                );
              })
            ) : (
              <div className="px-5 py-10 text-center">
                <FiCheckCircle className="mx-auto mb-2 text-2xl text-[#0D915C]" />
                <p className="text-sm font-semibold text-[#013E43]">No recent activity yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Insight label="Approval rate" value={`${approvalRate}%`} detail={`${formatNumber(summary.rejectedListings)} rejected listings`} />
        <Insight label="Tenant demand" value={formatNumber(summary.totalInquiries)} detail="Total property inquiries" />
        <Insight label="Support status" value={summary.openSupportTickets ? "Open items" : "Clear"} detail={`${formatNumber(summary.totalSupportTickets)} support tickets tracked`} />
      </section>
    </div>
  );
}

function Insight({ label, value, detail }) {
  return (
    <div className="rounded-xl border border-[#A8D8C1] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#02BB31] hover:shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#647C75]">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[#013E43]">{value}</p>
      <p className="mt-1 text-sm text-[#647C75]">{detail}</p>
    </div>
  );
}
