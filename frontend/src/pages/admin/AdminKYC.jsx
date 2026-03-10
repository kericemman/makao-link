import { useEffect, useState } from "react"
import {
  getPendingKYC,
  approveKYC
} from "../../services/admin.service"
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiEye,
  FiDownload,
  FiShield,
  FiRefreshCw,
  FiSearch,
  FiFilter
} from "react-icons/fi"
import { FaIdCard, FaPassport, } from "react-icons/fa"
import toast from "react-hot-toast"

function AdminKYC() {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  const fetchKYC = async () => {
    try {
      setLoading(true)
      const res = await getPendingKYC()
      setUsers(res.data || [])
    } catch (error) {
      toast.error("Failed to load KYC requests", {
        style: { background: "#013E43", color: "#fff" }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKYC()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [users, searchTerm])

  const handleApprove = async (id) => {
    try {
      await approveKYC(id)
      toast.success("KYC approved successfully", {
        style: { background: "#02BB31", color: "#fff" }
      })
      fetchKYC()
    } catch (error) {
      toast.error("Failed to approve KYC", {
        style: { background: "#013E43", color: "#fff" }
      })
    }
  }

  const getDocumentIcon = (type) => {
    switch(type?.toLowerCase()) {
      case "national id":
        return <FaIdCard className="text-[#013E43]" />
      case "passport":
        return <FaPassport className="text-[#02BB31]" />
      case "driver's license":
        return <FaDriverLicense className="text-blue-500" />
      default:
        return <FiShield className="text-[#065A57]" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading KYC requests...</p>
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
              <FiShield className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">KYC Verification</h1>
              <p className="text-sm text-[#065A57]">Review and verify landlord identity documents</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchKYC}
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
              <p className="text-sm text-[#065A57]">Pending KYC Requests</p>
              <p className="text-3xl font-bold text-[#013E43]">{users.length}</p>
            </div>
          </div>
          <div className="h-12 w-px bg-[#A8D8C1]"></div>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-[#02BB31]/10 rounded-xl">
              <FiCheckCircle className="text-2xl text-[#02BB31]" />
            </div>
            <div>
              <p className="text-sm text-[#065A57]">Awaiting Review</p>
              <p className="text-3xl font-bold text-[#013E43]">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {users.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-4 border border-[#A8D8C1]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#065A57]" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] focus:border-transparent"
            />
          </div>
          <div className="mt-2 text-sm text-[#065A57]">
            Showing {filteredUsers.length} of {users.length} requests
          </div>
        </div>
      )}

      {/* KYC Requests */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
          <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShield className="text-3xl text-[#A8D8C1]" />
          </div>
          <h3 className="text-lg font-semibold text-[#013E43] mb-2">No pending KYC requests</h3>
          <p className="text-sm text-[#065A57]">
            {searchTerm ? "No results match your search" : "All landlord KYC requests have been processed"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredUsers.map((user) => (
            <div
              key={user._id}
              className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all"
            >
              {/* User Header */}
              <div className="p-6 border-b border-[#A8D8C1] bg-gradient-to-r from-[#F0F7F4] to-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-full flex items-center justify-center text-white font-bold text-2xl">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#013E43]">{user.name}</h2>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="flex items-center text-sm text-[#065A57]">
                          <FiMail className="mr-1" /> {user.email}
                        </span>
                        {user.phone && (
                          <span className="flex items-center text-sm text-[#065A57]">
                            <FiPhone className="mr-1" /> {user.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded-full text-sm font-medium flex items-center">
                    <FiClock className="mr-1" />
                    Pending Verification
                  </span>
                </div>
              </div>

              {/* KYC Documents */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-[#013E43] mb-4">Identity Documents</h3>
                
                {user.kycDocuments?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {user.kycDocuments.map((doc, index) => (
                      <div key={index} className="bg-[#F0F7F4] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {getDocumentIcon(doc.documentType)}
                            <span className="font-medium text-[#013E43]">{doc.documentType}</span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedImage(doc.documentUrl)
                              setShowImageModal(true)
                            }}
                            className="p-2 text-[#02BB31] hover:bg-white rounded-lg transition-colors"
                            title="View Full Image"
                          >
                            <FiEye />
                          </button>
                        </div>
                        <div 
                          className="relative h-40 rounded-lg overflow-hidden border-2 border-[#A8D8C1] cursor-pointer hover:border-[#02BB31] transition-colors"
                          onClick={() => {
                            setSelectedImage(doc.documentUrl)
                            setShowImageModal(true)
                          }}
                        >
                          <img
                            src={doc.documentUrl}
                            alt={doc.documentType}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#F0F7F4] rounded-xl p-8 text-center">
                    <FiXCircle className="text-3xl text-red-400 mx-auto mb-2" />
                    <p className="text-[#065A57]">No documents uploaded</p>
                  </div>
                )}

                {/* Action Button */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => handleApprove(user._id)}
                    className="px-6 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105 flex items-center"
                  >
                    <FiCheckCircle className="mr-2" />
                    Approve KYC
                  </button>
                </div>
              </div>
            </div>
          ))}
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
              alt="KYC Document"
              className="w-full rounded-lg shadow-2xl"
            />
            <a
              href={selectedImage}
              download
              className="absolute -bottom-10 right-0 text-white hover:text-[#02BB31] transition-colors flex items-center"
            >
              <FiDownload className="mr-2" />
              Download
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminKYC