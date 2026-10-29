import { useEffect, useState } from "react";
import { getLandlords } from "../../services/admin.service";
import { Link } from "react-router-dom";
import { 
  FiUsers, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCalendar,
  FiTrendingUp,
  FiHome,
  FiEye,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiArrowRight,
  FiInfo
} from "react-icons/fi";
import { FaKey, FaBuilding, FaHandshake } from "react-icons/fa";
import toast from "react-hot-toast";

const statusClasses = {
  free: "bg-gray-100 text-gray-600",
  pending_payment: "bg-yellow-100 text-yellow-600",
  active: "bg-[#0D915C]/10 text-[#0D915C]",
  grace: "bg-orange-100 text-orange-600",
  expired: "bg-red-100 text-red-600",
  cancelled: "bg-gray-100 text-gray-600"
};

const statusIcons = {
  free: <FiInfo className="text-gray-500" />,
  pending_payment: <FiAlertCircle className="text-yellow-500" />,
  active: <FiCheckCircle className="text-[#0D915C]" />,
  grace: <FiAlertCircle className="text-orange-500" />,
  expired: <FiAlertCircle className="text-red-500" />,
  cancelled: <FiAlertCircle className="text-gray-500" />
};

const AdminLandlordsPage = () => {
  const [landlords, setLandlords] = useState([]);
  const [filteredLandlords, setFilteredLandlords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const fetchLandlords = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getLandlords();
      setLandlords(data.landlords || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load landlords");
      toast.error("Failed to load landlords", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLandlords();
  }, []);

  useEffect(() => {
    filterAndSortLandlords();
  }, [landlords, searchTerm, statusFilter, sortBy]);

  const filterAndSortLandlords = () => {
    let filtered = [...landlords];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(l => 
        l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.phone?.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(l => l.subscription?.status === statusFilter);
    }

    // Sort
    switch(sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "listings":
        filtered.sort((a, b) => (b.stats?.totalListings || 0) - (a.stats?.totalListings || 0));
        break;
      case "name":
        filtered.sort((a, b) => a.name?.localeCompare(b.name));
        break;
      default:
        break;
    }

    setFilteredLandlords(filtered);
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const stats = {
    total: landlords.length,
    active: landlords.filter(l => l.subscription?.status === "active").length,
    pending: landlords.filter(l => l.subscription?.status === "pending_payment").length,
    expired: landlords.filter(l => l.subscription?.status === "expired").length,
    totalListings: landlords.reduce((acc, l) => acc + (l.stats?.totalListings || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#DDEAE3] border-t-[#0D915C] mx-auto mb-4"></div>
          <p className="text-[#41635A]">Loading landlords...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-none p-8 text-center border border-[#DDEAE3]">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="text-3xl text-red-500" />
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchLandlords}
          className="px-4 py-2 bg-[#0D915C] text-white rounded-lg hover:bg-[#08764C] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="border-b border-[#DDEAE3] pb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
           
            <div>
              <h1 className="text-xl font-bold text-[#013E43]">Landlords</h1>
              <p className="text-sm text-[#41635A]">
                View and manage landlord accounts, plans, and listing activity
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchLandlords}
              className="p-2 text-[#41635A] hover:bg-[#F1F7F3] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="border-b border-[#DDEAE3] py-4 ">
          <p className="text-sm text-[#41635A]">Total Landlords</p>
          <p className="text-2xl font-bold text-[#013E43]">{stats.total}</p>
        </div>
        <div className="border-b border-[#DDEAE3] py-4 ">
          <p className="text-sm text-[#41635A]">Active</p>
          <p className="text-2xl font-bold text-[#0D915C]">{stats.active}</p>
        </div>
        <div className="border-b border-[#DDEAE3] py-4 ">
          <p className="text-sm text-[#41635A]">Pending Payment</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="border-b border-[#DDEAE3] py-4 ">
          <p className="text-sm text-[#41635A]">Expired</p>
          <p className="text-2xl font-bold text-red-500">{stats.expired}</p>
        </div>
        <div className="border-b border-[#DDEAE3] py-4 ">
          <p className="text-sm text-[#41635A]">Total Listings</p>
          <p className="text-2xl font-bold text-purple-600">{stats.totalListings}</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="border-y border-[#DDEAE3] py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#41635A]" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#DDEAE3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D915C] focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-[#DDEAE3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D915C] text-[#41635A]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="grace">Grace</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-[#DDEAE3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D915C] text-[#41635A]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">By Name</option>
              <option value="listings">Most Listings</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-[#41635A]">
          Showing {filteredLandlords.length} of {landlords.length} landlords
        </div>
      </div>

      {/* Landlords Table */}
      {filteredLandlords.length === 0 ? (
        <div className="border-y border-[#DDEAE3] px-6 py-12 text-center">
          <div className="w-20 h-20 bg-[#F1F7F3] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUsers className="text-3xl text-[#BBD2C6]" />
          </div>
          <h2 className="text-lg font-semibold text-[#013E43] mb-2">No landlords found</h2>
          <p className="text-sm text-[#41635A]">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Landlord accounts will appear here once they register."}
          </p>
        </div>
      ) : (
        <div className="border-y border-[#DDEAE3] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#013E43] text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Landlord</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Listings</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Billing</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#BBD2C6]">
                {filteredLandlords.map((landlord) => (
                  <tr key={landlord._id} className="hover:bg-[#F1F7F3] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#013E43] rounded-full flex items-center justify-center text-white font-bold">
                          {landlord.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[#013E43]">{landlord.name}</p>
                          <p className="text-xs text-[#41635A] flex items-center">
                            <FiMail className="mr-1" /> {landlord.email}
                          </p>
                          {landlord.phone && (
                            <p className="text-xs text-[#41635A] flex items-center mt-0.5">
                              <FiPhone className="mr-1" /> {landlord.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-[#013E43] capitalize">
                          {landlord.subscription?.plan || "Free"}
                        </p>
                        <p className="text-xs text-[#41635A]">
                          Limit: {landlord.subscription?.listingLimit || 1}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        {getStatusBadge(landlord.subscription?.status)}
                        {landlord.subscription?.gracePeriodEnd && (
                          <p className="mt-1 text-xs text-orange-600">
                            Grace ends {formatDate(landlord.subscription.gracePeriodEnd)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-[#013E43]">
                          {landlord.stats?.activeListings || 0} active
                        </p>
                        <p className="text-xs text-[#41635A]">
                          {landlord.stats?.totalListings || 0} total
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {landlord.subscription?.currentPeriodEnd ? (
                        <div>
                          <p className="text-sm text-[#013E43]">
                            {formatDate(landlord.subscription.currentPeriodEnd)}
                          </p>
                          {landlord.subscription?.status === "active" && (
                            <p className="text-xs text-[#0D915C]">Next billing</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-[#41635A]">—</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-[#013E43]">
                          {formatDate(landlord.createdAt)}
                        </p>
                        <p className="text-xs text-[#41635A]">
                          {new Date(landlord.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-[#DDEAE3] flex items-center justify-between">
            <p className="text-sm text-[#41635A]">
              Showing 1-{filteredLandlords.length} of {filteredLandlords.length} landlords
            </p>
            <div className="flex space-x-2">
              <button className="px-3 py-1 border border-[#DDEAE3] rounded text-[#41635A] hover:bg-[#F1F7F3]">
                Previous
              </button>
              <button className="px-3 py-1 bg-[#0D915C] text-white rounded hover:bg-[#08764C]">
                1
              </button>
              <button className="px-3 py-1 border border-[#DDEAE3] rounded text-[#41635A] hover:bg-[#F1F7F3]">
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLandlordsPage;