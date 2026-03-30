import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getMySupportTicketById,
  replyToMySupportTicket
} from "../../services/support.service";
import { 
  FiArrowLeft, 
  FiSend, 
  FiClock, 
  FiCheckCircle,
  FiAlertCircle,
  FiTag,
  FiUser,
  FiMail,
  FiMessageSquare,
  FiRefreshCw,
  FiInfo
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

const LandlordSupportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState("");

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const data = await getMySupportTicketById(id);
      setTicket(data.ticket);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load ticket");
      toast.error("Failed to load ticket", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleReply = async (e) => {
    e.preventDefault();

    if (!reply.trim()) {
      toast.error("Please enter a reply message", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    try {
      setReplying(true);
      const data = await replyToMySupportTicket(id, { message: reply });
      setTicket(data.ticket);
      setReply("");
      toast.success("Reply sent successfully", {
        style: { background: "#02BB31", color: "#fff" }
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reply", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setReplying(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading ticket...</p>
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
          onClick={fetchTicket}
          className="px-4 py-2 bg-[#02BB31] text-white rounded-lg hover:bg-[#0D915C] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
        <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="text-3xl text-[#A8D8C1]" />
        </div>
        <h2 className="text-lg font-semibold text-[#013E43] mb-2">Ticket not found</h2>
        <p className="text-sm text-[#065A57] mb-4">
          The support ticket you're looking for doesn't exist or has been removed.
        </p>
        <Link
          to="/landlord/support"
          className="inline-flex items-center px-6 py-3 bg-[#02BB31] text-white rounded-lg font-semibold hover:bg-[#0D915C] transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Back to Support
        </Link>
      </div>
    );
  }

  const categoryInfo = categories[ticket.category] || categories.other;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link
              to="/landlord/support"
              className="p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
            >
              <FiArrowLeft className="text-xl text-[#065A57]" />
            </Link>
            <div className="p-3 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl">
              <FiMessageSquare className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">Ticket Details</h1>
              <p className="text-sm text-[#065A57]">ID: {ticket._id.slice(-8)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchTicket}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className="text-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Info Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden">
        <div className="p-6 border-b border-[#A8D8C1] bg-gradient-to-r from-[#F0F7F4] to-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[#013E43]">{ticket.subject}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#F0F7F4] text-[#065A57]">
                  {categoryInfo.icon} {categoryInfo.label}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${statusClasses[ticket.status]}`}>
                  {statusIcons[ticket.status]}
                  <span className="ml-1">{ticket.status.replace("_", " ")}</span>
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#065A57]">Created</p>
              <p className="text-sm font-medium text-[#013E43]">{formatDate(ticket.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
            <FiMessageSquare className="mr-2 text-[#02BB31]" />
            Conversation
          </h3>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {ticket.messages.map((msg, index) => (
              <div
                key={msg._id || index}
                className={`rounded-xl p-4 ${
                  msg.senderRole === "admin"
                    ? "bg-[#F0F7F4] border-l-4 border-[#02BB31]"
                    : "bg-white border border-[#A8D8C1]"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.senderRole === "admin"
                        ? "bg-gradient-to-r from-[#02BB31] to-[#0D915C]"
                        : "bg-gradient-to-r from-[#013E43] to-[#005C57]"
                    }`}>
                      <span className="text-white text-xs font-bold">
                        {msg.senderRole === "admin" ? "A" : "Y"}
                      </span>
                    </div>
                    <span className="font-medium text-[#013E43]">
                      {msg.senderRole === "admin" ? "Support Team" : "You"}
                    </span>
                  </div>
                  <span className="text-xs text-[#065A57] flex items-center">
                    <FiClock className="mr-1" />
                    {formatTimeAgo(msg.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-[#065A57] whitespace-pre-wrap ml-10">
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Reply Section */}
        {ticket.status !== "closed" ? (
          <div className="p-6 border-t border-[#A8D8C1] bg-[#F0F7F4]">
            <h3 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
              <FiSend className="mr-2 text-[#02BB31]" />
              Send a Reply
            </h3>
            <form onSubmit={handleReply} className="space-y-4">
              <textarea
                rows="5"
                placeholder="Write your follow-up message..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors resize-none"
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={replying}
                  className="px-6 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {replying ? (
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
            </form>
          </div>
        ) : (
          <div className="p-6 border-t border-[#A8D8C1] bg-[#F0F7F4]">
            <div className="bg-gray-100 rounded-xl p-4 text-sm text-gray-600 flex items-center">
              <FiInfo className="mr-2 text-gray-500" />
              This ticket is closed. If you need further assistance, please create a new ticket.
            </div>
            <div className="mt-4 flex justify-end">
              <Link
                to="/landlord/support"
                className="px-6 py-3 bg-[#02BB31] text-white rounded-lg font-semibold hover:bg-[#0D915C] transition-colors"
              >
                Back to Support
              </Link>
            </div>
          </div>
        )}

        {/* Quick Contact Info */}
        {ticket.status !== "closed" && (
          <div className="p-6 border-t border-[#A8D8C1] bg-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#02BB31]/10 rounded-lg">
                  <FiInfo className="text-[#02BB31]" />
                </div>
                <p className="text-sm text-[#065A57]">
                  Need immediate assistance? Contact us directly:
                </p>
              </div>
              <div className="flex space-x-3">
                <a
                  href="mailto:support@makaolink.com"
                  className="px-4 py-2 text-[#013E43] border border-[#A8D8C1] rounded-lg hover:bg-[#F0F7F4] transition-colors"
                >
                  Email Support
                </a>
                <a
                  href="https://wa.me/254712345678"
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
        )}
      </div>
    </div>
  );
};

export default LandlordSupportDetailPage;