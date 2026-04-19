import { useEffect, useState } from "react";
import { getNewsletterSubscribers, unsubscribeSubscriber, deleteSubscriber } from "../../services/blog.service";
import { 
  FiMail, 
  FiUsers, 
  FiCalendar, 
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiTrash2,
  FiDownload,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiUserCheck,
  FiUserX,
  FiChevronDown,
  FiArrowRight
} from "react-icons/fi";
import { FaEnvelope } from "react-icons/fa";
import toast from "react-hot-toast";

const AdminNewsletterSubscribersPage = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const data = await getNewsletterSubscribers();
      setSubscribers(data.subscribers || []);
    } catch (error) {
      toast.error("Failed to load subscribers", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  useEffect(() => {
    filterSubscribers();
  }, [subscribers, searchTerm, statusFilter, dateRange]);

  const filterSubscribers = () => {
    let filtered = [...subscribers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(sub => 
        statusFilter === "active" ? sub.isActive : !sub.isActive
      );
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch(dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(sub => new Date(sub.subscribedAt || sub.createdAt) >= filterDate);
          break;
        case "week":
          filterDate.setDate(filterDate.getDate() - 7);
          filtered = filtered.filter(sub => new Date(sub.subscribedAt || sub.createdAt) >= filterDate);
          break;
        case "month":
          filterDate.setMonth(filterDate.getMonth() - 1);
          filtered = filtered.filter(sub => new Date(sub.subscribedAt || sub.createdAt) >= filterDate);
          break;
      }
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.subscribedAt || b.createdAt) - new Date(a.subscribedAt || a.createdAt));
    
    setFilteredSubscribers(filtered);
  };

  const handleUnsubscribe = async () => {
    try {
      await unsubscribeSubscriber(selectedSubscriber._id);
      toast.success("Subscriber unsubscribed successfully", {
        style: { background: "#02BB31", color: "#fff" }
      });
      fetchSubscribers();
      setShowUnsubscribeModal(false);
      setSelectedSubscriber(null);
    } catch (error) {
      toast.error("Failed to unsubscribe", {
        style: { background: "#013E43", color: "#fff" }
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSubscriber(selectedSubscriber._id);
      toast.success("Subscriber deleted successfully", {
        style: { background: "#02BB31", color: "#fff" }
      });
      fetchSubscribers();
      setShowDeleteModal(false);
      setSelectedSubscriber(null);
    } catch (error) {
      toast.error("Failed to delete subscriber", {
        style: { background: "#013E43", color: "#fff" }
      });
    }
  };

  const exportToCSV = () => {
    try {
      setExporting(true);
      
      const headers = ["Email", "Status", "Subscribed At"];
      const rows = filteredSubscribers.map(sub => [
        sub.email,
        sub.isActive ? "Active" : "Inactive",
        new Date(sub.subscribedAt || sub.createdAt).toLocaleString()
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("Subscribers exported successfully", {
        style: { background: "#02BB31", color: "#fff" }
      });
    } catch (error) {
      toast.error("Failed to export subscribers", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = {
    total: subscribers.length,
    active: subscribers.filter(s => s.isActive).length,
    inactive: subscribers.filter(s => !s.isActive).length,
    newThisWeek: subscribers.filter(s => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(s.subscribedAt || s.createdAt) >= weekAgo;
    }).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading subscribers...</p>
        </div>
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
              <FiMail className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">Newsletter Subscribers</h1>
              <p className="text-sm text-[#065A57]">
                Manage everyone who receives blog email notifications
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchSubscribers}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={exportToCSV}
              disabled={exporting || filteredSubscribers.length === 0}
              className="px-4 py-2 bg-[#013E43] text-white rounded-lg hover:bg-[#005C57] transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiDownload />
              <span>{exporting ? "Exporting..." : "Export CSV"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#013E43]">
          <p className="text-sm text-[#065A57]">Total Subscribers</p>
          <p className="text-2xl font-bold text-[#013E43]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#02BB31]">
          <p className="text-sm text-[#065A57]">Active</p>
          <p className="text-2xl font-bold text-[#02BB31]">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-red-400">
          <p className="text-sm text-[#065A57]">Inactive</p>
          <p className="text-2xl font-bold text-red-500">{stats.inactive}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-purple-400">
          <p className="text-sm text-[#065A57]">New This Week</p>
          <p className="text-2xl font-bold text-purple-600">{stats.newThisWeek}</p>
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
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
          Showing {filteredSubscribers.length} of {subscribers.length} subscribers
        </div>
      </div>

      {/* Subscribers Table */}
      {filteredSubscribers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
          <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUsers className="text-3xl text-[#A8D8C1]" />
          </div>
          <h2 className="text-lg font-semibold text-[#013E43] mb-2">No subscribers found</h2>
          <p className="text-sm text-[#065A57]">
            {searchTerm || statusFilter !== "all" || dateRange !== "all"
              ? "Try adjusting your filters"
              : "No one has subscribed to the newsletter yet"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#A8D8C1]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#013E43] to-[#005C57] text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Subscribed At</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#A8D8C1]">
                {filteredSubscribers.map((subscriber) => (
                  <tr key={subscriber._id} className="hover:bg-[#F0F7F4] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-full flex items-center justify-center text-white font-bold">
                          {subscriber.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[#013E43]">{subscriber.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {subscriber.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#02BB31]/10 text-[#02BB31]">
                          <FiCheckCircle className="mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                          <FiXCircle className="mr-1" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-[#013E43]">{formatDate(subscriber.subscribedAt || subscriber.createdAt)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {subscriber.isActive ? (
                          <button
                            onClick={() => {
                              setSelectedSubscriber(subscriber);
                              setShowUnsubscribeModal(true);
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Unsubscribe"
                          >
                            <FiUserX />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedSubscriber(subscriber);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-[#A8D8C1] flex items-center justify-between">
            <p className="text-sm text-[#065A57]">
              Showing 1-{filteredSubscribers.length} of {filteredSubscribers.length} subscribers
            </p>
            <div className="flex space-x-2">
              <button className="px-3 py-1 border border-[#A8D8C1] rounded text-[#065A57] hover:bg-[#F0F7F4]">
                Previous
              </button>
              <button className="px-3 py-1 bg-[#02BB31] text-white rounded hover:bg-[#0D915C]">
                1
              </button>
              <button className="px-3 py-1 border border-[#A8D8C1] rounded text-[#065A57] hover:bg-[#F0F7F4]">
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsubscribe Confirmation Modal */}
      {showUnsubscribeModal && selectedSubscriber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
                <FiUserX className="text-3xl text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-[#013E43] mb-2">Unsubscribe Subscriber</h3>
              <p className="text-sm text-[#065A57]">
                Are you sure you want to unsubscribe "{selectedSubscriber.email}"? 
                They will no longer receive newsletter emails.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowUnsubscribeModal(false);
                  setSelectedSubscriber(null);
                }}
                className="flex-1 px-4 py-2 border border-[#A8D8C1] text-[#065A57] rounded-lg hover:bg-[#F0F7F4] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUnsubscribe}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Unsubscribe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSubscriber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <FiTrash2 className="text-3xl text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-[#013E43] mb-2">Delete Subscriber</h3>
              <p className="text-sm text-[#065A57]">
                Are you sure you want to permanently delete "{selectedSubscriber.email}"? 
                This action cannot be undone.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedSubscriber(null);
                }}
                className="flex-1 px-4 py-2 border border-[#A8D8C1] text-[#065A57] rounded-lg hover:bg-[#F0F7F4] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNewsletterSubscribersPage;