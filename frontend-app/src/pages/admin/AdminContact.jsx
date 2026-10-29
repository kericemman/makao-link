import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminContactMessages } from "../../services/contact.service";
import { 
  FiMail, 
  FiUser, 
  FiMessageSquare, 
  FiClock,
  FiAlertCircle,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiEye,
  FiTrendingUp,
  FiCalendar,
  FiPhone
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";

const statusClasses = {
  new: "bg-[#0D915C]/10 text-[#0D915C] border-[#0D915C]/20",
  in_progress: "bg-yellow-100 text-yellow-600 border-yellow-200",
  resolved: "bg-blue-100 text-blue-600 border-blue-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200"
};

const AdminContact = () => {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [status, setStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMessages = async (statusValue = "all") => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (statusValue !== "all") params.status = statusValue;

      const data = await getAdminContactMessages(params);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load contact messages");
      toast.error("Failed to load contact messages", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(status);
  }, [status]);

  useEffect(() => {
    filterMessages();
  }, [messages, searchTerm, dateRange]);

  const filterMessages = () => {
    let filtered = [...messages];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(msg => 
        msg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.phone?.includes(searchTerm)
      );
    }

    // Date range filter
    if (dateRange !== "all") {
      const filterDate = new Date();
      
      switch(dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(msg => new Date(msg.createdAt) >= filterDate);
          break;
        case "week":
          filterDate.setDate(filterDate.getDate() - 7);
          filtered = filtered.filter(msg => new Date(msg.createdAt) >= filterDate);
          break;
        case "month":
          filterDate.setMonth(filterDate.getMonth() - 1);
          filtered = filtered.filter(msg => new Date(msg.createdAt) >= filterDate);
          break;
      }
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setFilteredMessages(filtered);
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
    const msgDate = new Date(date);
    const diffInSeconds = Math.floor((now - msgDate) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const stats = {
    total: messages.length,
    new: messages.filter(m => m.status === "new").length,
    inProgress: messages.filter(m => m.status === "in_progress").length,
    resolved: messages.filter(m => m.status === "resolved").length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#DDEAE3] border-t-[#0D915C] mx-auto mb-4"></div>
          <p className="text-[#41635A]">Loading messages...</p>
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
          onClick={() => fetchMessages(status)}
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
              <h1 className="text-xl font-bold text-[#013E43]">Contact Messages</h1>
              <p className="text-sm text-[#41635A]">
                Review and manage public contact form submissions
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchMessages(status)}
              className="p-2 text-[#41635A] hover:bg-[#F1F7F3] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border-b border-[#DDEAE3] py-4 ">
          <p className="text-sm text-[#41635A]">Total Messages</p>
          <p className="text-2xl font-bold text-[#013E43]">{stats.total}</p>
        </div>
        <div className="border-b border-[#DDEAE3] py-4 ">
          <p className="text-sm text-[#41635A]">New</p>
          <p className="text-2xl font-bold text-[#0D915C]">{stats.new}</p>
        </div>
        <div className="border-b border-[#DDEAE3] py-4 ">
          <p className="text-sm text-[#41635A]">In Progress</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
        </div>
        <div className="border-b border-[#DDEAE3] py-4 ">
          <p className="text-sm text-[#41635A]">Resolved</p>
          <p className="text-2xl font-bold text-blue-600">{stats.resolved}</p>
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
              placeholder="Search by name, email, subject, or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#DDEAE3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D915C] focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border border-[#DDEAE3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D915C] text-[#41635A]"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-[#DDEAE3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D915C] text-[#41635A]"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-[#41635A]">
          Showing {filteredMessages.length} of {messages.length} messages
        </div>
      </div>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <div className="border-y border-[#DDEAE3] px-6 py-12 text-center">
          <div className="w-20 h-20 bg-[#F1F7F3] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiMail className="text-3xl text-[#BBD2C6]" />
          </div>
          <h2 className="text-lg font-semibold text-[#013E43] mb-2">No messages found</h2>
          <p className="text-sm text-[#41635A]">
            {searchTerm || status !== "all" || dateRange !== "all"
              ? "Try adjusting your search or filters"
              : "No contact messages have been received yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredMessages.map((message) => (
            <Link
              key={message._id}
              to={`/admin/contact/${message._id}`}
              className="block bg-white rounded-lg shadow-none border border-[#DDEAE3] overflow-hidden transition-all transform"
            >
              <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold text-[#013E43]">
                        {message.subject}
                      </h2>
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-white rounded-full text-xs font-medium ${statusClasses[message.status]}`}>
                        
                        <span className="ml-1 capitalize text-white">{message.status?.replace("_", " ")}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-[#41635A] mb-3">
                      <span className="flex items-center">
                        <FiUser className="mr-1 text-[#0D915C]" />
                        {message.name}
                      </span>
                      <span className="flex items-center">
                        <FiMail className="mr-1 text-[#0D915C]" />
                        {message.email}
                      </span>
                      {message.phone && (
                        <span className="flex items-center">
                          <FiPhone className="mr-1 text-[#0D915C]" />
                          {message.phone}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-[#41635A] line-clamp-2 mb-3">
                      {message.message}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-[#41635A]">
                      <span className="flex items-center">
                        <FiCalendar className="mr-1 text-[#0D915C]" />
                        {formatDate(message.createdAt)}
                      </span>
                      <span className="flex items-center">
                        <FiClock className="mr-1 text-[#0D915C]" />
                        {formatTimeAgo(message.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center text-[#0D915C] font-medium">
                    View Details
                    <FiEye className="ml-2" />
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

export default AdminContact;
