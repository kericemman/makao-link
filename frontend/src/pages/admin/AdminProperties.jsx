import { useEffect, useState } from "react"
import API from "../../api/api"
import { 
  FiHome, 
  FiMapPin, 
  FiDollarSign, 
  FiUser, 
  FiMail,
  FiCalendar,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiChevronDown,
  FiX,
  FiImage,
  FiGrid,
  FiList,
  FiEdit2,
  FiTrash2
} from "react-icons/fi"
import { FaBed, FaBath, FaBuilding, FaCity } from "react-icons/fa"
import toast from "react-hot-toast"

function AdminProperties() {
  const [properties, setProperties] = useState([])
  const [filteredProperties, setFilteredProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState("grid") // grid or table
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    fetchProperties()
  }, [])

  useEffect(() => {
    filterProperties()
  }, [properties, searchTerm, statusFilter])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const res = await API.get("/properties")
      setProperties(res.data || [])
    } catch (error) {
      toast.error("Failed to load properties", {
        style: { background: "#013E43", color: "#fff" }
      })
    } finally {
      setLoading(false)
    }
  }

  const filterProperties = () => {
    let filtered = [...properties]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.landlord?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    setFilteredProperties(filtered)
  }

  const approveProperty = async (id) => {
    try {
      await API.put(`/admin/properties/${id}/approve`)
      toast.success("Property approved successfully", {
        style: { background: "#02BB31", color: "#fff" }
      })
      fetchProperties()
    } catch (error) {
      toast.error("Failed to approve property", {
        style: { background: "#013E43", color: "#fff" }
      })
    }
  }

  const rejectProperty = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection", {
        style: { background: "#013E43", color: "#fff" }
      })
      return
    }

    try {
      await API.put(`/admin/properties/${selectedProperty._id}/reject`, {
        reason: rejectReason
      })
      toast.success("Property rejected", {
        style: { background: "#02BB31", color: "#fff" }
      })
      setShowRejectModal(false)
      setRejectReason("")
      setSelectedProperty(null)
      fetchProperties()
    } catch (error) {
      toast.error("Failed to reject property", {
        style: { background: "#013E43", color: "#fff" }
      })
    }
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#02BB31]/10 text-[#02BB31]">
            <FiCheckCircle className="mr-1" />
            Approved
          </span>
        )
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
            <FiClock className="mr-1" />
            Pending
          </span>
        )
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
            <FiXCircle className="mr-1" />
            Rejected
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {status}
          </span>
        )
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const stats = {
    total: properties.length,
    approved: properties.filter(p => p.status === "approved").length,
    pending: properties.filter(p => p.status === "pending").length,
    rejected: properties.filter(p => p.status === "rejected").length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading properties...</p>
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
              <FiHome className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">Property Moderation</h1>
              <p className="text-sm text-[#065A57]">Review and manage property listings</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchProperties}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title={viewMode === "grid" ? "Switch to table view" : "Switch to grid view"}
            >
              {viewMode === "grid" ? <FiList className="text-lg" /> : <FiGrid className="text-lg" />}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#013E43]">
          <p className="text-sm text-[#065A57]">Total Properties</p>
          <p className="text-2xl font-bold text-[#013E43]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#02BB31]">
          <p className="text-sm text-[#065A57]">Approved</p>
          <p className="text-2xl font-bold text-[#02BB31]">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-yellow-400">
          <p className="text-sm text-[#065A57]">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-red-400">
          <p className="text-sm text-[#065A57]">Rejected</p>
          <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-4 border border-[#A8D8C1]">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#065A57]" />
            <input
              type="text"
              placeholder="Search by title, location, city, or landlord..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center space-x-2">
            <FiFilter className="text-[#065A57]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-[#065A57]">
          Showing {filteredProperties.length} of {properties.length} properties
        </div>
      </div>

      {/* Properties Display */}
      {filteredProperties.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
          <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiHome className="text-3xl text-[#A8D8C1]" />
          </div>
          <h3 className="text-lg font-semibold text-[#013E43] mb-2">No properties found</h3>
          <p className="text-sm text-[#065A57]">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "No properties have been listed yet"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <div
              key={property._id}
              className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              {/* Property Image */}
              <div className="relative h-48 overflow-hidden">
                {property.images?.[0] ? (
                  <img
                    src={property.images[0].url || property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-[#013E43] to-[#005C57] flex items-center justify-center">
                    <FiHome className="text-4xl text-white opacity-50" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  {getStatusBadge(property.status)}
                </div>

                {/* Price Tag */}
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-[#013E43]/90 text-white text-sm font-semibold rounded-full">
                  {formatPrice(property.price)}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-[#013E43] mb-1 line-clamp-1">
                  {property.title}
                </h3>
                
                <p className="text-sm text-[#065A57] mb-3 flex items-center">
                  <FiMapPin className="mr-1 flex-shrink-0" />
                  <span className="line-clamp-1">{property.location}, {property.city}</span>
                </p>

                {/* Landlord Info */}
                <div className="flex items-center space-x-2 mb-3 p-2 bg-[#F0F7F4] rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {property.landlord?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#013E43] truncate">{property.landlord?.name}</p>
                    <p className="text-xs text-[#065A57] truncate">{property.landlord?.email}</p>
                  </div>
                </div>

                {/* Property Features */}
                <div className="flex items-center space-x-4 mb-3 text-sm text-[#065A57]">
                  <span className="flex items-center">
                    <FaBed className="mr-1" /> {property.bedrooms || 0}
                  </span>
                  <span className="flex items-center">
                    <FaBath className="mr-1" /> {property.bathrooms || 0}
                  </span>
                  <span className="flex items-center">
                    <FiImage className="mr-1" /> {property.images?.length || 0}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-[#A8D8C1]">
                  <button
                    onClick={() => {
                      setSelectedProperty(property)
                      setShowDetailsModal(true)
                    }}
                    className="text-sm text-[#02BB31] hover:text-[#0D915C] flex items-center"
                  >
                    <FiEye className="mr-1" />
                    View Details
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    {property.status === "pending" && (
                      <>
                        <button
                          onClick={() => approveProperty(property._id)}
                          className="p-2 text-[#02BB31] hover:bg-[#02BB31]/10 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <FiCheckCircle />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProperty(property)
                            setShowRejectModal(true)
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <FiXCircle />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#A8D8C1]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#013E43] to-[#005C57] text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Property</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Landlord</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Listed</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#A8D8C1]">
                {filteredProperties.map((property) => (
                  <tr key={property._id} className="hover:bg-[#F0F7F4] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-lg overflow-hidden flex-shrink-0">
                          {property.images?.[0] ? (
                            <img
                              src={property.images[0].url || property.images[0]}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FiHome className="text-white text-lg" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#013E43]">{property.title}</p>
                          <p className="text-xs text-[#065A57]">{property.bedrooms} bed, {property.bathrooms} bath</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#013E43]">{property.landlord?.name}</p>
                      <p className="text-xs text-[#065A57]">{property.landlord?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#013E43]">{property.location}</p>
                      <p className="text-xs text-[#065A57]">{property.city}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#02BB31]">{formatPrice(property.price)}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(property.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#065A57]">
                      {formatDate(property.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedProperty(property)
                            setShowDetailsModal(true)
                          }}
                          className="p-2 text-[#02BB31] hover:bg-[#F0F7F4] rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                        {property.status === "pending" && (
                          <>
                            <button
                              onClick={() => approveProperty(property._id)}
                              className="p-2 text-[#02BB31] hover:bg-[#02BB31]/10 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <FiCheckCircle />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProperty(property)
                                setShowRejectModal(true)
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <FiXCircle />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-[#A8D8C1] p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl overflow-hidden">
                  {selectedProperty.images?.[0] ? (
                    <img
                      src={selectedProperty.images[0].url || selectedProperty.images[0]}
                      alt={selectedProperty.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiHome className="text-white text-xl" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#013E43]">Property Details</h2>
                  <p className="text-sm text-[#065A57]">ID: {selectedProperty._id.slice(-8)}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedProperty(null)
                  setShowDetailsModal(false)
                }}
                className="p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
              >
                <FiX className="text-xl text-[#065A57]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status and Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#F0F7F4] rounded-xl">
                  <p className="text-xs text-[#065A57] mb-1">Status</p>
                  <div className="flex items-center">
                    {getStatusBadge(selectedProperty.status)}
                  </div>
                </div>
                <div className="p-4 bg-[#F0F7F4] rounded-xl">
                  <p className="text-xs text-[#065A57] mb-1">Price</p>
                  <p className="text-2xl font-bold text-[#02BB31]">
                    {formatPrice(selectedProperty.price)}
                  </p>
                </div>
              </div>

              {/* Image Gallery */}
              {selectedProperty.images?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[#013E43] mb-3">Photos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {selectedProperty.images.map((img, i) => (
                      <img
                        key={i}
                        src={img.url || img}
                        alt={`${selectedProperty.title} - ${i + 1}`}
                        className="h-24 w-full object-cover rounded-lg border border-[#A8D8C1]"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-[#013E43]">Basic Information</h3>
                  <div className="bg-[#F0F7F4] p-4 rounded-xl space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#065A57]">Title</span>
                      <span className="font-medium">{selectedProperty.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#065A57]">Type</span>
                      <span className="font-medium capitalize">{selectedProperty.propertyType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#065A57]">Bedrooms</span>
                      <span className="font-medium">{selectedProperty.bedrooms || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#065A57]">Bathrooms</span>
                      <span className="font-medium">{selectedProperty.bathrooms || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-[#013E43]">Location</h3>
                  <div className="bg-[#F0F7F4] p-4 rounded-xl space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#065A57]">City</span>
                      <span className="font-medium">{selectedProperty.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#065A57]">Location</span>
                      <span className="font-medium">{selectedProperty.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Landlord Info */}
              <div>
                <h3 className="font-semibold text-[#013E43] mb-3">Landlord Information</h3>
                <div className="bg-[#F0F7F4] p-4 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-full flex items-center justify-center text-white font-bold">
                      {selectedProperty.landlord?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-[#013E43]">{selectedProperty.landlord?.name}</p>
                      <p className="text-sm text-[#065A57]">{selectedProperty.landlord?.email}</p>
                      {selectedProperty.landlord?.phone && (
                        <p className="text-sm text-[#065A57]">{selectedProperty.landlord.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold text-[#013E43] mb-3">Description</h3>
                <div className="bg-[#F0F7F4] p-4 rounded-xl">
                  <p className="text-[#013E43] whitespace-pre-wrap">
                    {selectedProperty.description}
                  </p>
                </div>
              </div>

              {/* Amenities */}
              {selectedProperty.amenities?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[#013E43] mb-3">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedProperty.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center text-sm text-[#065A57]">
                        <FiCheckCircle className="text-[#02BB31] mr-2" />
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-[#F0F7F4] p-3 rounded-lg">
                  <span className="text-[#065A57]">Listed:</span>
                  <span className="ml-2 font-medium">
                    {formatDate(selectedProperty.createdAt)}
                  </span>
                </div>
                <div className="bg-[#F0F7F4] p-3 rounded-lg">
                  <span className="text-[#065A57]">Last Updated:</span>
                  <span className="ml-2 font-medium">
                    {formatDate(selectedProperty.updatedAt)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-[#A8D8C1]">
                <button
                  onClick={() => {
                    setSelectedProperty(null)
                    setShowDetailsModal(false)
                  }}
                  className="px-4 py-2 text-[#065A57] border border-[#A8D8C1] rounded-lg hover:bg-[#F0F7F4]"
                >
                  Close
                </button>
                {selectedProperty.status === "pending" && (
                  <>
                    <button
                      onClick={() => {
                        approveProperty(selectedProperty._id)
                        setShowDetailsModal(false)
                      }}
                      className="px-4 py-2 bg-[#02BB31] text-white rounded-lg hover:bg-[#0D915C]"
                    >
                      Approve Property
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false)
                        setShowRejectModal(true)
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Reject Property
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <FiXCircle className="text-3xl text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-[#013E43] mb-2">Reject Property</h3>
              <p className="text-sm text-[#065A57]">
                Are you sure you want to reject "{selectedProperty.title}"? 
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
                  setSelectedProperty(null)
                }}
                className="flex-1 px-4 py-2 border border-[#A8D8C1] text-[#065A57] rounded-lg hover:bg-[#F0F7F4] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={rejectProperty}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Reject Property
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminProperties