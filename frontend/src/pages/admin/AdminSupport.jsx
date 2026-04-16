import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminSupportTickets } from "../../services/support.service";
import { 
  FiHelpCircle, 
  FiClock, 
  FiCheckCircle, 
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiUser,
  FiMail,
  FiTag,
  FiArrowRight,
  FiAlertCircle,
  FiTrendingUp
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";

const statusClasses = {
  open: "bg-yellow-100 text-yellow-600",
  in_progress: "bg-blue-100 text-blue-600",
  resolved: "bg-[#02BB31]/10 text-[#02BB31]",
  closed: "bg-gray-100 text-gray-600"
};

const statusIcons = {
  open: <FiClock className="text-yellow-500" />,
  in_progress: <FiRefreshCw className="text-blue-500" />,
  resolved: <FiCheckCircle className="text-[#02BB31]" />,
  closed: <FiCheckCircle className="text-gray-500" />
};

const categories = {
  billing: { label: "Billing", icon: "💰" },
  listing: { label: "Listing", icon: "🏠" },
  technical: { label: "Technical", icon: "🔧" },
  account: { label: "Account", icon: "👤" },
  other: { label: "Other", icon: "❓" }
};

const AdminSupportPage = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [status, setStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTickets = async (statusValue = "all") => {
    try {
      setLoading(true);
      const params = {};
      if (statusValue !== "all") params.status = statusValue;

      const data = await getAdminSupportTickets(params);
      setTickets(data.tickets || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load support tickets");
      toast.error("Failed to load support tickets", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(status);
  }, [status]);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, dateRange]);

  const filterTickets = () => {
    let filtered = [...tickets];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(ticket => 
        ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.landlord?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.landlord?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch(dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(ticket => new Date(ticket.createdAt) >= filterDate);
          break;
        case "week":
          filterDate.setDate(filterDate.getDate() - 7);
          filtered = filtered.filter(ticket => new Date(ticket.createdAt) >= filterDate);
          break;
        case "month":
          filterDate.setMonth(filterDate.getMonth() - 1);
          filtered = filtered.filter(ticket => new Date(ticket.createdAt) >= filterDate);
          break;
      }
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setFilteredTickets(filtered);
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
    const ticketDate = new Date(date);
    const diffInSeconds = Math.floor((now - ticketDate) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    closed: tickets.filter(t => t.status === "closed").length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading support tickets...</p>
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
          onClick={() => fetchTickets(status)}
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
              <h1 className="text-xl font-bold text-[#013E43]">Support Oversight</h1>
              <p className="text-sm text-[#065A57]">
                Receive, follow up, and manage landlord support queries
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchTickets(status)}
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
          <p className="text-sm text-[#065A57]">Total Tickets</p>
          <p className="text-2xl font-bold text-[#013E43]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 ">
          <p className="text-sm text-[#065A57]">Open</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.open}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 ">
          <p className="text-sm text-[#065A57]">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 ">
          <p className="text-sm text-[#065A57]">Resolved</p>
          <p className="text-2xl font-bold text-[#02BB31]">{stats.resolved}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 ">
          <p className="text-sm text-[#065A57]">Closed</p>
          <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
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
              placeholder="Search by subject, landlord name, or email..."
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
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
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
          Showing {filteredTickets.length} of {tickets.length} tickets
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
          <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiHelpCircle className="text-3xl text-[#A8D8C1]" />
          </div>
          <h2 className="text-lg font-semibold text-[#013E43] mb-2">No support tickets found</h2>
          <p className="text-sm text-[#065A57]">
            {searchTerm || status !== "all" || dateRange !== "all"
              ? "Try adjusting your search or filters"
              : "Support tickets will appear here once landlords create them."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTickets.map((ticket) => (
            <Link
              key={ticket._id}
              to={`/admin/support/${ticket._id}`}
              className="block bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              <div className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold text-[#013E43]">
                        {ticket.subject}
                      </h2>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${statusClasses[ticket.status]}`}>
                        {statusIcons[ticket.status]}
                        <span className="ml-1">{ticket.status.replace("_", " ")}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-[#065A57] mb-3">
                      <span className="inline-flex items-center">
                        <FiTag className="mr-1" />
                        {categories[ticket.category]?.label || ticket.category}
                      </span>
                      <span className="inline-flex items-center">
                        <FiUser className="mr-1" />
                        {ticket.landlord?.name}
                      </span>
                      <span className="inline-flex items-center">
                        <FiMail className="mr-1" />
                        {ticket.landlord?.email}
                      </span>
                    </div>

                    <p className="text-sm text-[#065A57] line-clamp-2 mb-3">
                      {ticket.messages?.[0]?.message || "No messages"}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-[#065A57]">
                      <span className="flex items-center">
                        <FiClock className="mr-1" />
                        Updated {formatTimeAgo(ticket.updatedAt)}
                      </span>
                      <span className="flex items-center">
                        Created {formatDate(ticket.createdAt)}
                      </span>
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

export default AdminSupportPage;