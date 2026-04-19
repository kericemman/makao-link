import { useEffect, useState } from "react";
import { getAdminSubscriptions } from "../../services/admin.service";
import { 
  FiCreditCard, 
  FiCalendar, 
  FiCheckCircle, 
  FiAlertCircle,
  FiClock,
  FiShield,
  FiDollarSign,
  FiTrendingUp,
  FiHome,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiUser,
  FiMail,
  FiPhone,
  FiArrowRight,
  FiInfo,
  FiBarChart2,
  FiAward,
  FiStar,
  FiZap,
  FiXCircle,
  FiEye
} from "react-icons/fi";
import { FaKey, FaBuilding, FaHandshake } from "react-icons/fa";
import toast from "react-hot-toast";

const statusClasses = {
  free: "bg-gray-100 text-gray-600 border-gray-200",
  pending_payment: "bg-yellow-100 text-yellow-600 border-yellow-200",
  active: "bg-[#02BB31]/10 text-[#02BB31] border-[#02BB31]/20",
  grace: "bg-orange-100 text-orange-600 border-orange-200",
  expired: "bg-red-100 text-red-600 border-red-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200"
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
  normal: "from-gray-400 to-gray-500",
  basic: "from-[#02BB31] to-[#0D915C]",
  premium: "from-purple-400 to-purple-500",
  pro: "from-[#013E43] to-[#005C57]"
};

const AdminSubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [status, setStatus] = useState("all");
  const [plan, setPlan] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchSubscriptions = async () => {
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
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [status, plan]);

  useEffect(() => {
    filterSubscriptions();
  }, [subscriptions, searchTerm, dateRange]);

  const filterSubscriptions = () => {
    let filtered = [...subscriptions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.user?.phone?.includes(searchTerm)
      );
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
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
    
    setFilteredSubscriptions(filtered);
  };

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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-[#A8D8C1]">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="text-3xl text-red-500" />
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchSubscriptions}
          className="px-4 py-2 bg-[#02BB31] text-white rounded-lg hover:bg-[#0D915C] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl">
              <FiCreditCard className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">Subscriptions</h1>
              <p className="text-sm text-[#065A57]">
                Track landlord subscription health across the platform
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchSubscriptions}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#013E43]">
          <p className="text-sm text-[#065A57]">Total Subscriptions</p>
          <p className="text-2xl font-bold text-[#013E43]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#02BB31]">
          <p className="text-sm text-[#065A57]">Active</p>
          <p className="text-2xl font-bold text-[#02BB31]">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-yellow-400">
          <p className="text-sm text-[#065A57]">Pending Payment</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-red-400">
          <p className="text-sm text-[#065A57]">Expired</p>
          <p className="text-2xl font-bold text-red-500">{stats.expired}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-purple-400">
          <p className="text-sm text-[#065A57]">Monthly Revenue</p>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.revenue)}</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-4 border border-[#A8D8C1]">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#065A57]" />
            <input
              type="text"
              placeholder="Search by landlord name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
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
              className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
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
              className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-[#065A57]">
          Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions
        </div>
      </div>

      {/* Subscriptions Grid */}
      {filteredSubscriptions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
          <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCreditCard className="text-3xl text-[#A8D8C1]" />
          </div>
          <h2 className="text-lg font-semibold text-[#013E43] mb-2">No subscriptions found</h2>
          <p className="text-sm text-[#065A57]">
            {searchTerm || status !== "all" || plan !== "all" || dateRange !== "all"
              ? "Try adjusting your search or filters"
              : "No subscriptions have been created yet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSubscriptions.map((subscription) => {
            const planColor = planColors[subscription.plan] || "from-gray-400 to-gray-500";
            
            return (
              <div
                key={subscription._id}
                className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                onClick={() => {
                  setSelectedSubscription(subscription);
                  setShowDetailsModal(true);
                }}
              >
                <div className={`h-1.5 bg-gradient-to-r ${planColor}`}></div>
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {subscription.user?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold text-[#013E43]">
                              {subscription.user?.name || "Unknown User"}
                            </h2>
                            <p className="text-sm text-[#065A57] flex items-center gap-2">
                              <FiMail className="text-[#02BB31]" />
                              {subscription.user?.email || "No email"}
                              {subscription.user?.phone && (
                                <>
                                  <span className="w-1 h-1 bg-[#A8D8C1] rounded-full"></span>
                                  <FiPhone className="text-[#02BB31]" />
                                  {subscription.user.phone}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${statusClasses[subscription.status]}`}>
                          {statusIcons[subscription.status]}
                          <span className="ml-1">{subscription.status?.replace("_", " ")}</span>
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#F0F7F4] text-[#013E43] uppercase">
                          {subscription.plan}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="bg-[#F0F7F4] rounded-xl p-3">
                          <p className="text-xs text-[#065A57]">Active Listings</p>
                          <p className="text-lg font-bold text-[#013E43]">{subscription.activeListings || 0}</p>
                        </div>

                        <div className="bg-[#F0F7F4] rounded-xl p-3">
                          <p className="text-xs text-[#065A57]">Amount</p>
                          <p className="text-lg font-bold text-[#02BB31]">{formatCurrency(subscription.amount || 0)}</p>
                        </div>

                        <div className="bg-[#F0F7F4] rounded-xl p-3">
                          <p className="text-xs text-[#065A57]">Period Start</p>
                          <p className="text-sm font-semibold text-[#013E43]">
                            {subscription.currentPeriodStart
                              ? formatDate(subscription.currentPeriodStart)
                              : "—"}
                          </p>
                        </div>

                        <div className="bg-[#F0F7F4] rounded-xl p-3">
                          <p className="text-xs text-[#065A57]">Period End</p>
                          <p className="text-sm font-semibold text-[#013E43]">
                            {subscription.currentPeriodEnd
                              ? formatDate(subscription.currentPeriodEnd)
                              : "—"}
                          </p>
                        </div>
                      </div>

                      {subscription.gracePeriodEnd && (
                        <div className="mt-3 rounded-xl bg-orange-50 p-3 text-sm text-orange-700 border border-orange-200">
                          <div className="flex items-center gap-2">
                            <FiAlertCircle className="text-orange-500" />
                            <span>Grace ends on {formatDate(subscription.gracePeriodEnd)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center text-[#02BB31] font-medium">
                      View Details
                      <FiArrowRight className="ml-2" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-[#A8D8C1] p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl">
                  <FiCreditCard className="text-white text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#013E43]">Subscription Details</h2>
                  <p className="text-sm text-[#065A57]">ID: {selectedSubscription._id.slice(-8)}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedSubscription(null);
                  setShowDetailsModal(false);
                }}
                className="p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
              >
                <FiXCircle className="text-xl text-[#065A57]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Landlord Info */}
              <div className="bg-[#F0F7F4] rounded-xl p-4">
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
              <div className="flex justify-end pt-4 border-t border-[#A8D8C1]">
                <button
                  onClick={() => {
                    setSelectedSubscription(null);
                    setShowDetailsModal(false);
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
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