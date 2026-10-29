import { useEffect, useMemo, useState } from "react";
import { getAdminInquiries } from "../../services/admin.service";
import { Link } from "react-router-dom";
import { 
  FiMessageSquare, 
  FiUser, 
  FiMail, 
  FiPhone,
  FiHome,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiArrowRight,
  FiEye,
  FiStar,
  FiInfo,
  FiTrendingUp,
  FiXCircle
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";

const statusClasses = {
  new: "bg-[#0D915C]/10 text-[#0D915C]",
  contacted: "bg-amber-100 text-amber-600",
  closed: "bg-gray-100 text-gray-600"
};

const statusIcons = {
  new: <FiStar className="text-[#08764C]" />,
  contacted: <FiCheckCircle className="text-amber-500" />,
  closed: <FiCheckCircle className="text-gray-500" />
};

const AdminInquiriesPage = () => {
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchInquiries = async (status = "all") => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (status !== "all") {
        params.status = status;
      }

      const data = await getAdminInquiries(params);
      setInquiries(data.inquiries || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load inquiries");
      toast.error("Failed to load inquiries", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries(statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    filterInquiries();
  }, [inquiries, searchTerm, dateRange]);

  const filterInquiries = () => {
    let filtered = [...inquiries];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(inquiry => 
        inquiry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.listing?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.listing?.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter
    if (dateRange !== "all") {
      const filterDate = new Date();
      
      switch(dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(inquiry => new Date(inquiry.createdAt) >= filterDate);
          break;
        case "week":
          filterDate.setDate(filterDate.getDate() - 7);
          filtered = filtered.filter(inquiry => new Date(inquiry.createdAt) >= filterDate);
          break;
        case "month":
          filterDate.setMonth(filterDate.getMonth() - 1);
          filtered = filtered.filter(inquiry => new Date(inquiry.createdAt) >= filterDate);
          break;
      }
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setFilteredInquiries(filtered);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
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

  const summary = useMemo(() => {
    return {
      total: inquiries.length,
      new: inquiries.filter((item) => item.status === "new").length,
      contacted: inquiries.filter((item) => item.status === "contacted").length,
      closed: inquiries.filter((item) => item.status === "closed").length
    };
  }, [inquiries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#DDEAE3] border-t-[#0D915C] mx-auto mb-4"></div>
          <p className="text-[#41635A]">Loading inquiries...</p>
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
          onClick={() => fetchInquiries(statusFilter)}
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
              <h1 className="text-xl font-bold text-[#013E43]">Inquiry Oversight</h1>
              <p className="text-sm text-[#41635A]">
                Monitor all inquiries across the platform and track response status
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchInquiries(statusFilter)}
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
          <p className="text-sm text-[#41635A]">Total Inquiries</p>
          <p className="text-2xl font-bold text-[#013E43]">{summary.total}</p>
        </div>
        <div className="border-b border-[#DDEAE3] py-4 ">
          <p className="text-sm text-[#41635A]">New</p>
          <p className="text-2xl font-bold text-[#0D915C]">{summary.new}</p>
        </div>
        <div className="border-b border-[#DDEAE3] py-4 ">
          <p className="text-sm text-[#41635A]">Contacted</p>
          <p className="text-2xl font-bold text-amber-600">{summary.contacted}</p>
        </div>
        <div className="border-b border-[#DDEAE3] py-4 ">
          <p className="text-sm text-[#41635A]">Closed</p>
          <p className="text-2xl font-bold text-gray-600">{summary.closed}</p>
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
              placeholder="Search by name, email, message, or property..."
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
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
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
          Showing {filteredInquiries.length} of {inquiries.length} inquiries
        </div>
      </div>

      {/* Inquiries List */}
      {filteredInquiries.length === 0 ? (
        <div className="border-y border-[#DDEAE3] px-6 py-12 text-center">
          <div className="w-20 h-20 bg-[#F1F7F3] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiMessageSquare className="text-3xl text-[#BBD2C6]" />
          </div>
          <h2 className="text-lg font-semibold text-[#013E43] mb-2">No inquiries found</h2>
          <p className="text-sm text-[#41635A]">
            {searchTerm || statusFilter !== "all" || dateRange !== "all"
              ? "Try adjusting your search or filters"
              : "Inquiries will appear here once users begin contacting landlords."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredInquiries.map((inquiry) => (
            <div
              key={inquiry._id}
              className="bg-white rounded-lg shadow-none border border-[#DDEAE3] overflow-hidden transition-all cursor-pointer"
              onClick={() => {
                setSelectedInquiry(inquiry);
                setShowDetailsModal(true);
              }}
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Column - Main Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-[#013E43] rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {inquiry.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-[#013E43]">
                            {inquiry.name}
                          </h2>
                          <p className="text-sm text-[#41635A] flex items-center">
                            <FiMail className="mr-1" /> {inquiry.email}
                          </p>
                          {inquiry.phone && (
                            <p className="text-xs text-[#41635A] flex items-center mt-0.5">
                              <FiPhone className="mr-1" /> {inquiry.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${statusClasses[inquiry.status]}`}>
                        {statusIcons[inquiry.status]}
                        <span className="ml-1 text-white">{inquiry.status}</span>
                      </span>
                    </div>

                    {/* Property Info */}
                    <div className="mb-4 p-3 bg-[#F1F7F3] rounded-lg">
                      <p className="text-xs text-[#41635A] flex items-center mb-1">
                        <FiHome className="mr-1 text-[#0D915C]" />
                        Property
                      </p>
                      <p className="text-sm font-medium text-[#013E43]">
                        {inquiry.listing?.title || "Listing removed"}
                      </p>
                      {inquiry.listing?.location && (
                        <p className="text-xs text-[#41635A] flex items-center mt-1">
                          <FiMapPin className="mr-1" /> {inquiry.listing.location}
                        </p>
                      )}
                      {inquiry.listing?.price && (
                        <p className="text-xs text-[#0D915C] font-medium mt-1">
                          KES {inquiry.listing.price.toLocaleString()}/month
                        </p>
                      )}
                    </div>

                    {/* Message Preview */}
                    <p className="text-sm text-[#41635A] line-clamp-2">
                      {inquiry.message}
                    </p>
                  </div>

                  {/* Right Column - Details */}
                  <div className="lg:w-64">
                    <div className="bg-[#F1F7F3] rounded-md p-4">
                      <p className="text-sm font-medium text-[#013E43] mb-3 flex items-center">
                        <FiInfo className="mr-2 text-[#0D915C]" />
                        Inquiry Details
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#41635A]">Date:</span>
                          <span className="text-[#013E43]">{formatDate(inquiry.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#41635A]">Time:</span>
                          <span className="text-[#013E43]">{formatTime(inquiry.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#41635A]">Received:</span>
                          <span className="text-[#013E43]">{formatTimeAgo(inquiry.createdAt)}</span>
                        </div>
                        <div className="pt-2">
                          <span className="text-sm text-[#0D915C] flex items-center">
                            <FiEye className="mr-1" />
                            Click to view details
                          </span>
                        </div>
                      </div>
                    </div>
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
          <div className="bg-white rounded-lg shadow-none max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-[#DDEAE3] p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-[#013E43] rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {selectedInquiry.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#013E43]">Inquiry Details</h2>
                  <p className="text-sm text-[#41635A]">ID: {selectedInquiry._id.slice(-8)}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedInquiry(null);
                  setShowDetailsModal(false);
                }}
                className="p-2 hover:bg-[#F1F7F3] rounded-lg transition-colors"
              >
                <FiXCircle className="text-xl text-[#41635A]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="bg-[#F1F7F3] p-4 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#41635A]">Status</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${statusClasses[selectedInquiry.status]}`}>
                    {statusIcons[selectedInquiry.status]}
                    <span className="ml-1">{selectedInquiry.status}</span>
                  </span>
                </div>
              </div>

              {/* Tenant Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#F1F7F3] p-4 rounded-md">
                  <p className="text-xs text-[#41635A] mb-2">Sender Information</p>
                  <div className="space-y-2">
                    <p><span className="text-xs text-[#41635A]">Name:</span> <span className="text-sm font-medium text-[#013E43]">{selectedInquiry.name}</span></p>
                    <p><span className="text-xs text-[#41635A]">Email:</span> <span className="text-sm text-[#013E43]">{selectedInquiry.email}</span></p>
                    {selectedInquiry.phone && (
                      <p><span className="text-xs text-[#41635A]">Phone:</span> <span className="text-sm text-[#013E43]">{selectedInquiry.phone}</span></p>
                    )}
                  </div>
                </div>

                <div className="bg-[#F1F7F3] p-4 rounded-md">
                  <p className="text-xs text-[#41635A] mb-2">Landlord Information</p>
                  <div className="space-y-2">
                    <p><span className="text-xs text-[#41635A]">Name:</span> <span className="text-sm font-medium text-[#013E43]">{selectedInquiry.landlord?.name || "Unknown"}</span></p>
                    <p><span className="text-xs text-[#41635A]">Email:</span> <span className="text-sm text-[#013E43]">{selectedInquiry.landlord?.email || "No email"}</span></p>
                    {selectedInquiry.landlord?.phone && (
                      <p><span className="text-xs text-[#41635A]">Phone:</span> <span className="text-sm text-[#013E43]">{selectedInquiry.landlord.phone}</span></p>
                    )}
                  </div>
                </div>
              </div>

              {/* Property Info */}
              <div className="bg-[#F1F7F3] p-4 rounded-md">
                <p className="text-xs text-[#41635A] mb-2">Property Information</p>
                <div className="space-y-2">
                  <p><span className="text-xs text-[#41635A]">Title:</span> <span className="text-sm font-medium text-[#013E43]">{selectedInquiry.listing?.title || "Listing removed"}</span></p>
                  {selectedInquiry.listing?.location && (
                    <p><span className="text-xs text-[#41635A]">Location:</span> <span className="text-sm text-[#013E43]">{selectedInquiry.listing.location}</span></p>
                  )}
                  {selectedInquiry.listing?.price && (
                    <p><span className="text-xs text-[#41635A]">Price:</span> <span className="text-sm font-bold text-[#0D915C]">KES {selectedInquiry.listing.price.toLocaleString()}/month</span></p>
                  )}
                </div>
              </div>

              {/* Message */}
              <div className="bg-[#F1F7F3] p-4 rounded-md">
                <p className="text-xs text-[#41635A] mb-2">Message</p>
                <p className="text-sm text-[#013E43] whitespace-pre-wrap">
                  {selectedInquiry.message}
                </p>
                <p className="text-xs text-[#41635A] mt-2 flex items-center">
                  <FiCalendar className="mr-1" />
                  Received: {formatDate(selectedInquiry.createdAt)} at {formatTime(selectedInquiry.createdAt)}
                </p>
              </div>

              {/* Contact Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-[#DDEAE3]">
                {selectedInquiry.phone && (
                  <>
                    <a
                      href={`tel:${selectedInquiry.phone}`}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-[#013E43] text-white rounded-lg hover:bg-[#075B53] transition-colors"
                    >
                      <FiPhone />
                      <span>Call Tenant</span>
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
                <a
                  href={`mailto:${selectedInquiry.email}`}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-[#0D915C] text-white rounded-lg hover:bg-[#08764C] transition-colors"
                >
                  <FiMail />
                  <span>Reply via Email</span>
                </a>
              </div>

              {/* Close Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSelectedInquiry(null);
                    setShowDetailsModal(false);
                  }}
                  className="px-6 py-2 bg-gray-100 text-[#41635A] rounded-lg hover:bg-gray-200 transition-colors"
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

export default AdminInquiriesPage;
