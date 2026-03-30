import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyInquiries, updateInquiryStatus } from "../../services/inquiry.service";
import { 
  FiMessageSquare, 
  FiMail, 
  FiPhone, 
  FiHome,
  FiUser,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiEyeOff,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiSend,
  FiArrowRight,
  FiStar,
  FiArchive
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";

const LandlordInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const data = await getMyInquiries();
      setInquiries(data.inquiries || []);
    } catch (error) {
      toast.error("Failed to load inquiries", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  useEffect(() => {
    filterInquiries();
  }, [inquiries, searchTerm, statusFilter, dateRange]);

  const filterInquiries = () => {
    let filtered = [...inquiries];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(inq => 
        inq.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inq.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inq.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inq.listing?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(inq => inq.status === statusFilter);
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch(dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(inq => new Date(inq.createdAt) >= filterDate);
          break;
        case "week":
          filterDate.setDate(filterDate.getDate() - 7);
          filtered = filtered.filter(inq => new Date(inq.createdAt) >= filterDate);
          break;
        case "month":
          filterDate.setMonth(filterDate.getMonth() - 1);
          filtered = filtered.filter(inq => new Date(inq.createdAt) >= filterDate);
          break;
      }
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setFilteredInquiries(filtered);
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateInquiryStatus(id, status);
      toast.success(`Inquiry marked as ${status}`, {
        style: { background: "#02BB31", color: "#fff" }
      });
      fetchInquiries();
      if (selectedInquiry && selectedInquiry._id === id) {
        setSelectedInquiry({ ...selectedInquiry, status });
      }
    } catch (error) {
      toast.error("Failed to update status", {
        style: { background: "#013E43", color: "#fff" }
      });
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    try {
      setSendingReply(true);
      // You'll need to implement this API endpoint
      await sendReply(selectedInquiry._id, { message: replyText });
      
      toast.success("Reply sent successfully", {
        style: { background: "#02BB31", color: "#fff" }
      });
      
      setReplyText("");
      setShowDetailsModal(false);
      fetchInquiries();
    } catch (error) {
      toast.error("Failed to send reply", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case "new":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#02BB31]/10 text-[#02BB31]">
            <FiStar className="mr-1" />
            New
          </span>
        );
      case "contacted":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
            <FiEye className="mr-1" />
            Contacted
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <FiArchive className="mr-1" />
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {status}
          </span>
        );
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

  const formatTimeAgo = (date) => {
    const now = new Date();
    const inquiryDate = new Date(date);
    const diffInSeconds = Math.floor((now - inquiryDate) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const stats = {
    total: inquiries.length,
    new: inquiries.filter(i => i.status === "new").length,
    contacted: inquiries.filter(i => i.status === "contacted").length,
    closed: inquiries.filter(i => i.status === "closed").length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading inquiries...</p>
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
              <FiMessageSquare className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">Inquiries</h1>
              <p className="text-sm text-[#065A57]">Manage tenant messages and inquiries</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchInquiries}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#013E43]">
          <p className="text-sm text-[#065A57]">Total Inquiries</p>
          <p className="text-2xl font-bold text-[#013E43]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#02BB31]">
          <p className="text-sm text-[#065A57]">New</p>
          <p className="text-2xl font-bold text-[#02BB31]">{stats.new}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-blue-400">
          <p className="text-sm text-[#065A57]">Contacted</p>
          <p className="text-2xl font-bold text-blue-600">{stats.contacted}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-gray-400">
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
              placeholder="Search by name, email, or message..."
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
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
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
          Showing {filteredInquiries.length} of {inquiries.length} inquiries
        </div>
      </div>

      {/* Inquiries List */}
      {filteredInquiries.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
          <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiMessageSquare className="text-3xl text-[#A8D8C1]" />
          </div>
          <h3 className="text-lg font-semibold text-[#013E43] mb-2">No inquiries found</h3>
          <p className="text-sm text-[#065A57]">
            {searchTerm || statusFilter !== "all" || dateRange !== "all"
              ? "Try adjusting your filters"
              : "You haven't received any inquiries yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredInquiries.map((inquiry) => (
            <div
              key={inquiry._id}
              className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-[#A8D8C1] bg-gradient-to-r from-[#F0F7F4] to-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {inquiry.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#013E43]">{inquiry.name}</h3>
                      <p className="text-xs text-[#065A57] flex items-center">
                        <FiMail className="mr-1" /> {inquiry.email}
                      </p>
                      {inquiry.phone && (
                        <p className="text-xs text-[#065A57] flex items-center mt-0.5">
                          <FiPhone className="mr-1" /> {inquiry.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(inquiry.status)}
                    <span className="text-xs text-[#065A57] flex items-center">
                      <FiClock className="mr-1" />
                      {formatTimeAgo(inquiry.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4">
                {/* Property Info */}
                <div className="mb-3 p-2 bg-[#F0F7F4] rounded-lg">
                  <p className="text-xs text-[#065A57] flex items-center mb-1">
                    <FiHome className="mr-1" />
                    Property
                  </p>
                  <p className="text-sm font-medium text-[#013E43]">
                    {inquiry.listing?.title || "Listing removed"}
                  </p>
                </div>

                {/* Message */}
                <div className="mb-4">
                  <p className="text-xs text-[#065A57] mb-1">Message:</p>
                  <p className="text-sm text-[#013E43] whitespace-pre-wrap">
                    {inquiry.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-[#A8D8C1]">
                  <div className="flex items-center space-x-2">
                    {inquiry.phone && (
                      <>
                        <a
                          href={`tel:${inquiry.phone}`}
                          className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
                          title="Call"
                        >
                          <FiPhone />
                        </a>
                        <a
                          href={`https://wa.me/${inquiry.phone.replace(/^0/, "254")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-[#25D366] hover:bg-[#F0F7F4] rounded-lg transition-colors"
                          title="WhatsApp"
                        >
                          <FaWhatsapp />
                        </a>
                      </>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={inquiry.status}
                      onChange={(e) => handleStatusChange(inquiry._id, e.target.value)}
                      className="px-3 py-2 text-sm border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57] bg-white"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
                    
                    <button
                      onClick={() => {
                        setSelectedInquiry(inquiry);
                        setShowDetailsModal(true);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-[#A8D8C1] p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {selectedInquiry.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#013E43]">Inquiry Details</h2>
                  <p className="text-sm text-[#065A57]">ID: {selectedInquiry._id.slice(-8)}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedInquiry(null);
                  setShowDetailsModal(false);
                  setReplyText("");
                }}
                className="p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
              >
                <FiXCircle className="text-xl text-[#065A57]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status and Property */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#F0F7F4] rounded-xl">
                  <p className="text-xs text-[#065A57] mb-1">Status</p>
                  <div className="flex items-center">
                    <select
                      value={selectedInquiry.status}
                      onChange={(e) => handleStatusChange(selectedInquiry._id, e.target.value)}
                      className="px-3 py-2 text-sm border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57] bg-white w-full"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                <div className="p-4 bg-[#F0F7F4] rounded-xl">
                  <p className="text-xs text-[#065A57] mb-1">Property</p>
                  <p className="font-medium text-[#013E43]">{selectedInquiry.listing?.title || "Listing removed"}</p>
                </div>
              </div>

              {/* Tenant Info */}
              <div className="p-4 bg-[#F0F7F4] rounded-xl">
                <p className="text-xs text-[#065A57] mb-3">Tenant Information</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#065A57]">Name</p>
                    <p className="font-medium">{selectedInquiry.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#065A57]">Email</p>
                    <p className="font-medium">{selectedInquiry.email}</p>
                  </div>
                  {selectedInquiry.phone && (
                    <div>
                      <p className="text-xs text-[#065A57]">Phone</p>
                      <p className="font-medium">{selectedInquiry.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Message */}
              <div className="p-4 bg-[#F0F7F4] rounded-xl">
                <p className="text-xs text-[#065A57] mb-2">Message</p>
                <p className="text-sm text-[#013E43] whitespace-pre-wrap">
                  {selectedInquiry.message}
                </p>
                <p className="text-xs text-[#065A57] mt-2 flex items-center">
                  <FiCalendar className="mr-1" />
                  Received: {formatDate(selectedInquiry.createdAt)}
                </p>
              </div>

              {/* Reply Form */}
              <div className="p-4 bg-[#F0F7F4] rounded-xl">
                <p className="text-xs text-[#065A57] mb-3">Reply to Tenant</p>
                <textarea
                  rows="4"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  className="w-full px-4 py-3 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] mb-3"
                />
                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setReplyText("")}
                    className="px-4 py-2 text-[#065A57] border border-[#A8D8C1] rounded-lg hover:bg-white transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleReply}
                    disabled={sendingReply}
                    className="px-6 py-2 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center"
                  >
                    {sendingReply ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <FiSend className="mr-2" />
                        Send Reply
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Contact Actions */}
              <div className="flex items-center space-x-3 pt-4 border-t border-[#A8D8C1]">
                {selectedInquiry.phone && (
                  <>
                    <a
                      href={`tel:${selectedInquiry.phone}`}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-[#013E43] text-white rounded-lg hover:bg-[#005C57] transition-colors"
                    >
                      <FiPhone />
                      <span>Call Now</span>
                    </a>
                    <a
                      href={`https://wa.me/${selectedInquiry.phone.replace(/^0/, "254")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors"
                    >
                      <FaWhatsapp />
                      <span>WhatsApp</span>
                    </a>
                  </>
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSelectedInquiry(null);
                    setShowDetailsModal(false);
                    setReplyText("");
                  }}
                  className="px-6 py-2 bg-gray-100 text-[#065A57] rounded-lg hover:bg-gray-200 transition-colors"
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

export default LandlordInquiries;