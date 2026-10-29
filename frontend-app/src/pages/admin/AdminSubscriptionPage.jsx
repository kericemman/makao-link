import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminSubscriptions } from "../../services/admin.service";
import { 
  FiCreditCard, 
  FiCheckCircle, 
  FiAlertCircle,
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiMail,
  FiPhone,
  FiArrowRight,
  FiInfo,
  FiXCircle,
  FiEye
} from "react-icons/fi";
import toast from "react-hot-toast";

const statusClasses = {
  free: "bg-[#F1F5F3] text-[#526760]",
  pending_payment: "bg-amber-50 text-amber-800",
  active: "bg-emerald-50 text-emerald-800",
  grace: "bg-orange-50 text-orange-800",
  expired: "bg-red-50 text-red-700",
  cancelled: "bg-[#F1F5F3] text-[#526760]"
};

const statusIcons = {
  free: <FiInfo className="text-gray-500" />,
  pending_payment: <FiClock className="text-yellow-500" />,
  active: <FiCheckCircle className="text-[#02BB31]" />,
  grace: <FiAlertCircle className="text-orange-500" />,
  expired: <FiAlertCircle className="text-red-500" />,
  cancelled: <FiXCircle className="text-gray-500" />
};

const planColors = {
  normal: "bg-[#F1F5F3] text-[#526760]",
  basic: "bg-[#EAF5EF] text-[#08764C]",
  premium: "bg-[#FFF5E7] text-[#925B14]",
  pro: "bg-[#E8F0F0] text-[#013E43]"
};

const AdminSubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [status, setStatus] = useState("all");
  const [plan, setPlan] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (status !== "all") params.status = status;
      if (plan !== "all") params.plan = plan;

      const data = await getAdminSubscriptions(params);
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load subscriptions");
      toast.error("Failed to load subscriptions", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  }, [status, plan]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const filteredSubscriptions = useMemo(() => {
    let filtered = [...subscriptions];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(sub => 
        sub.user?.name?.toLowerCase().includes(term) ||
        sub.user?.email?.toLowerCase().includes(term) ||
        sub.user?.phone?.includes(searchTerm.trim())
      );
    }

    // Date range filter
    if (dateRange !== "all") {
      const filterDate = new Date();
      
      switch(dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(sub => new Date(sub.createdAt) >= filterDate);
          break;
        case "week":
          filterDate.setDate(filterDate.getDate() - 7);
          filtered = filtered.filter(sub => new Date(sub.createdAt) >= filterDate);
          break;
        case "month":
          filterDate.setMonth(filterDate.getMonth() - 1);
          filtered = filtered.filter(sub => new Date(sub.createdAt) >= filterDate);
          break;
      }
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return filtered;
  }, [subscriptions, searchTerm, dateRange]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === "active").length,
    pending: subscriptions.filter(s => s.status === "pending_payment").length,
    expired: subscriptions.filter(s => s.status === "expired").length,
    revenue: subscriptions.reduce((sum, s) => {
      if (s.status === "active" && s.amount) {
        return sum + s.amount;
      }
      return sum;
    }, 0)
  };

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-[#DDEAE3] border-t-[#0D915C]" />
          <p className="text-sm font-semibold text-[#013E43]">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="mx-auto max-w-xl border-y border-red-200 bg-white px-5 py-8 text-center">
        <FiAlertCircle className="mx-auto mb-3 text-3xl text-red-600" />
        <p className="text-sm font-semibold text-[#013E43]">{error}</p>
        <button
          onClick={fetchSubscriptions}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0D915C] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#08764C]"
        >
          <FiRefreshCw /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#DDEAE3] pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0D915C]">People &amp; Revenue</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#013E43]">Subscriptions</h1>
          <p className="mt-1 text-sm text-[#647C75]">Review landlord plans, renewal periods, and payment status.</p>
        </div>
        <button
          type="button"
          onClick={fetchSubscriptions}
          className="inline-flex items-center gap-2 rounded-lg border border-[#DDEAE3] bg-white px-3 py-2 text-sm font-semibold text-[#013E43] transition hover:bg-[#F6FAF7]"
        >
          <FiRefreshCw /> Refresh
        </button>
      </header>

      <section aria-label="Subscription summary" className="grid grid-cols-2 gap-y-4 border-b border-[#DDEAE3] py-4 sm:grid-cols-3 lg:grid-cols-5">
        {[
          ["Subscriptions", stats.total],
          ["Active", stats.active],
          ["Pending payment", stats.pending],
          ["Expired", stats.expired],
          ["Active plan value", formatCurrency(stats.revenue)]
        ].map(([label, value], index) => (
          <div key={label} className={`${index ? "sm:border-l sm:border-[#E7F0EA] sm:pl-4" : ""} ${index === 1 ? "pl-3 sm:pl-4" : ""}`}>
            <p className="text-xs font-semibold text-[#647C75]">{label}</p>
            <p className="mt-1 text-xl font-semibold text-[#013E43]">{value}</p>
          </div>
        ))}
      </section>

      <section aria-label="Subscription filters" className="space-y-3 border-b border-[#DDEAE3] pb-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#82958D]" />
            <input
              type="text"
              placeholder="Search by landlord name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#DDEAE3] bg-white py-2.5 pl-10 pr-4 text-sm text-[#013E43] outline-none focus:border-[#0D915C]"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:flex">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter by subscription status"
              className="min-w-0 rounded-lg border border-[#DDEAE3] bg-white px-3 py-2.5 text-sm text-[#013E43] outline-none focus:border-[#0D915C]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="grace">Grace</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
              <option value="free">Free</option>
            </select>

            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              aria-label="Filter by plan"
              className="min-w-0 rounded-lg border border-[#DDEAE3] bg-white px-3 py-2.5 text-sm text-[#013E43] outline-none focus:border-[#0D915C]"
            >
              <option value="all">All Plans</option>
              <option value="normal">Normal</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="pro">Pro</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              aria-label="Filter by signup date"
              className="min-w-0 rounded-lg border border-[#DDEAE3] bg-white px-3 py-2.5 text-sm text-[#013E43] outline-none focus:border-[#0D915C]"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>

        <p className="text-xs text-[#647C75]">Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions in the current result set.</p>
      </section>

      {/* Subscriptions Grid */}
      {filteredSubscriptions.length === 0 ? (
        <div className="border-y border-[#DDEAE3] bg-white px-5 py-12 text-center">
          <FiCreditCard className="mx-auto mb-3 text-3xl text-[#9BB8AA]" />
          <h2 className="text-base font-semibold text-[#013E43]">No subscriptions found</h2>
          <p className="mt-1 text-sm text-[#647C75]">
            {searchTerm || status !== "all" || plan !== "all" || dateRange !== "all"
              ? "Try adjusting your search or filters"
              : "No subscriptions have been created yet"}
          </p>
        </div>
      ) : (
        <div className="border-y border-[#DDEAE3] bg-white">
          <div className="hidden grid-cols-[minmax(190px,1.4fr)_minmax(120px,0.8fr)_minmax(120px,0.8fr)_minmax(130px,0.8fr)_auto] gap-4 border-b border-[#DDEAE3] bg-[#F6FAF7] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[#647C75] lg:grid lg:px-5">
            <span>Landlord</span><span>Plan &amp; status</span><span>Plan value</span><span>Renewal period</span><span className="sr-only">Actions</span>
          </div>
          <div className="divide-y divide-[#E7F0EA]">
            {filteredSubscriptions.map((subscription) => {
              const planColor = planColors[subscription.plan] || planColors.normal;
              const subscriptionStatus = statusClasses[subscription.status] || statusClasses.free;

              return (
                <div key={subscription._id} className="grid gap-3 px-4 py-4 transition hover:bg-[#FAFCFA] lg:grid-cols-[minmax(190px,1.4fr)_minmax(120px,0.8fr)_minmax(120px,0.8fr)_minmax(130px,0.8fr)_auto] lg:items-center lg:gap-4 lg:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF2ED] text-sm font-bold text-[#0D7250]">{subscription.user?.name?.charAt(0).toUpperCase() || "U"}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#013E43]">{subscription.user?.name || "Unknown landlord"}</p>
                      <p className="flex min-w-0 items-center gap-1.5 truncate text-xs text-[#647C75]"><FiMail className="shrink-0" /><span className="truncate">{subscription.user?.email || "No email"}</span></p>
                      {subscription.user?.phone ? <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#647C75]"><FiPhone className="shrink-0" />{subscription.user.phone}</p> : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 lg:flex-col lg:items-start">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${planColor}`}>{subscription.plan || "normal"}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${subscriptionStatus}`}>
                      {statusIcons[subscription.status] || <FiInfo />}
                      {subscription.status?.replace(/_/g, " ") || "unknown"}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#013E43]">{formatCurrency(subscription.amount || 0)}</p>
                    <p className="mt-0.5 text-xs text-[#647C75]">{subscription.activeListings || 0} active listings</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-[#013E43]">{subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : "No renewal date"}</p>
                    <p className="mt-0.5 text-xs text-[#647C75]">{subscription.currentPeriodStart ? `Started ${formatDate(subscription.currentPeriodStart)}` : `Joined ${formatDate(subscription.createdAt)}`}</p>
                    {subscription.gracePeriodEnd ? <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-orange-800"><FiAlertCircle /> Grace to {formatDate(subscription.gracePeriodEnd)}</p> : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setSelectedSubscription(subscription); setShowDetailsModal(true); }}
                    aria-label={`View subscription for ${subscription.user?.name || "landlord"}`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#DDEAE3] px-3 text-sm font-semibold text-[#013E43] transition hover:bg-[#F0F7F4]"
                  >
                    <FiEye /> <span className="lg:hidden">Details</span><span className="hidden lg:inline">Details</span><FiArrowRight className="hidden lg:block" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#062E2B]/55 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[#DDEAE3] bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#DDEAE3] bg-white px-5 py-4 sm:px-6">
              <div className="flex items-center space-x-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0D915C]">Billing record</p>
                  <h2 className="mt-0.5 text-lg font-semibold text-[#013E43]">Subscription details</h2>
                  <p className="text-xs text-[#647C75]">ID: {selectedSubscription._id.slice(-8)}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedSubscription(null);
                  setShowDetailsModal(false);
                }}
                type="button"
                aria-label="Close subscription details"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-[#647C75] transition-colors hover:bg-[#F0F7F4] hover:text-[#013E43]"
              >
                <FiXCircle className="text-xl text-[#065A57]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-6 p-5 sm:p-6">
              {/* Landlord Info */}
              <div className="bg-[#F0F7F4] rounded-md p-4">
                <h3 className="font-semibold text-[#013E43] mb-3">Landlord Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#065A57]">Name</p>
                    <p className="font-medium">{selectedSubscription.user?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#065A57]">Email</p>
                    <p className="font-medium">{selectedSubscription.user?.email}</p>
                  </div>
                  {selectedSubscription.user?.phone && (
                    <div>
                      <p className="text-xs text-[#065A57]">Phone</p>
                      <p className="font-medium">{selectedSubscription.user.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-[#065A57]">Member Since</p>
                    <p className="font-medium">{formatDate(selectedSubscription.user?.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Subscription Details */}
              <div>
                <h3 className="font-semibold text-[#013E43] mb-3">Subscription Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#F0F7F4] p-3 rounded-lg">
                    <p className="text-xs text-[#065A57]">Plan</p>
                    <p className="font-bold text-[#013E43] uppercase">{selectedSubscription.plan}</p>
                  </div>
                  <div className="bg-[#F0F7F4] p-3 rounded-lg">
                    <p className="text-xs text-[#065A57]">Amount</p>
                    <p className="font-bold text-[#02BB31]">{formatCurrency(selectedSubscription.amount)}</p>
                  </div>
                  <div className="bg-[#F0F7F4] p-3 rounded-lg">
                    <p className="text-xs text-[#065A57]">Status</p>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[selectedSubscription.status]}`}>
                        {statusIcons[selectedSubscription.status]}
                        <span className="ml-1">{selectedSubscription.status?.replace("_", " ")}</span>
                      </span>
                    </div>
                  </div>
                  <div className="bg-[#F0F7F4] p-3 rounded-lg">
                    <p className="text-xs text-[#065A57]">Active Listings</p>
                    <p className="font-bold text-[#013E43]">{selectedSubscription.activeListings || 0}</p>
                  </div>
                  <div className="bg-[#F0F7F4] p-3 rounded-lg">
                    <p className="text-xs text-[#065A57]">Current Period Start</p>
                    <p className="font-medium">{selectedSubscription.currentPeriodStart ? formatDate(selectedSubscription.currentPeriodStart) : "—"}</p>
                  </div>
                  <div className="bg-[#F0F7F4] p-3 rounded-lg">
                    <p className="text-xs text-[#065A57]">Current Period End</p>
                    <p className="font-medium">{selectedSubscription.currentPeriodEnd ? formatDate(selectedSubscription.currentPeriodEnd) : "—"}</p>
                  </div>
                  {selectedSubscription.gracePeriodEnd && (
                    <div className="col-span-2 bg-orange-50 p-3 rounded-lg">
                      <p className="text-xs text-[#065A57]">Grace Period End</p>
                      <p className="font-medium text-orange-700">{formatDate(selectedSubscription.gracePeriodEnd)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment History */}
              {selectedSubscription.payments && selectedSubscription.payments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[#013E43] mb-3">Recent Payments</h3>
                  <div className="space-y-2">
                    {selectedSubscription.payments.slice(0, 3).map((payment, idx) => (
                      <div key={idx} className="bg-[#F0F7F4] p-3 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-[#013E43]">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-[#065A57]">Reference: {payment.reference}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#065A57]">{formatDate(payment.createdAt)}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            payment.status === "success" 
                              ? "bg-[#02BB31]/10 text-[#02BB31]" 
                              : "bg-red-100 text-red-600"
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t border-[#E4EEE8]">
                <button
                  onClick={() => {
                    setSelectedSubscription(null);
                    setShowDetailsModal(false);
                  }}
                  className="px-6 py-2 bg-[#02BB31] text-white rounded-lg font-semibold hover:shadow-sm transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionsPage;
