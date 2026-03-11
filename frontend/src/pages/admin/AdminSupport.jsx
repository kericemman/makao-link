import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import API from "../../api/api"
import { 
  FiHelpCircle, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiEye,
  FiMessageSquare,
  FiUser,
  FiCalendar,
  FiTag,
  FiFlag,
  FiMoreVertical,
  FiDownload,
  FiArrowRight
} from "react-icons/fi"
import { FaWhatsapp } from "react-icons/fa"
import toast from "react-hot-toast"

function AdminTickets() {
  const [tickets, setTickets] = useState([])
  const [filteredTickets, setFilteredTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [dateRange, setDateRange] = useState("all")
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [response, setResponse] = useState("")
  const [sendingResponse, setSendingResponse] = useState(false)

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const res = await API.get("/support")
      setTickets(res.data || [])
    } catch (error) {
      toast.error("Failed to load tickets", {
        style: { background: "#013E43", color: "#fff" }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  useEffect(() => {
    filterTickets()
  }, [tickets, searchTerm, statusFilter, priorityFilter, categoryFilter, dateRange])

  const filterTickets = () => {
    let filtered = [...tickets]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(ticket => 
        ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter)
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter)
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date()
      const filterDate = new Date()
      
      switch(dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter(ticket => new Date(ticket.createdAt) >= filterDate)
          break
        case "week":
          filterDate.setDate(filterDate.getDate() - 7)
          filtered = filtered.filter(ticket => new Date(ticket.createdAt) >= filterDate)
          break
        case "month":
          filterDate.setMonth(filterDate.getMonth() - 1)
          filtered = filtered.filter(ticket => new Date(ticket.createdAt) >= filterDate)
          break
      }
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    setFilteredTickets(filtered)
  }

  const handleStatusUpdate = async (id, status) => {
    try {
      await API.put(`/support/${id}`, { status })
      toast.success(`Ticket marked as ${status}`, {
        style: { background: "#02BB31", color: "#fff" }
      })
      fetchTickets()
    } catch (error) {
      toast.error("Failed to update ticket status", {
        style: { background: "#013E43", color: "#fff" }
      })
    }
  }

  const handleResponse = async () => {
    if (!response.trim()) {
      toast.error("Please enter a response", {
        style: { background: "#013E43", color: "#fff" }
      })
      return
    }

    try {
      setSendingResponse(true)
      await API.post(`/support/${selectedTicket._id}/respond`, { message: response })
      toast.success("Response sent successfully", {
        style: { background: "#02BB31", color: "#fff" }
      })
      setResponse("")
      setShowDetailsModal(false)
      fetchTickets()
    } catch (error) {
      toast.error("Failed to send response", {
        style: { background: "#013E43", color: "#fff" }
      })
    } finally {
      setSendingResponse(false)
    }
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case "open":
        return <FiClock className="text-yellow-500" />
      case "in-progress":
        return <FiRefreshCw className="text-blue-500" />
      case "resolved":
        return <FiCheckCircle className="text-[#02BB31]" />
      case "closed":
        return <FiXCircle className="text-gray-500" />
      default:
        return <FiHelpCircle className="text-[#065A57]" />
    }
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case "open":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
            <FiClock className="mr-1" />
            Open
          </span>
        )
      case "in-progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
            <FiRefreshCw className="mr-1" />
            In Progress
          </span>
        )
      case "resolved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#02BB31]/10 text-[#02BB31]">
            <FiCheckCircle className="mr-1" />
            Resolved
          </span>
        )
      case "closed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <FiXCircle className="mr-1" />
            Closed
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

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case "high":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
            <FiFlag className="mr-1" />
            High
          </span>
        )
      case "medium":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
            <FiFlag className="mr-1" />
            Medium
          </span>
        )
      case "low":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
            <FiFlag className="mr-1" />
            Low
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {priority}
          </span>
        )
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const ticketDate = new Date(date)
    const diffInSeconds = Math.floor((now - ticketDate) / 1000)
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    return `${Math.floor(diffInSeconds / 86400)} days ago`
  }

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in-progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    high: tickets.filter(t => t.priority === "high").length
  }

  const categories = [...new Set(tickets.map(t => t.category).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading tickets...</p>
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
              <FiHelpCircle className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">Support Tickets</h1>
              <p className="text-sm text-[#065A57]">Manage and respond to user support requests</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchTickets}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              className="px-4 py-2 bg-[#013E43] text-white rounded-lg hover:bg-[#005C57] transition-colors flex items-center space-x-2"
            >
              <FiDownload />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#013E43]">
          <p className="text-sm text-[#065A57]">Total Tickets</p>
          <p className="text-2xl font-bold text-[#013E43]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-yellow-400">
          <p className="text-sm text-[#065A57]">Open</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.open}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-blue-400">
          <p className="text-sm text-[#065A57]">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#02BB31]">
          <p className="text-sm text-[#065A57]">Resolved</p>
          <p className="text-2xl font-bold text-[#02BB31]">{stats.resolved}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-red-400">
          <p className="text-sm text-[#065A57]">High Priority</p>
          <p className="text-2xl font-bold text-red-500">{stats.high}</p>
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
              placeholder="Search by subject, description, user name, or email..."
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
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}

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
          Showing {filteredTickets.length} of {tickets.length} tickets
        </div>
      </div>

      {/* Tickets Table */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
          <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiHelpCircle className="text-3xl text-[#A8D8C1]" />
          </div>
          <h3 className="text-lg font-semibold text-[#013E43] mb-2">No tickets found</h3>
          <p className="text-sm text-[#065A57]">
            {searchTerm || statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all" || dateRange !== "all"
              ? "Try adjusting your filters"
              : "No support tickets have been submitted yet"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#A8D8C1]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#013E43] to-[#005C57] text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Ticket</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#A8D8C1]">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-[#F0F7F4] transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-[#013E43]">{ticket.subject}</p>
                        <p className="text-xs text-[#065A57] truncate max-w-xs">{ticket.description?.slice(0, 50)}...</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {ticket.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#013E43]">{ticket.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-[#065A57]">{ticket.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
                        <FiTag className="mr-1" />
                        {ticket.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getPriorityBadge(ticket.priority)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-[#013E43]">{formatTimeAgo(ticket.createdAt)}</p>
                        <p className="text-xs text-[#065A57]">{formatDate(ticket.createdAt)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket)
                          setShowDetailsModal(true)
                        }}
                        className="p-2 text-[#02BB31] hover:bg-[#F0F7F4] rounded-lg transition-colors"
                        title="View Details"
                      >
                        <FiEye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-[#A8D8C1] flex items-center justify-between">
            <p className="text-sm text-[#065A57]">
              Showing 1-{filteredTickets.length} of {filteredTickets.length} tickets
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
      {showDetailsModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-[#A8D8C1] p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl">
                  <FiHelpCircle className="text-white text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#013E43]">Ticket Details</h2>
                  <p className="text-sm text-[#065A57]">ID: {selectedTicket._id.slice(-8)}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedTicket(null)
                  setShowDetailsModal(false)
                  setResponse("")
                }}
                className="p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
              >
                <FiXCircle className="text-xl text-[#065A57]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status and Priority */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#F0F7F4] p-4 rounded-xl">
                  <p className="text-xs text-[#065A57] mb-1">Status</p>
                  <div className="flex items-center">
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                </div>
                <div className="bg-[#F0F7F4] p-4 rounded-xl">
                  <p className="text-xs text-[#065A57] mb-1">Priority</p>
                  <div className="flex items-center">
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                </div>
                <div className="bg-[#F0F7F4] p-4 rounded-xl">
                  <p className="text-xs text-[#065A57] mb-1">Category</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
                    <FiTag className="mr-1" />
                    {selectedTicket.category || 'General'}
                  </span>
                </div>
              </div>

              {/* User Info */}
              <div>
                <h3 className="font-semibold text-[#013E43] mb-3">User Information</h3>
                <div className="bg-[#F0F7F4] p-4 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-full flex items-center justify-center text-white font-bold">
                      {selectedTicket.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-[#013E43]">{selectedTicket.user?.name || 'Unknown'}</p>
                      <p className="text-sm text-[#065A57]">{selectedTicket.user?.email}</p>
                      {selectedTicket.user?.phone && (
                        <p className="text-sm text-[#065A57]">{selectedTicket.user.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <h3 className="font-semibold text-[#013E43] mb-2">Subject</h3>
                <div className="bg-[#F0F7F4] p-4 rounded-lg">
                  <p className="text-[#013E43]">{selectedTicket.subject}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold text-[#013E43] mb-2">Description</h3>
                <div className="bg-[#F0F7F4] p-4 rounded-lg">
                  <p className="text-[#013E43] whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F0F7F4] p-3 rounded-lg">
                  <p className="text-xs text-[#065A57]">Created</p>
                  <p className="font-medium">{formatDate(selectedTicket.createdAt)}</p>
                </div>
                <div className="bg-[#F0F7F4] p-3 rounded-lg">
                  <p className="text-xs text-[#065A57]">Last Updated</p>
                  <p className="font-medium">{formatDate(selectedTicket.updatedAt)}</p>
                </div>
              </div>

              {/* Admin Response Form */}
              <div>
                <h3 className="font-semibold text-[#013E43] mb-2">Admin Response</h3>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows="4"
                  placeholder="Type your response here..."
                  className="w-full px-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors resize-none"
                />
              </div>

              {/* Status Update Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-[#A8D8C1]">
                <button
                  onClick={() => handleStatusUpdate(selectedTicket._id, "open")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedTicket.status === "open"
                      ? 'bg-yellow-500 text-white'
                      : 'border border-yellow-500 text-yellow-600 hover:bg-yellow-50'
                  }`}
                >
                  Mark Open
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedTicket._id, "in-progress")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedTicket.status === "in-progress"
                      ? 'bg-blue-500 text-white'
                      : 'border border-blue-500 text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedTicket._id, "resolved")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedTicket.status === "resolved"
                      ? 'bg-[#02BB31] text-white'
                      : 'border border-[#02BB31] text-[#02BB31] hover:bg-[#02BB31]/10'
                  }`}
                >
                  Resolved
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedTicket._id, "closed")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedTicket.status === "closed"
                      ? 'bg-gray-500 text-white'
                      : 'border border-gray-500 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Close
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-[#A8D8C1]">
                <button
                  onClick={() => {
                    setSelectedTicket(null)
                    setShowDetailsModal(false)
                  }}
                  className="px-4 py-2 text-[#065A57] border border-[#A8D8C1] rounded-lg hover:bg-[#F0F7F4] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResponse}
                  disabled={sendingResponse}
                  className="px-6 py-2 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingResponse ? "Sending..." : "Send Response"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminTickets