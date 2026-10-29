import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createSupportTicket, getMySupportTickets } from "../../services/support.service";
import { 
  FiHelpCircle, 
  FiMessageSquare, 
  FiSend,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiTag,
  FiUser,
  FiMail,
  FiPhone,
  FiArrowRight,
  FiInfo
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";

const statusClasses = {
  open: "bg-yellow-100 text-yellow-600",
  in_progress: "bg-blue-100 text-blue-600",
  resolved: "bg-[#126542]/10 text-[#126542]",
  closed: "bg-gray-100 text-gray-600"
};

const statusIcons = {
  open: <FiClock className="text-yellow-500" />,
  in_progress: <FiRefreshCw className="text-blue-500" />,
  resolved: <FiCheckCircle className="text-[#126542]" />,
  closed: <FiCheckCircle className="text-gray-500" />
};

const categories = [
  { value: "billing", label: "Billing", icon: "💰" },
  { value: "listing", label: "Listing", icon: "🏠" },
  { value: "technical", label: "Technical", icon: "🔧" },
  { value: "account", label: "Account", icon: "👤" },
  { value: "other", label: "Other", icon: "❓" }
];

const LandlordSupportPage = () => {
  const [tickets, setTickets] = useState([]);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("other");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchTickets = async () => {
    try {
      setFetching(true);
      const data = await getMySupportTickets();
      setTickets(data.tickets || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load support tickets", {
        style: { background: "#0F172A", color: "#fff" }
      });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subject.trim()) {
      toast.error("Please enter a subject", {
        style: { background: "#0F172A", color: "#fff" }
      });
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a message", {
        style: { background: "#0F172A", color: "#fff" }
      });
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await createSupportTicket({
        subject,
        category,
        message
      });

      setSubject("");
      setCategory("other");
      setMessage("");
      setSuccess("Support ticket created successfully.");
      toast.success("Support ticket created successfully", {
        style: { background: "#126542", color: "#fff" }
      });
      fetchTickets();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create support ticket");
      toast.error(err.response?.data?.message || "Failed to create support ticket", {
        style: { background: "#0F172A", color: "#fff" }
      });
    } finally {
      setLoading(false);
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
    resolved: tickets.filter(t => t.status === "resolved").length
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E2E8F0] border-t-[#126542] mx-auto mb-4"></div>
          <p className="text-[#475569]">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-md shadow-sm p-6 border border-[#E2E8F0]">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-[#123D38] rounded-md">
            <FiHelpCircle className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#0F172A]">Support Center</h1>
            <p className="text-sm text-[#475569]">
              Contact admin, follow up on issues, and track replies in one place
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-md shadow-sm p-4 ">
          <p className="text-sm text-[#475569]">Total Tickets</p>
          <p className="text-2xl font-bold text-[#0F172A]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-md shadow-sm p-4 ">
          <p className="text-sm text-[#475569]">Open</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.open}</p>
        </div>
        <div className="bg-white rounded-md shadow-sm p-4 ">
          <p className="text-sm text-[#475569]">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-md shadow-sm p-4 ">
          <p className="text-sm text-[#475569]">Resolved</p>
          <p className="text-2xl font-bold text-[#126542]">{stats.resolved}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create Ticket Form */}
        <div className="bg-white rounded-md shadow-sm border border-[#E2E8F0] overflow-hidden">
          <div className="bg-[#123D38] p-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              <FiMessageSquare className="mr-2" />
              Create Support Ticket
            </h2>
            <p className="text-sm text-[#E2E8F0] mt-1">
              Describe your issue and we'll get back to you as soon as possible
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Subject Field */}
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Brief summary of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#E2E8F0] rounded-lg focus:border-[#126542] outline-none transition-colors"
                required
              />
            </div>

            {/* Category Field */}
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#E2E8F0] rounded-lg focus:border-[#126542] outline-none transition-colors"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Message Field */}
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="6"
                placeholder="Please describe your issue in detail. Include any error messages, steps you've tried, and relevant information."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#E2E8F0] rounded-lg focus:border-[#126542] outline-none transition-colors resize-none"
                required
              />
              <p className="text-xs text-[#475569] mt-1">
                Minimum 20 characters. {message.length}/20
              </p>
            </div>

            {success && (
              <div className="bg-[#126542]/10 p-3 rounded-lg text-sm text-[#126542] flex items-center">
                <FiCheckCircle className="mr-2" />
                {success}
              </div>
            )}
            {error && (
              <div className="bg-red-50 p-3 rounded-lg text-sm text-red-600 flex items-center">
                <FiAlertCircle className="mr-2" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#126542] text-white rounded-md font-semibold hover:shadow-md transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <FiSend className="mr-2" />
                  Submit Ticket
                </>
              )}
            </button>
          </form>
        </div>

        {/* My Tickets List */}
        <div className="bg-white rounded-md shadow-sm border border-[#E2E8F0] overflow-hidden">
          <div className="bg-slate-50 p-6 border-b border-[#E2E8F0]">
            <h2 className="text-lg font-bold text-[#0F172A] flex items-center">
              <FiClock className="mr-2 text-[#126542]" />
              My Tickets
            </h2>
            <p className="text-sm text-[#475569] mt-1">
              Track and manage your support requests
            </p>
          </div>

          <div className="p-6">
            {tickets.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-[#F8FAFC] rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiHelpCircle className="text-3xl text-[#E2E8F0]" />
                </div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2">No support tickets yet</h3>
                <p className="text-sm text-[#475569]">
                  Create your first ticket to get help from our support team.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {tickets.map((ticket) => (
                  <Link
                    key={ticket._id}
                    to={`/support/${ticket._id}`}
                    className="block rounded-md border border-[#E2E8F0] p-4 transition-all hover:border-[#126542] hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-[#0F172A] truncate">
                            {ticket.subject}
                          </h3>
                          <span className="text-xs text-[#475569]">#{ticket._id.slice(-6)}</span>
                        </div>
                        <p className="text-xs text-[#475569] flex items-center">
                          <FiTag className="mr-1" />
                          {categories.find(c => c.value === ticket.category)?.label || ticket.category}
                        </p>
                        <p className="mt-2 text-xs text-[#475569] flex items-center">
                          <FiClock className="mr-1" />
                          Updated {formatTimeAgo(ticket.updatedAt)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${statusClasses[ticket.status]}`}
                        >
                          {statusIcons[ticket.status]}
                          <span className="ml-1">{ticket.status.replace("_", " ")}</span>
                        </span>
                        <span className="text-xs text-[#126542] flex items-center">
                          View Details
                          <FiArrowRight className="ml-1" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Support Info */}
      <div className="bg-[#123D38] rounded-md p-6 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-[#126542]/20 rounded-md">
              <FiInfo className="text-3xl text-[#126542]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Need immediate help?</h3>
              <p className="text-sm text-[#E2E8F0]">
                Our support team is available 24/7 to assist you
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <a
              href="mailto:support@makaolink.com"
              className="px-4 py-2 bg-white text-[#0F172A] rounded-lg hover:bg-[#E2E8F0] transition-colors"
            >
              Email Support
            </a>
            <a
              href="https://wa.me/254738388000"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors flex items-center"
            >
              <FaWhatsapp className="mr-2" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandlordSupportPage;