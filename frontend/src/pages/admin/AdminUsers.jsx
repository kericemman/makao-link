import { useEffect, useState } from "react"
import { 
  getUsers, 
  suspendUser,
  approveKYC 
} from "../../services/admin.service"
import { 
  FiUsers, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiShield,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiChevronDown,
  FiX,
  FiEye,
  FiUserCheck,
  FiUserX,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiStar,
  FiGrid,
  FiList
} from "react-icons/fi"
import { FaBuilding, FaKey, FaUserTie } from "react-icons/fa"
import toast from "react-hot-toast"

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [kycFilter, setKycFilter] = useState("all")
  const [viewMode, setViewMode] = useState("table") // table or grid
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [suspendReason, setSuspendReason] = useState("")

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await getUsers()
      setUsers(res.data || [])
    } catch (error) {
      toast.error("Failed to load users", {
        style: { background: "#013E43", color: "#fff" }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter, statusFilter, kycFilter])

  const filterUsers = () => {
    let filtered = [...users]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
      )
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(user => 
        statusFilter === "suspended" ? user.isSuspended : !user.isSuspended
      )
    }

    // KYC filter
    if (kycFilter !== "all") {
      filtered = filtered.filter(user => 
        kycFilter === "verified" ? user.isKycVerified : !user.isKycVerified
      )
    }

    setFilteredUsers(filtered)
  }

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      toast.error("Please provide a reason for suspension", {
        style: { background: "#013E43", color: "#fff" }
      })
      return
    }

    try {
      await suspendUser(selectedUser._id, { reason: suspendReason })
      toast.success("User suspended successfully", {
        style: { background: "#02BB31", color: "#fff" }
      })
      setShowSuspendModal(false)
      setSuspendReason("")
      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      toast.error("Failed to suspend user", {
        style: { background: "#013E43", color: "#fff" }
      })
    }
  }

  const handleApproveKYC = async (id) => {
    try {
      await approveKYC(id)
      toast.success("KYC approved successfully", {
        style: { background: "#02BB31", color: "#fff" }
      })
      fetchUsers()
    } catch (error) {
      toast.error("Failed to approve KYC", {
        style: { background: "#013E43", color: "#fff" }
      })
    }
  }

  const getRoleIcon = (role) => {
    switch(role) {
      case "admin":
        return <FiShield className="text-[#013E43]" />
      case "landlord":
        return <FaKey className="text-[#02BB31]" />
      case "tenant":
        return <FiUser className="text-blue-500" />
      default:
        return <FiUser className="text-[#065A57]" />
    }
  }

  const getRoleBadge = (role) => {
    switch(role) {
      case "admin":
        return <span className="px-2 py-1 bg-[#013E43]/10 text-[#013E43] rounded-full text-xs font-medium">Admin</span>
      case "landlord":
        return <span className="px-2 py-1 bg-[#02BB31]/10 text-[#02BB31] rounded-full text-xs font-medium">Landlord</span>
      case "tenant":
        return <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">Tenant</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{role}</span>
    }
  }

  const getStatusBadge = (isSuspended) => {
    return isSuspended ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
        <FiUserX className="mr-1" />
        Suspended
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#02BB31]/10 text-[#02BB31]">
        <FiUserCheck className="mr-1" />
        Active
      </span>
    )
  }

  const getKYCBadge = (isVerified) => {
    return isVerified ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#02BB31]/10 text-[#02BB31]">
        <FiCheckCircle className="mr-1" />
        Verified
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
        <FiClock className="mr-1" />
        Pending
      </span>
    )
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === "admin").length,
    landlords: users.filter(u => u.role === "landlord").length,
    tenants: users.filter(u => u.role === "tenant").length,
    suspended: users.filter(u => u.isSuspended).length,
    kycPending: users.filter(u => !u.isKycVerified && u.role === "landlord").length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading users...</p>
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
              <FiUsers className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">User Management</h1>
              <p className="text-sm text-[#065A57]">Manage users, roles, and permissions</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchUsers}
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#013E43]">
          <p className="text-xs text-[#065A57]">Total Users</p>
          <p className="text-2xl font-bold text-[#013E43]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#013E43]">
          <p className="text-xs text-[#065A57]">Admins</p>
          <p className="text-xl font-bold text-[#013E43]">{stats.admins}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#02BB31]">
          <p className="text-xs text-[#065A57]">Landlords</p>
          <p className="text-xl font-bold text-[#02BB31]">{stats.landlords}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-blue-400">
          <p className="text-xs text-[#065A57]">Tenants</p>
          <p className="text-xl font-bold text-blue-600">{stats.tenants}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-red-400">
          <p className="text-xs text-[#065A57]">Suspended</p>
          <p className="text-xl font-bold text-red-500">{stats.suspended}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-yellow-400">
          <p className="text-xs text-[#065A57]">KYC Pending</p>
          <p className="text-xl font-bold text-yellow-600">{stats.kycPending}</p>
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
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="landlord">Landlord</option>
              <option value="tenant">Tenant</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value)}
              className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
            >
              <option value="all">All KYC</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-[#065A57]">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* Users Display */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
          <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUsers className="text-3xl text-[#A8D8C1]" />
          </div>
          <h3 className="text-lg font-semibold text-[#013E43] mb-2">No users found</h3>
          <p className="text-sm text-[#065A57]">
            {searchTerm || roleFilter !== "all" || statusFilter !== "all" || kycFilter !== "all"
              ? "Try adjusting your filters"
              : "No users have been registered yet"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user._id}
              className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              {/* Card Header */}
              <div className="p-4 bg-gradient-to-r from-[#F0F7F4] to-white border-b border-[#A8D8C1]">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#013E43] truncate">{user.name}</h3>
                    <p className="text-xs text-[#065A57] truncate">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 space-y-3">
                {/* Role & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getRoleIcon(user.role)}
                    <span className="text-sm font-medium text-[#013E43] capitalize">{user.role}</span>
                  </div>
                  {getStatusBadge(user.isSuspended)}
                </div>

                {/* Phone */}
                {user.phone && (
                  <div className="flex items-center space-x-2 text-sm text-[#065A57]">
                    <FiPhone className="text-[#02BB31]" />
                    <span>{user.phone}</span>
                  </div>
                )}

                {/* KYC Status */}
                <div className="flex items-center justify-between pt-2 border-t border-[#A8D8C1]">
                  <span className="text-xs text-[#065A57]">KYC Status</span>
                  {getKYCBadge(user.isKycVerified)}
                </div>

                {/* Join Date */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#065A57]">Joined</span>
                  <span className="text-[#013E43] font-medium">{formatDate(user.createdAt)}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-[#A8D8C1]">
                  <button
                    onClick={() => {
                      setSelectedUser(user)
                      setShowDetailsModal(true)
                    }}
                    className="text-sm text-[#02BB31] hover:text-[#0D915C] flex items-center"
                  >
                    <FiEye className="mr-1" />
                    View Details
                  </button>
                  
                  {user.role !== "admin" && !user.isSuspended && (
                    <button
                      onClick={() => {
                        setSelectedUser(user)
                        setShowSuspendModal(true)
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Suspend User"
                    >
                      <FiUserX />
                    </button>
                  )}

                  {user.role === "landlord" && !user.isKycVerified && (
                    <button
                      onClick={() => handleApproveKYC(user._id)}
                      className="p-2 text-[#02BB31] hover:bg-[#02BB31]/10 rounded-lg transition-colors"
                      title="Approve KYC"
                    >
                      <FiCheckCircle />
                    </button>
                  )}
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
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">KYC</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#A8D8C1]">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-[#F0F7F4] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-full flex items-center justify-center text-white font-bold">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[#013E43]">{user.name}</p>
                          <p className="text-xs text-[#065A57]">ID: {user._id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-[#065A57] flex items-center">
                          <FiMail className="mr-2 text-[#02BB31] text-xs" />
                          {user.email}
                        </p>
                        {user.phone && (
                          <p className="text-sm text-[#065A57] flex items-center">
                            <FiPhone className="mr-2 text-[#02BB31] text-xs" />
                            {user.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user.isSuspended)}
                    </td>
                    <td className="px-6 py-4">
                      {getKYCBadge(user.isKycVerified)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#065A57]">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setShowDetailsModal(true)
                          }}
                          className="p-2 text-[#02BB31] hover:bg-[#F0F7F4] rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                        
                        {user.role !== "admin" && !user.isSuspended && (
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowSuspendModal(true)
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Suspend User"
                          >
                            <FiUserX />
                          </button>
                        )}

                        {user.role === "landlord" && !user.isKycVerified && (
                          <button
                            onClick={() => handleApproveKYC(user._id)}
                            className="p-2 text-[#02BB31] hover:bg-[#02BB31]/10 rounded-lg transition-colors"
                            title="Approve KYC"
                          >
                            <FiCheckCircle />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-[#A8D8C1] flex items-center justify-between">
            <p className="text-sm text-[#065A57]">
              Showing 1-{filteredUsers.length} of {filteredUsers.length} users
            </p>
            <div className="flex space-x-2">
              <button className="px-3 py-1 border border-[#A8D8C1] rounded text-[#065A57] hover:bg-[#F0F7F4]">
                Previous
              </button>
              <button className="px-3 py-1 bg-[#02BB31] text-white rounded hover:bg-[#0D915C]">
                1
              </button>
              <button className="px-3 py-1 border border-[#A8D8C1] rounded text-[#065A57] hover:bg-[#F0F7F4]">
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-[#A8D8C1] p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {selectedUser.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#013E43]">User Details</h2>
                  <p className="text-sm text-[#065A57]">ID: {selectedUser._id.slice(-8)}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedUser(null)
                  setShowDetailsModal(false)
                }}
                className="p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
              >
                <FiX className="text-xl text-[#065A57]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-[#F0F7F4] rounded-xl">
                  <p className="text-xs text-[#065A57] mb-1">Role</p>
                  <div className="flex items-center">
                    {getRoleBadge(selectedUser.role)}
                  </div>
                </div>
                <div className="p-4 bg-[#F0F7F4] rounded-xl">
                  <p className="text-xs text-[#065A57] mb-1">Status</p>
                  <div className="flex items-center">
                    {getStatusBadge(selectedUser.isSuspended)}
                  </div>
                </div>
                <div className="p-4 bg-[#F0F7F4] rounded-xl">
                  <p className="text-xs text-[#065A57] mb-1">KYC</p>
                  <div className="flex items-center">
                    {getKYCBadge(selectedUser.isKycVerified)}
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="font-semibold text-[#013E43] mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#F0F7F4] p-3 rounded-lg">
                    <p className="text-xs text-[#065A57]">Full Name</p>
                    <p className="font-medium">{selectedUser.name}</p>
                  </div>
                  <div className="bg-[#F0F7F4] p-3 rounded-lg">
                    <p className="text-xs text-[#065A57]">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  {selectedUser.phone && (
                    <div className="bg-[#F0F7F4] p-3 rounded-lg">
                      <p className="text-xs text-[#065A57]">Phone</p>
                      <p className="font-medium">{selectedUser.phone}</p>
                    </div>
                  )}
                  <div className="bg-[#F0F7F4] p-3 rounded-lg">
                    <p className="text-xs text-[#065A57]">Member Since</p>
                    <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* KYC Information (for landlords) */}
              {selectedUser.role === "landlord" && selectedUser.kycInfo && (
                <div>
                  <h3 className="font-semibold text-[#013E43] mb-3">KYC Information</h3>
                  <div className="bg-[#F0F7F4] p-4 rounded-xl space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#065A57]">ID Type</span>
                      <span className="font-medium">{selectedUser.kycInfo.idType || "National ID"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#065A57]">ID Number</span>
                      <span className="font-medium">{selectedUser.kycInfo.idNumber}</span>
                    </div>
                    {selectedUser.kycInfo.documentUrl && (
                      <div className="mt-2">
                        <p className="text-[#065A57] mb-1">Document</p>
                        <img 
                          src={selectedUser.kycInfo.documentUrl} 
                          alt="KYC Document"
                          className="max-h-32 rounded border border-[#A8D8C1]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Statistics (for landlords) */}
              {selectedUser.role === "landlord" && (
                <div>
                  <h3 className="font-semibold text-[#013E43] mb-3">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#F0F7F4] p-3 rounded-lg">
                      <p className="text-xs text-[#065A57]">Properties</p>
                      <p className="text-xl font-bold text-[#013E43]">{selectedUser.propertyCount || 0}</p>
                    </div>
                    <div className="bg-[#F0F7F4] p-3 rounded-lg">
                      <p className="text-xs text-[#065A57]">Inquiries</p>
                      <p className="text-xl font-bold text-[#013E43]">{selectedUser.inquiryCount || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-[#A8D8C1]">
                <button
                  onClick={() => {
                    setSelectedUser(null)
                    setShowDetailsModal(false)
                  }}
                  className="px-4 py-2 text-[#065A57] border border-[#A8D8C1] rounded-lg hover:bg-[#F0F7F4]"
                >
                  Close
                </button>
                
                {selectedUser.role !== "admin" && !selectedUser.isSuspended && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false)
                      setShowSuspendModal(true)
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Suspend User
                  </button>
                )}

                {selectedUser.role === "landlord" && !selectedUser.isKycVerified && (
                  <button
                    onClick={() => {
                      handleApproveKYC(selectedUser._id)
                      setShowDetailsModal(false)
                    }}
                    className="px-4 py-2 bg-[#02BB31] text-white rounded-lg hover:bg-[#0D915C]"
                  >
                    Approve KYC
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <FiUserX className="text-3xl text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-[#013E43] mb-2">Suspend User</h3>
              <p className="text-sm text-[#065A57]">
                Are you sure you want to suspend "{selectedUser.name}"? 
                They will lose access to their account.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[#065A57] mb-2">
                Reason for suspension <span className="text-red-500">*</span>
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows="3"
                className="w-full px-4 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31]"
                placeholder="Enter reason for suspension..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSuspendModal(false)
                  setSuspendReason("")
                  setSelectedUser(null)
                }}
                className="flex-1 px-4 py-2 border border-[#A8D8C1] text-[#065A57] rounded-lg hover:bg-[#F0F7F4] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Suspend User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers