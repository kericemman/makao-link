import { useEffect, useState } from "react"
import {
  getPartnerApplications,
  approvePartner,
  rejectPartner
} from "../../services/admin.service"
import {
  FiBriefcase,
  FiUser,
  FiPhone,
  FiMail,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiEye,
  FiDownload,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiMapPin,
  FiStar,
  FiShield
} from "react-icons/fi"
import { FaBuilding, FaRegBuilding } from "react-icons/fa"
import toast from "react-hot-toast"

function AdminPartners() {
  const [partners, setPartners] = useState([])
  const [filteredPartners, setFilteredPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [serviceFilter, setServiceFilter] = useState("all")
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [selectedImage, setSelectedImage] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const res = await getPartnerApplications()
      setPartners(res.data || [])
    } catch (error) {
      toast.error("Failed to load partner applications", {
        style: { background: "#013E43", color: "#fff" }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  useEffect(() => {
    filterPartners()
  }, [partners, searchTerm, serviceFilter])

  const filterPartners = () => {
    let filtered = [...partners]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone?.includes(searchTerm)
      )
    }

    // Service type filter
    if (serviceFilter !== "all") {
      filtered = filtered.filter(p => p.serviceType === serviceFilter)
    }

    setFilteredPartners(filtered)
  }

  const handleApprove = async (id) => {
    try {
      await approvePartner(id)
      toast.success("Partner application approved successfully", {
        style: { background: "#02BB31", color: "#fff" }
      })
      fetchApplications()
      if (selectedPartner) {
        setSelectedPartner(null)
        setShowDetailsModal(false)
      }
    } catch (error) {
      toast.error("Failed to approve partner", {
        style: { background: "#013E43", color: "#fff" }
      })
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection", {
        style: { background: "#013E43", color: "#fff" }
      })
      return
    }

    try {
      await rejectPartner(selectedPartner._id, { reason: rejectReason })
      toast.success("Partner application rejected", {
        style: { background: "#02BB31", color: "#fff" }
      })
      setShowRejectModal(false)
      setRejectReason("")
      setSelectedPartner(null)
      setShowDetailsModal(false)
      fetchApplications()
    } catch (error) {
      toast.error("Failed to reject partner", {
        style: { background: "#013E43", color: "#fff" }
      })
    }
  }

  const getServiceIcon = (type) => {
    switch(type) {
      case "moving":
        return <FiTruck className="text-[#02BB31]" />
      case "cleaning":
        return <MdCleaningServices className="text-[#013E43]" />
      case "packing":
        return <FiPackage className="text-blue-500" />
      default:
        return <FiBriefcase className="text-[#065A57]" />
    }
  }

  const serviceTypes = [
    "all",
    "moving",
    "cleaning",
    "packing",
    "trucking",
    "storage"
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading partner applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl">
              <FaRegBuilding className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">Partner Applications</h1>
              <p className="text-sm text-[#065A57]">Review and manage partner service applications</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchApplications}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-[#A8D8C1]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <FiClock className="text-2xl text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-[#065A57]">Pending Applications</p>
              <p className="text-3xl font-bold text-[#013E43]">{partners.length}</p>
            </div>
          </div>
          <div className="h-12 w-px bg-[#A8D8C1]"></div>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-[#02BB31]/10 rounded-xl">
              <FiBriefcase className="text-2xl text-[#02BB31]" />
            </div>
            <div>
              <p className="text-sm text-[#065A57]">Service Types</p>
              <p className="text-3xl font-bold text-[#013E43]">
                {new Set(partners.map(p => p.serviceType)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      {partners.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-4 border border-[#A8D8C1]">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#065A57]" />
              <input
                type="text"
                placeholder="Search by company, contact person, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-2">
              <FiFilter className="text-[#065A57]" />
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
              >
                {serviceTypes.map(type => (
                  <option key={type} value={type}>
                    {type === "all" ? "All Services" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-[#065A57]">
            Showing {filteredPartners.length} of {partners.length} applications
          </div>
        </div>
      )}

      {/* Applications List */}
      {filteredPartners.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
          <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
            <FaRegBuilding className="text-3xl text-[#A8D8C1]" />
          </div>
          <h3 className="text-lg font-semibold text-[#013E43] mb-2">No applications found</h3>
          <p className="text-sm text-[#065A57]">
            {searchTerm || serviceFilter !== "all"
              ? "Try adjusting your search or filters"
              : "No partner applications are pending review"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPartners.map((partner) => (
            <div
              key={partner._id}
              className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all"
            >
              {/* Partner Header */}
              <div className="p-6 border-b border-[#A8D8C1] bg-gradient-to-r from-[#F0F7F4] to-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Company Logo */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[#A8D8C1] bg-white">
                      {partner.logo?.url ? (
                        <img
                          src={partner.logo.url}
                          alt={partner.companyName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-[#013E43] to-[#005C57] flex items-center justify-center">
                          <FaBuilding className="text-white text-2xl opacity-50" />
                        </div>
                      )}
                    </div>
                    
                    {/* Company Info */}
                    <div>
                      <h2 className="text-xl font-bold text-[#013E43]">{partner.companyName}</h2>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="flex items-center text-sm text-[#065A57]">
                          <FiUser className="mr-1" /> {partner.contactPerson}
                        </span>
                        <span className="flex items-center text-sm text-[#065A57]">
                          <FiBriefcase className="mr-1" /> {partner.serviceType}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded-full text-sm font-medium flex items-center">
                    <FiClock className="mr-1" />
                    Pending Review
                  </span>
                </div>
              </div>

              {/* Partner Details */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Contact Info */}
                  <div className="bg-[#F0F7F4] p-3 rounded-lg">
                    <p className="text-xs text-[#065A57] mb-2">Contact Information</p>
                    <div className="space-y-1">
                      <p className="text-sm flex items-center">
                        <FiPhone className="mr-2 text-[#02BB31]" />
                        {partner.phone}
                      </p>
                      <p className="text-sm flex items-center">
                        <FiMail className="mr-2 text-[#02BB31]" />
                        {partner.email}
                      </p>
                    </div>
                  </div>

                  {/* Business Info */}
                  <div className="bg-[#F0F7F4] p-3 rounded-lg">
                    <p className="text-xs text-[#065A57] mb-2">Business Information</p>
                    <div className="space-y-1">
                      <p className="text-sm flex items-center">
                        <FiBriefcase className="mr-2 text-[#02BB31]" />
                        Service: {partner.serviceType}
                      </p>
                      <p className="text-sm flex items-center">
                        <FiStar className="mr-2 text-[#02BB31]" />
                        Experience: {partner.yearsInBusiness || 'N/A'} years
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="bg-[#F0F7F4] p-3 rounded-lg">
                    <p className="text-xs text-[#065A57] mb-2">Location</p>
                    <div className="space-y-1">
                      <p className="text-sm flex items-center">
                        <FiMapPin className="mr-2 text-[#02BB31]" />
                        {partner.city || 'Nairobi'}, Kenya
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-[#F0F7F4] p-4 rounded-lg mb-4">
                  <p className="text-xs text-[#065A57] mb-2">Company Description</p>
                  <p className="text-sm text-[#013E43]">
                    {partner.description || 'No description provided'}
                  </p>
                </div>

                {/* Documents */}
                {partner.documents?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-[#013E43] mb-3 flex items-center">
                      <FiFileText className="mr-2 text-[#02BB31]" />
                      Business Documents ({partner.documents.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {partner.documents.map((doc, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setSelectedImage(doc.url)
                            setShowImageModal(true)
                          }}
                          className="relative group cursor-pointer"
                        >
                          <img
                            src={doc.url}
                            alt={`Document ${index + 1}`}
                            className="h-24 w-full object-cover rounded-lg border border-[#A8D8C1] group-hover:border-[#02BB31] transition-colors"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <FiEye className="text-white text-xl" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-[#A8D8C1]">
                  <button
                    onClick={() => {
                      setSelectedPartner(partner)
                      setShowRejectModal(true)
                    }}
                    className="px-6 py-2 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors font-medium flex items-center"
                  >
                    <FiXCircle className="mr-2" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(partner._id)}
                    className="px-6 py-2 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center"
                  >
                    <FiCheckCircle className="mr-2" />
                    Approve Application
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <FiXCircle className="text-3xl text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-[#013E43] mb-2">Reject Application</h3>
              <p className="text-sm text-[#065A57]">
                Are you sure you want to reject "{selectedPartner.companyName}"? 
                Please provide a reason for rejection.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[#065A57] mb-2">
                Reason for rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows="3"
                className="w-full px-4 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31]"
                placeholder="Enter reason for rejection..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason("")
                  setSelectedPartner(null)
                }}
                className="flex-1 px-4 py-2 border border-[#A8D8C1] text-[#065A57] rounded-lg hover:bg-[#F0F7F4] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => {
                setShowImageModal(false)
                setSelectedImage(null)
              }}
              className="absolute -top-10 right-0 text-white hover:text-[#02BB31] transition-colors"
            >
              <FiXCircle className="text-3xl" />
            </button>
            <img
              src={selectedImage}
              alt="Document"
              className="w-full rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPartners