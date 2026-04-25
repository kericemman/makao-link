import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getServiceApplications } from "../../services/admin.service";
import { 
  FiBriefcase, 
  FiMapPin, 
  FiPhone,
  FiUser, 
  FiMail,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiArrowRight,
  FiDollarSign,
  FiEye,
  FiTrendingUp
} from "react-icons/fi";
import { FaBuilding, FaHandshake, FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";

const reviewStatusClasses = {
  pending_review: "bg-yellow-100 text-yellow-600",
  approved: "bg-[#02BB31]/10 text-[#02BB31]",
  rejected: "bg-red-100 text-red-600"
};

const reviewStatusIcons = {
  pending_review: <FiClock className="text-yellow-500" />,
  approved: <FiCheckCircle className="text-[#02BB31]" />,
  rejected: <FiAlertCircle className="text-red-500" />
};

const paymentStatusClasses = {
  pending: "bg-yellow-100 text-yellow-600",
  success: "bg-[#02BB31]/10 text-[#02BB31]",
  failed: "bg-red-100 text-red-600"
};

const paymentStatusIcons = {
  pending: <FiClock className="text-yellow-500" />,
  success: <FiCheckCircle className="text-[#02BB31]" />,
  failed: <FiAlertCircle className="text-red-500" />
};

const AdminServiceApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [reviewStatus, setReviewStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (reviewStatus !== "all") params.status = reviewStatus;
      if (paymentStatus !== "all") params.paymentStatus = paymentStatus;

      const data = await getServiceApplications(params);
      setApplications(data.applications || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load service applications");
      toast.error("Failed to load service applications", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [reviewStatus, paymentStatus]);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, dateRange]);

  const filterApplications = () => {
    let filtered = [...applications];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch(dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(app => new Date(app.createdAt) >= filterDate);
          break;
        case "week":
          filterDate.setDate(filterDate.getDate() - 7);
          filtered = filtered.filter(app => new Date(app.createdAt) >= filterDate);
          break;
        case "month":
          filterDate.setMonth(filterDate.getMonth() - 1);
          filtered = filtered.filter(app => new Date(app.createdAt) >= filterDate);
          break;
      }
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setFilteredApplications(filtered);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const appDate = new Date(date);
    const diffInSeconds = Math.floor((now - appDate) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === "pending_review").length,
    approved: applications.filter(a => a.status === "approved").length,
    rejected: applications.filter(a => a.status === "rejected").length,
    paymentSuccess: applications.filter(a => a.paymentStatus === "success").length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading applications...</p>
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
          onClick={fetchApplications}
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
            
            <div>
              <h1 className="text-xl font-bold text-[#013E43]">Service Applications</h1>
              <p className="text-sm text-[#065A57]">
                Review partner applications, confirm payment state, and approve service listings
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchApplications}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 ">
          <p className="text-sm text-[#065A57]">Total Applications</p>
          <p className="text-2xl font-bold text-[#013E43]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 ">
          <p className="text-sm text-[#065A57]">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 ">
          <p className="text-sm text-[#065A57]">Approved</p>
          <p className="text-2xl font-bold text-[#02BB31]">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 ">
          <p className="text-sm text-[#065A57]">Rejected</p>
          <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 ">
          <p className="text-sm text-[#065A57]">Payment Success</p>
          <p className="text-2xl font-bold text-green-600">{stats.paymentSuccess}</p>
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
              placeholder="Search by company, contact person, email, category, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value)}
              className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
            >
              <option value="all">All Review Status</option>
              <option value="pending_review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
            >
              <option value="all">All Payment Status</option>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
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
          Showing {filteredApplications.length} of {applications.length} applications
        </div>
      </div>

      {/* Applications Grid */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
          <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBriefcase className="text-3xl text-[#A8D8C1]" />
          </div>
          <h2 className="text-lg font-semibold text-[#013E43] mb-2">No applications found</h2>
          <p className="text-sm text-[#065A57]">
            {searchTerm || reviewStatus !== "all" || paymentStatus !== "all" || dateRange !== "all"
              ? "Try adjusting your search or filters"
              : "No service applications have been submitted yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredApplications.map((application) => (
            <Link
              key={application._id}
              to={`/admin/services/applications/${application._id}`}
              className="block bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold text-[#013E43]">
                        {application.companyName}
                      </h2>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${reviewStatusClasses[application.status]}`}>
                        {reviewStatusIcons[application.status]}
                        <span className="ml-1 capitalize">{application.status?.replace("_", " ")}</span>
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatusClasses[application.paymentStatus]}`}>
                        {paymentStatusIcons[application.paymentStatus]}
                        <span className="ml-1 capitalize">Payment: {application.paymentStatus}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-[#065A57] mb-3">
                      <p className="flex items-center">
                        <FiMapPin className="mr-2 text-[#02BB31]" />
                        {application.location || "Location not specified"}
                      </p>
                      <p className="flex items-center">
                        <FaBuilding className="mr-2 text-[#02BB31]" />
                        Category: {application.category || "N/A"}
                      </p>
                      <p className="flex items-center">
                        <FiUser className="mr-2 text-[#02BB31]" />
                        Contact: {application.contactPerson}
                      </p>
                      <p className="flex items-center">
                        <FiMail className="mr-2 text-[#02BB31]" />
                        {application.email}
                      </p>
                      {application.phone && (
                        <p className="flex items-center">
                          <FiPhone className="mr-2 text-[#02BB31]" />
                          {application.phone}
                        </p>
                      )}
                    </div>

                    {application.description && (
                      <p className="text-sm text-[#065A57] line-clamp-2 mb-3">
                        {application.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#065A57]">
                      <span className="flex items-center">
                        <FiCalendar className="mr-1 text-[#02BB31]" />
                        Submitted: {formatDate(application.createdAt)} ({formatTimeAgo(application.createdAt)})
                      </span>
                      {application.paymentAmount && (
                        <span className="flex items-center">
                          <FiDollarSign className="mr-1 text-[#02BB31]" />
                          Application Fee: KES {application.paymentAmount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center text-[#02BB31] font-medium">
                    View Details
                    <FiArrowRight className="ml-2" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminServiceApplicationsPage;