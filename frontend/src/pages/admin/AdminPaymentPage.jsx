import { useEffect, useMemo, useState } from "react";
import { getAdminPayments } from "../../services/admin.service";
import { Link } from "react-router-dom";
import { 
  FiDollarSign, 
  FiCreditCard, 
  FiCalendar, 
  FiUser,
  FiMail,

  FiPhone,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiTrendingUp,
  FiArrowRight,
  FiClock,
  FiInfo,
  FiDownload,
  FiEye
} from "react-icons/fi";
import { FaBuilding, FaKey } from "react-icons/fa";
import toast from "react-hot-toast";

const statusClasses = {
  free: "bg-gray-100 text-gray-600",
  pending_payment: "bg-yellow-100 text-yellow-600",
  active: "bg-[#02BB31]/10 text-[#02BB31]",
  grace: "bg-orange-100 text-orange-600",
  expired: "bg-red-100 text-red-600",
  cancelled: "bg-gray-100 text-gray-600"
};

const paymentClasses = {
  success: "bg-[#02BB31]/10 text-[#02BB31]",
  failed: "bg-red-100 text-red-600",
  pending: "bg-yellow-100 text-yellow-600"
};

const statusIcons = {
  free: <FiInfo className="text-gray-500" />,
  pending_payment: <FiAlertCircle className="text-yellow-500" />,
  active: <FiCheckCircle className="text-[#02BB31]" />,
  grace: <FiAlertCircle className="text-orange-500" />,
  expired: <FiAlertCircle className="text-red-500" />,
  cancelled: <FiAlertCircle className="text-gray-500" />
};

const AdminPaymentsPage = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminPayments();
      setRecords(data.records || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load payment records");
      toast.error("Failed to load payment records", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [records, filter, searchTerm, dateRange]);

  const filterPayments = () => {
    let filtered = [...records];

    // Status filter
    if (filter !== "all") {
      filtered = filtered.filter((item) => item.subscription?.status === filter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.landlord?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.landlord?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.latestPayment?.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter
    if (dateRange !== "all" && records.length > 0) {
      const now = new Date();
      const filterDate = new Date();
      
      switch(dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(item => 
            item.latestPayment?.paidAt && new Date(item.latestPayment.paidAt) >= filterDate
          );
          break;
        case "week":
          filterDate.setDate(filterDate.getDate() - 7);
          filtered = filtered.filter(item => 
            item.latestPayment?.paidAt && new Date(item.latestPayment.paidAt) >= filterDate
          );
          break;
        case "month":
          filterDate.setMonth(filterDate.getMonth() - 1);
          filtered = filtered.filter(item => 
            item.latestPayment?.paidAt && new Date(item.latestPayment.paidAt) >= filterDate
          );
          break;
      }
    }

    // Sort by latest payment date (newest first)
    filtered.sort((a, b) => {
      const dateA = a.latestPayment?.paidAt ? new Date(a.latestPayment.paidAt) : new Date(0);
      const dateB = b.latestPayment?.paidAt ? new Date(b.latestPayment.paidAt) : new Date(0);
      return dateB - dateA;
    });

    setFilteredRecords(filtered);
  };

  const getStatusBadge = (status) => {
    const statusKey = status?.replace("_", " ") || "N/A";
    const style = statusClasses[status] || "bg-gray-100 text-gray-600";
    const Icon = statusIcons[status] || <FiInfo className="text-gray-500" />;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style}`}>
        {Icon}
        <span className="ml-1 capitalize">{statusKey}</span>
      </span>
    );
  };

  const getPaymentBadge = (status) => {
    const style = paymentClasses[status] || "bg-gray-100 text-gray-600";
    let Icon;
    switch(status) {
      case "success":
        Icon = <FiCheckCircle className="mr-1" />;
        break;
      case "failed":
        Icon = <FiAlertCircle className="mr-1" />;
        break;
      case "pending":
        Icon = <FiClock className="mr-1" />;
        break;
      default:
        Icon = null;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style}`}>
        {Icon}
        {status?.toUpperCase() || "N/A"}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount, currency = "KES") => {
    if (!amount) return "—";
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const stats = {
    total: records.length,
    totalRevenue: records.reduce((sum, r) => sum + (r.latestPayment?.amount || 0), 0),
    activeSubscriptions: records.filter(r => r.subscription?.status === "active").length,
    pendingPayments: records.filter(r => r.subscription?.status === "pending_payment").length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading payment records...</p>
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
          onClick={fetchPayments}
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
              <FiDollarSign className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">Payments & Subscriptions</h1>
              <p className="text-sm text-[#065A57]">
                Track landlord billing state, latest payments, and subscription health
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchPayments}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              className="px-4 py-2 bg-[#013E43] text-white rounded-lg hover:bg-[#005C57] transition-colors flex items-center space-x-2"
            >
              <FiDownload />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#013E43]">
          <p className="text-sm text-[#065A57]">Total Records</p>
          <p className="text-2xl font-bold text-[#013E43]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#02BB31]">
          <p className="text-sm text-[#065A57]">Total Revenue</p>
          <p className="text-2xl font-bold text-[#02BB31]">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-purple-400">
          <p className="text-sm text-[#065A57]">Active Subscriptions</p>
          <p className="text-2xl font-bold text-purple-600">{stats.activeSubscriptions}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-yellow-400">
          <p className="text-sm text-[#065A57]">Pending Payments</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pendingPayments}</p>
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
              placeholder="Search by landlord name, email, or transaction reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
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
          Showing {filteredRecords.length} of {records.length} payment records
        </div>
      </div>

      {/* Payment Records List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
          <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiDollarSign className="text-3xl text-[#A8D8C1]" />
          </div>
          <h2 className="text-lg font-semibold text-[#013E43] mb-2">No records found</h2>
          <p className="text-sm text-[#065A57]">
            {searchTerm || filter !== "all" || dateRange !== "all"
              ? "Try adjusting your search or filters"
              : "There are no billing records available yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredRecords.map((record) => (
            <div
              key={record._id}
              className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Column - Landlord Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {record.landlord?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-[#013E43]">
                            {record.landlord?.name}
                          </h2>
                          <p className="text-sm text-[#065A57]">
                            {record.landlord?.email}
                          </p>
                          {record.landlord?.phone && (
                            <p className="text-xs text-[#065A57] mt-1 flex items-center">
                              <FiPhone className="mr-1" /> {record.landlord.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(record.subscription?.status)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                      <div className="bg-[#F0F7F4] rounded-xl p-3">
                        <p className="text-xs text-[#065A57] uppercase tracking-wide">Plan</p>
                        <p className="mt-1 font-semibold text-[#013E43] capitalize">
                          {record.subscription?.plan || "Free"}
                        </p>
                        <p className="text-xs text-[#065A57]">
                          Limit: {record.subscription?.listingLimit || 1}
                        </p>
                      </div>

                      <div className="bg-[#F0F7F4] rounded-xl p-3">
                        <p className="text-xs text-[#065A57] uppercase tracking-wide">Listings</p>
                        <p className="mt-1 font-semibold text-[#013E43]">
                          {record.activeListings || 0} active
                        </p>
                        <p className="text-xs text-[#065A57]">
                          Total: {record.totalListings || 0}
                        </p>
                      </div>

                      <div className="bg-[#F0F7F4] rounded-xl p-3">
                        <p className="text-xs text-[#065A57] uppercase tracking-wide">Billing End</p>
                        <p className="mt-1 font-semibold text-[#013E43]">
                          {record.subscription?.currentPeriodEnd
                            ? formatDate(record.subscription.currentPeriodEnd)
                            : "—"}
                        </p>
                        {record.subscription?.gracePeriodEnd && (
                          <p className="mt-1 text-xs text-orange-600">
                            Grace until {formatDate(record.subscription.gracePeriodEnd)}
                          </p>
                        )}
                      </div>

                      <div className="bg-[#F0F7F4] rounded-xl p-3">
                        <p className="text-xs text-[#065A57] uppercase tracking-wide">Latest Payment</p>
                        <p className="mt-1 font-semibold text-[#013E43]">
                          {record.latestPayment
                            ? formatCurrency(record.latestPayment.amount, record.latestPayment.currency)
                            : "No payment"}
                        </p>
                        {record.latestPayment?.paidAt && (
                          <p className="text-xs text-[#065A57]">
                            {formatDate(record.latestPayment.paidAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Transaction Details */}
                  <div className="lg:w-80">
                    <div className="bg-[#F0F7F4] rounded-xl p-4 border border-[#A8D8C1]">
                      <p className="text-sm font-medium text-[#013E43] flex items-center">
                        <FiCreditCard className="mr-2 text-[#02BB31]" />
                        Latest Transaction
                      </p>

                      {record.latestPayment ? (
                        <div className="mt-3 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-[#065A57]">Reference:</span>
                            <span className="font-mono text-xs text-[#013E43]">
                              {record.latestPayment.reference?.slice(-8)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#065A57]">Plan:</span>
                            <span className="font-medium capitalize text-[#013E43]">
                              {record.latestPayment.plan || record.subscription?.plan || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#065A57]">Amount:</span>
                            <span className="font-bold text-[#02BB31]">
                              {formatCurrency(record.latestPayment.amount, record.latestPayment.currency)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-[#065A57]">Status:</span>
                            {getPaymentBadge(record.latestPayment.status)}
                          </div>
                          {record.latestPayment.paidAt && (
                            <div className="flex justify-between">
                              <span className="text-[#065A57]">Date:</span>
                              <span className="text-[#013E43]">{formatDate(record.latestPayment.paidAt)}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-[#065A57]">
                          No payment record available yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPaymentsPage;