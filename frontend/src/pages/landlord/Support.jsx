import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getMyTickets } from "../../services/ticket.service"
import { 
  FiHelpCircle, 
  FiPlus, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle,
  FiMessageSquare,
  FiUser,
  FiCalendar,
  FiArrowRight,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiAlertCircle
} from "react-icons/fi"
import { FaWhatsapp } from "react-icons/fa"
import toast from "react-hot-toast"

function MyTickets() {
  const [tickets, setTickets] = useState([])
  const [filteredTickets, setFilteredTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const res = await getMyTickets()
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
  }, [tickets, searchTerm, statusFilter])

  const filterTickets = () => {
    let filtered = [...tickets]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(ticket => 
        ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.status === statusFilter)
    }

    setFilteredTickets(filtered)
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
    resolved: tickets.filter(t => t.status === "resolved").length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading your tickets...</p>
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
              <p className="text-sm text-[#065A57]">View and manage your support requests</p>
            </div>
          </div>
          
          <Link
            to="/dashboard/support/new"
            className="px-4 py-2 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center"
          >
            <FiPlus className="mr-2" />
            New Ticket
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-4 border border-[#A8D8C1]">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#065A57]" />
            <input
              type="text"
              placeholder="Search tickets by subject..."
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
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-[#065A57]">
          Showing {filteredTickets.length} of {tickets.length} tickets
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
          <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiHelpCircle className="text-3xl text-[#A8D8C1]" />
          </div>
          <h3 className="text-lg font-semibold text-[#013E43] mb-2">No tickets found</h3>
          <p className="text-sm text-[#065A57] mb-4">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "You haven't created any support tickets yet"}
          </p>
          <Link
            to="/dashboard/support/new"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            <FiPlus className="mr-2" />
            Create Your First Ticket
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTickets.map((ticket) => (
            <Link
              key={ticket._id}
              to={`/dashboard/support/${ticket._id}`}
              className="group bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              {/* Ticket Header */}
              <div className="p-4 border-b border-[#A8D8C1] bg-gradient-to-r from-[#F0F7F4] to-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {ticket.subject?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#013E43] group-hover:text-[#02BB31] transition-colors">
                        {ticket.subject}
                      </h3>
                      <p className="text-xs text-[#065A57] flex items-center mt-1">
                        <FiCalendar className="mr-1" />
                        {formatDate(ticket.createdAt)} ({formatTimeAgo(ticket.createdAt)})
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(ticket.status)}
                </div>
              </div>

              {/* Ticket Content */}
              <div className="p-4">
                <p className="text-[#065A57] text-sm mb-3 line-clamp-2">
                  {ticket.description}
                </p>

                {/* Response Indicator */}
                {ticket.hasResponse && (
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-2 h-2 bg-[#02BB31] rounded-full"></div>
                    <span className="text-xs text-[#02BB31]">Support has responded</span>
                  </div>
                )}

                {/* Last Updated */}
                {ticket.updatedAt && (
                  <p className="text-xs text-[#065A57]">
                    Last updated: {formatTimeAgo(ticket.updatedAt)}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-[#F0F7F4] border-t border-[#A8D8C1] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FiMessageSquare className="text-[#02BB31]" />
                  <span className="text-xs text-[#065A57]">
                    {ticket.messages || 0} messages
                  </span>
                </div>
                <span className="text-sm text-[#02BB31] font-medium flex items-center group-hover:translate-x-1 transition-transform">
                  View Details
                  <FiArrowRight className="ml-2" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Support Info */}
      <div className="bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-[#02BB31]/20 rounded-xl">
              <FiAlertCircle className="text-3xl text-[#02BB31]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Need immediate help?</h3>
              <p className="text-sm text-[#A8D8C1]">
                Our support team is available 24/7 to assist you
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <a
              href="mailto:support@makaolink.com"
              className="px-4 py-2 bg-white text-[#013E43] rounded-lg hover:bg-[#A8D8C1] transition-colors"
            >
              Email Support
            </a>
            <a
              href="https://wa.me/254712345678"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors"
            >
              <FaWhatsapp className="inline mr-2" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyTickets