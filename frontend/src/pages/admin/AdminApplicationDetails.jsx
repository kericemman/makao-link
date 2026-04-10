import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  getServiceApplicationById,
  approveServiceApplication,
  rejectServiceApplication
} from "../../services/admin.service";
import { 
  FiArrowLeft, 
  FiBriefcase, 
  FiMapPin, 
  FiUser, 
  FiMail,
  FiPhone,
  FiGlobe,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiDollarSign,
  FiRefreshCw,
  FiShield,
  FiCalendar,
  FiTag,
  FiImage
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

const AdminServiceApplicationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getServiceApplicationById(id);
      setApplication(data.application);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load application");
      toast.error("Failed to load application", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const handleApprove = async () => {
    try {
      setActionLoading("approve");
      await approveServiceApplication(id);
      toast.success("Application approved successfully", {
        style: { background: "#02BB31", color: "#fff" }
      });
      await fetchApplication();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve application", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setActionLoading("");
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading("reject");
      await rejectServiceApplication(id);
      toast.success("Application rejected", {
        style: { background: "#02BB31", color: "#fff" }
      });
      await fetchApplication();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject application", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setActionLoading("");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-[#A8D8C1]">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="text-3xl text-red-500" />
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => navigate("/admin/services/applications")}
          className="px-4 py-2 bg-[#02BB31] text-white rounded-lg hover:bg-[#0D915C] transition-colors"
        >
          Back to Applications
        </button>
      </div>
    );
  }

  if (!application) return null;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/admin/services/applications")}
              className="p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
            >
              <FiArrowLeft className="text-xl text-[#065A57]" />
            </button>
            <div className="p-3 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl">
              <FiBriefcase className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">Application Details</h1>
              <p className="text-sm text-[#065A57]">ID: {application._id.slice(-8)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchApplication}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main Content - Left Column */}
        <div className="space-y-6">
          {/* Company Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${
              application.status === "approved" ? "from-[#02BB31] to-[#0D915C]" :
              application.status === "rejected" ? "from-red-400 to-red-500" :
              "from-yellow-400 to-yellow-500"
            }`}></div>
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-[#013E43]">
                      {application.companyName}
                    </h2>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${reviewStatusClasses[application.status]}`}>
                      {reviewStatusIcons[application.status]}
                      <span className="ml-1 capitalize">{application.status?.replace("_", " ")}</span>
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${paymentStatusClasses[application.paymentStatus]}`}>
                      {paymentStatusIcons[application.paymentStatus]}
                      <span className="ml-1 capitalize">Payment: {application.paymentStatus}</span>
                    </span>
                  </div>
                  <p className="text-sm text-[#065A57] flex items-center">
                    <FiMapPin className="mr-2 text-[#02BB31]" />
                    {application.location || "Location not specified"}
                  </p>
                  <p className="text-sm text-[#065A57] flex items-center mt-1">
                    <FiTag className="mr-2 text-[#02BB31]" />
                    Category: {application.category || "N/A"}
                  </p>
                </div>

                {application.logo ? (
                  <div 
                    className="relative group cursor-pointer"
                    onClick={() => {
                      setSelectedImage(application.logo);
                      setShowImageModal(true);
                    }}
                  >
                    <img
                      src={application.logo}
                      alt={application.companyName}
                      className="h-20 w-20 rounded-xl object-cover border-2 border-[#A8D8C1] group-hover:border-[#02BB31] transition-all"
                    />
                    <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <FiImage className="text-white text-lg" />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
            <h3 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
              <FiUser className="mr-2 text-[#02BB31]" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#F0F7F4] p-4 rounded-lg">
                <p className="text-xs text-[#065A57] mb-1">Contact Person</p>
                <p className="font-medium text-[#013E43]">{application.contactPerson}</p>
              </div>
              <div className="bg-[#F0F7F4] p-4 rounded-lg">
                <p className="text-xs text-[#065A57] mb-1">Email</p>
                <p className="font-medium text-[#013E43] break-all">{application.email}</p>
              </div>
              {application.phone && (
                <div className="bg-[#F0F7F4] p-4 rounded-lg">
                  <p className="text-xs text-[#065A57] mb-1">Phone</p>
                  <p className="font-medium text-[#013E43]">{application.phone}</p>
                </div>
              )}
              {application.website && (
                <div className="bg-[#F0F7F4] p-4 rounded-lg">
                  <p className="text-xs text-[#065A57] mb-1">Website</p>
                  <a href={application.website} target="_blank" rel="noopener noreferrer" className="font-medium text-[#02BB31] hover:underline break-all">
                    {application.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Company Description */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
            <h3 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
              <FiFileText className="mr-2 text-[#02BB31]" />
              Company Description
            </h3>
            <p className="text-[#065A57] leading-relaxed whitespace-pre-wrap">
              {application.description}
            </p>
          </div>

          {/* Additional Documents */}
          {application.documents && application.documents.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
              <h3 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
                <FiFileText className="mr-2 text-[#02BB31]" />
                Supporting Documents
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {application.documents.map((doc, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedImage(doc.url || doc);
                      setShowImageModal(true);
                    }}
                    className="relative group cursor-pointer"
                  >
                    <img
                      src={doc.url || doc}
                      alt={`Document ${index + 1}`}
                      className="h-24 w-full object-cover rounded-lg border border-[#A8D8C1] group-hover:border-[#02BB31] transition-all"
                    />
                    <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <FiImage className="text-white text-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
            <h3 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
              <FiShield className="mr-2 text-[#02BB31]" />
              Application Status
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#065A57]">Review Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${reviewStatusClasses[application.status]}`}>
                  {reviewStatusIcons[application.status]}
                  <span className="ml-1 capitalize">{application.status?.replace("_", " ")}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#065A57]">Payment Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatusClasses[application.paymentStatus]}`}>
                  {paymentStatusIcons[application.paymentStatus]}
                  <span className="ml-1 capitalize">{application.paymentStatus}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#065A57]">Application Fee</span>
                <span className="font-medium text-[#013E43]">KES {application.amountPaid?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#065A57]">Payment Reference</span>
                <span className="font-mono text-xs text-[#013E43]">{application.paymentReference || "Not available"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#065A57]">Submitted</span>
                <span className="text-[#013E43]">{formatDate(application.createdAt)}</span>
              </div>
            </div>

            {application.paymentStatus !== "success" && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700 flex items-start gap-2">
                <FiAlertCircle className="text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>Payment has not been confirmed yet. This application should not be approved until payment succeeds.</span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
            <h3 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
              <FaHandshake className="mr-2 text-[#02BB31]" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <a
                href={`mailto:${application.email}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#013E43] text-white rounded-lg hover:bg-[#005C57] transition-colors"
              >
                <FiMail />
                Send Email
              </a>
              {application.phone && (
                <>
                  <a
                    href={`tel:${application.phone}`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#013E43] text-white rounded-lg hover:bg-[#005C57] transition-colors"
                  >
                    <FiPhone />
                    Call
                  </a>
                  <a
                    href={`https://wa.me/${application.phone.replace(/^0/, "254")}`}
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

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
            <h3 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
              <FiCheckCircle className="mr-2 text-[#02BB31]" />
              Take Action
            </h3>
            <div className="space-y-3">
              <button
                onClick={handleApprove}
                disabled={actionLoading === "approve" || application.paymentStatus !== "success"}
                className="w-full py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === "approve" ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline-block mr-2"></div>
                    Approving...
                  </>
                ) : (
                  "Approve Application"
                )}
              </button>

              <button
                onClick={handleReject}
                disabled={actionLoading === "reject"}
                className="w-full py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === "reject" ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline-block mr-2"></div>
                    Rejecting...
                  </>
                ) : (
                  "Reject Application"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => {
                setShowImageModal(false);
                setSelectedImage(null);
              }}
              className="absolute -top-10 right-0 text-white hover:text-[#02BB31] transition-colors"
            >
              <FiXCircle className="text-3xl" />
            </button>
            <img
              src={selectedImage}
              alt="Full size document"
              className="w-full rounded-lg shadow-2xl"
            />
            <a
              href={selectedImage}
              download
              className="absolute -bottom-10 right-0 text-white hover:text-[#02BB31] transition-colors flex items-center gap-2"
            >
              <FiDownload />
              Download
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServiceApplicationDetailPage;