import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  getAdminContactMessageById,
  updateAdminContactMessage
} from "../../services/contact.service";
import { 
  FiArrowLeft, 
  FiMail, 
  FiUser, 
  FiPhone, 
  FiCalendar,
  FiClock,
  FiMessageSquare,
  FiCheckCircle,
  FiAlertCircle,
  FiSave,
  FiRefreshCw,
  FiInfo,
  FiStar,
  FiEye,
  FiSend,
  FiTrash2
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";

const statusClasses = {
  new: "bg-[#02BB31]/10 text-[#02BB31] border-[#02BB31]/20",
  in_progress: "bg-yellow-100 text-yellow-600 border-yellow-200",
  resolved: "bg-blue-100 text-blue-600 border-blue-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200"
};

const statusIcons = {
  new: <FiStar className="text-[#02BB31]" />,
  in_progress: <FiClock className="text-yellow-500" />,
  resolved: <FiCheckCircle className="text-blue-500" />,
  closed: <FiCheckCircle className="text-gray-500" />
};

const AdminContactMessageDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contactMessage, setContactMessage] = useState(null);
  const [status, setStatus] = useState("new");
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchMessage = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminContactMessageById(id);
      setContactMessage(data.message);
      setStatus(data.message.status);
      setAdminNotes(data.message.adminNotes || "");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load message");
      toast.error("Failed to load message", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessage();
  }, [id]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const data = await updateAdminContactMessage(id, {
        status,
        adminNotes
      });

      setContactMessage(data.contactMessage);
      toast.success("Message updated successfully", {
        style: { background: "#02BB31", color: "#fff" }
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update message");
      toast.error("Failed to update message", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast.error("Please enter a reply message", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    try {
      setSendingReply(true);
      // You'll need to implement this API endpoint
      await sendReply(id, { message: replyMessage, email: contactMessage.email });
      
      toast.success("Reply sent successfully", {
        style: { background: "#02BB31", color: "#fff" }
      });
      setShowReplyForm(false);
      setReplyMessage("");
    } catch (err) {
      toast.error("Failed to send reply", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setSendingReply(false);
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
          <p className="text-[#065A57]">Loading message details...</p>
        </div>
      </div>
    );
  }

  if (error && !contactMessage) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-[#A8D8C1]">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="text-3xl text-red-500" />
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => navigate("/admin/contact")}
          className="px-4 py-2 bg-[#02BB31] text-white rounded-lg hover:bg-[#0D915C] transition-colors"
        >
          Back to Messages
        </button>
      </div>
    );
  }

  if (!contactMessage) return null;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/admin/contact")}
              className="p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
            >
              <FiArrowLeft className="text-xl text-[#065A57]" />
            </button>
            
            <div>
              <h1 className="text-xl font-bold text-[#013E43]">Message Details</h1>
              <p className="text-sm text-[#065A57]">ID: {contactMessage._id.slice(-8)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchMessage}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Message Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden">
            <div className="p-6 border-b border-[#A8D8C1] bg-gradient-to-r from-[#F0F7F4] to-white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[#013E43]">{contactMessage.subject}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusClasses[contactMessage.status]}`}>
                      {statusIcons[contactMessage.status]}
                      <span className="ml-1 capitalize">{contactMessage.status?.replace("_", " ")}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sender Information */}
            <div className="p-6 border-b border-[#A8D8C1]">
              <h3 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
                <FiUser className="mr-2 text-[#02BB31]" />
                Sender Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#F0F7F4] p-4 rounded-lg">
                  <p className="text-xs text-[#065A57] mb-1">Name</p>
                  <p className="font-medium text-[#013E43]">{contactMessage.name}</p>
                </div>
                <div className="bg-[#F0F7F4] p-4 rounded-lg">
                  <p className="text-xs text-[#065A57] mb-1">Email</p>
                  <a href={`mailto:${contactMessage.email}`} className="font-medium text-[#02BB31] hover:underline">
                    {contactMessage.email}
                  </a>
                </div>
                {contactMessage.phone && (
                  <div className="bg-[#F0F7F4] p-4 rounded-lg">
                    <p className="text-xs text-[#065A57] mb-1">Phone</p>
                    <a href={`tel:${contactMessage.phone}`} className="font-medium text-[#02BB31] hover:underline">
                      {contactMessage.phone}
                    </a>
                  </div>
                )}
                <div className="bg-[#F0F7F4] p-4 rounded-lg">
                  <p className="text-xs text-[#065A57] mb-1">Submitted</p>
                  <p className="font-medium text-[#013E43]">{formatDate(contactMessage.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Message Content */}
            <div className="p-6 border-b border-[#A8D8C1]">
              <h3 className="text-lg font-semibold text-[#013E43] mb-3 flex items-center">
                <FiMessageSquare className="mr-2 text-[#02BB31]" />
                Message
              </h3>
              <div className="bg-[#F0F7F4] p-4 rounded-lg">
                <p className="text-[#013E43] whitespace-pre-wrap leading-relaxed">
                  {contactMessage.message}
                </p>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#A8D8C1] text-xs text-[#065A57]">
                  <span className="flex items-center">
                    <FiCalendar className="mr-1" />
                    {formatDate(contactMessage.createdAt)}
                  </span>
                  <span className="flex items-center">
                    <FiClock className="mr-1" />
                    {formatTimeAgo(contactMessage.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-[#013E43] mb-3 flex items-center">
                <FiInfo className="mr-2 text-[#02BB31]" />
                Admin Notes
              </h3>
              <textarea
                rows="4"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes about this message..."
                className="w-full px-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
            <h3 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
              <FiInfo className="mr-2 text-[#02BB31]" />
              Message Status
            </h3>
            <div className="space-y-4">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
              >
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              {error && (
                <div className="bg-red-50 p-3 rounded-lg text-sm text-red-600 flex items-center gap-2">
                  <FiAlertCircle className="text-red-500" />
                  {error}
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
            <h3 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
              <FiSend className="mr-2 text-[#02BB31]" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <a
                href={`mailto:${contactMessage.email}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#013E43] text-white rounded-lg hover:bg-[#005C57] transition-colors"
              >
                <FiMail />
                Reply via Email
              </a>
              {contactMessage.phone && (
                <>
                  <a
                    href={`tel:${contactMessage.phone}`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#013E43] text-white rounded-lg hover:bg-[#005C57] transition-colors"
                  >
                    <FiPhone />
                    Call
                  </a>
                  <a
                    href={`https://wa.me/${contactMessage.phone.replace(/^0/, "254")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors"
                  >
                    <FaWhatsapp />
                    WhatsApp
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Timestamps Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
            <h3 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
              <FiClock className="mr-2 text-[#02BB31]" />
              Timeline
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#065A57]">Created</span>
                <span className="font-medium text-[#013E43]">{formatDate(contactMessage.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#065A57]">Last Updated</span>
                <span className="font-medium text-[#013E43]">{formatDate(contactMessage.updatedAt)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#A8D8C1]">
                <span className="text-[#065A57]">Time Ago</span>
                <span className="font-medium text-[#013E43]">{formatTimeAgo(contactMessage.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContactMessageDetailPage;