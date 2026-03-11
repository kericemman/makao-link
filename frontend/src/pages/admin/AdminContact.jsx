import { useEffect, useState } from "react"
import {
  getMessages,
  markMessageRead,
  deleteMessage
} from "../../services/contact.service"
import {
  FiMail,
  FiUser,
  FiPhone,
  FiMessageSquare,
  FiClock,
  FiCheckCircle,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiCalendar,
  FiDownload,
  FiArchive,
  FiStar,
  FiXCircle,
  FiChevronDown,
  FiMoreVertical
} from "react-icons/fi"
import { FaWhatsapp } from "react-icons/fa"
import toast from "react-hot-toast"

function AdminContacts() {
  const [messages, setMessages] = useState([])
  const [filteredMessages, setFilteredMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState("all")
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const res = await getMessages()
      setMessages(res.data || [])
    } catch (error) {
      toast.error("Failed to load messages", {
        style: { background: "#013E43", color: "#fff" }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  useEffect(() => {
    filterMessages()
  }, [messages, searchTerm, statusFilter, dateRange])

  const filterMessages = () => {
    let filtered = [...messages]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(msg => 
        msg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.phone?.includes(searchTerm)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(msg => 
        statusFilter === "read" ? msg.isRead : !msg.isRead
      )
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date()
      const filterDate = new Date()
      
      switch(dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter(msg => new Date(msg.createdAt) >= filterDate)
          break
        case "week":
          filterDate.setDate(filterDate.getDate() - 7)
          filtered = filtered.filter(msg => new Date(msg.createdAt) >= filterDate)
          break
        case "month":
          filterDate.setMonth(filterDate.getMonth() - 1)
          filtered = filtered.filter(msg => new Date(msg.createdAt) >= filterDate)
          break
      }
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    setFilteredMessages(filtered)
  }

  const markRead = async (id) => {
    try {
      await markMessageRead(id)
      toast.success("Message marked as read", {
        style: { background: "#02BB31", color: "#fff" }
      })
      fetchMessages()
    } catch (error) {
      toast.error("Failed to mark message as read", {
        style: { background: "#013E43", color: "#fff" }
      })
    }
  }

  const remove = async () => {
    try {
      await deleteMessage(selectedMessage._id)
      toast.success("Message deleted successfully", {
        style: { background: "#02BB31", color: "#fff" }
      })
      setShowDeleteModal(false)
      setSelectedMessage(null)
      fetchMessages()
    } catch (error) {
      toast.error("Failed to delete message", {
        style: { background: "#013E43", color: "#fff" }
      })
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
    const msgDate = new Date(date)
    const diffInSeconds = Math.floor((now - msgDate) / 1000)
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    return `${Math.floor(diffInSeconds / 86400)} days ago`
  }

  const stats = {
    total: messages.length,
    unread: messages.filter(m => !m.isRead).length,
    read: messages.filter(m => m.isRead).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading messages...</p>
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
              <FiMail className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">Contact Messages</h1>
              <p className="text-sm text-[#065A57]">Manage and respond to user inquiries</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchMessages}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#013E43]">
          <p className="text-sm text-[#065A57]">Total Messages</p>
          <p className="text-2xl font-bold text-[#013E43]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-yellow-400">
          <p className="text-sm text-[#065A57]">Unread</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.unread}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#02BB31]">
          <p className="text-sm text-[#065A57]">Read</p>
          <p className="text-2xl font-bold text-[#02BB31]">{stats.read}</p>
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
              placeholder="Search by name, email, subject, or message..."
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
              <option value="all">All Messages</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>

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
          Showing {filteredMessages.length} of {messages.length} messages
        </div>
      </div>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
          <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiMail className="text-3xl text-[#A8D8C1]" />
          </div>
          <h3 className="text-lg font-semibold text-[#013E43] mb-2">No messages found</h3>
          <p className="text-sm text-[#065A57]">
            {searchTerm || statusFilter !== "all" || dateRange !== "all"
              ? "Try adjusting your filters"
              : "No contact messages have been received yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((msg) => (
            <div
              key={msg._id}
              className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all"
            >
              {/* Message Header */}
              <div className="p-4 border-b border-[#A8D8C1] bg-gradient-to-r from-[#F0F7F4] to-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      msg.isRead ? 'bg-gray-400' : 'bg-gradient-to-r from-[#02BB31] to-[#0D915C]'
                    }`}>
                      {msg.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#013E43]">{msg.name}</h3>
                      <div className="flex items-center space-x-3 text-sm text-[#065A57]">
                        <span>{msg.email}</span>
                        {msg.phone && (
                          <>
                            <span className="w-1 h-1 bg-[#A8D8C1] rounded-full"></span>
                            <span>{msg.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {!msg.isRead && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded-full text-xs font-medium flex items-center">
                        <FiClock className="mr-1" />
                        New
                      </span>
                    )}
                    <span className="text-xs text-[#065A57] flex items-center">
                      <FiCalendar className="mr-1" />
                      {formatTimeAgo(msg.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="p-4">
                <div className="mb-2">
                  <p className="text-sm font-medium text-[#013E43]">Subject: {msg.subject}</p>
                </div>
                <p className="text-[#065A57] whitespace-pre-wrap line-clamp-2">
                  {msg.message}
                </p>
              </div>

              {/* Actions */}
              <div className="px-4 py-3 bg-[#F0F7F4] border-t border-[#A8D8C1] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedMessage(msg)
                      setShowDetailsModal(true)
                    }}
                    className="text-sm text-[#02BB31] hover:text-[#0D915C] flex items-center"
                  >
                    <FiEye className="mr-1" />
                    View Details
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  {!msg.isRead && (
                    <button
                      onClick={() => markRead(msg._id)}
                      className="p-2 text-[#02BB31] hover:bg-[#F0F7F4] rounded-lg transition-colors"
                      title="Mark as Read"
                    >
                      <FiCheckCircle />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedMessage(msg)
                      setShowDeleteModal(true)
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-[#A8D8C1] p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                  selectedMessage.isRead ? 'bg-gray-400' : 'bg-gradient-to-r from-[#02BB31] to-[#0D915C]'
                }`}>
                  {selectedMessage.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#013E43]">Message Details</h2>
                  <p className="text-sm text-[#065A57]">ID: {selectedMessage._id.slice(-8)}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedMessage(null)
                  setShowDetailsModal(false)
                }}
                className="p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
              >
                <FiXCircle className="text-xl text-[#065A57]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="bg-[#F0F7F4] p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#065A57]">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${
                    selectedMessage.isRead
                      ? 'bg-[#02BB31]/10 text-[#02BB31]'
                      : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {selectedMessage.isRead ? (
                      <>
                        <FiCheckCircle className="mr-1" />
                        Read
                      </>
                    ) : (
                      <>
                        <FiClock className="mr-1" />
                        Unread
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Sender Info */}
              <div>
                <h3 className="font-semibold text-[#013E43] mb-3">Sender Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#F0F7F4] p-3 rounded-lg">
                    <p className="text-xs text-[#065A57]">Name</p>
                    <p className="font-medium">{selectedMessage.name}</p>
                  </div>
                  <div className="bg-[#F0F7F4] p-3 rounded-lg">
                    <p className="text-xs text-[#065A57]">Email</p>
                    <p className="font-medium">{selectedMessage.email}</p>
                  </div>
                  {selectedMessage.phone && (
                    <div className="bg-[#F0F7F4] p-3 rounded-lg">
                      <p className="text-xs text-[#065A57]">Phone</p>
                      <p className="font-medium">{selectedMessage.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div>
                <h3 className="font-semibold text-[#013E43] mb-2">Subject</h3>
                <div className="bg-[#F0F7F4] p-4 rounded-lg">
                  <p className="text-[#013E43]">{selectedMessage.subject}</p>
                </div>
              </div>

              {/* Message */}
              <div>
                <h3 className="font-semibold text-[#013E43] mb-2">Message</h3>
                <div className="bg-[#F0F7F4] p-4 rounded-lg">
                  <p className="text-[#013E43] whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F0F7F4] p-3 rounded-lg">
                  <p className="text-xs text-[#065A57]">Received</p>
                  <p className="font-medium">{formatDate(selectedMessage.createdAt)}</p>
                </div>
                {selectedMessage.readAt && (
                  <div className="bg-[#F0F7F4] p-3 rounded-lg">
                    <p className="text-xs text-[#065A57]">Read</p>
                    <p className="font-medium">{formatDate(selectedMessage.readAt)}</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-[#A8D8C1]">
                <a
                  href={`mailto:${selectedMessage.email}`}
                  className="flex-1 px-4 py-2 bg-[#013E43] text-white rounded-lg hover:bg-[#005C57] transition-colors flex items-center justify-center space-x-2"
                >
                  <FiMail />
                  <span>Reply via Email</span>
                </a>
                
                {selectedMessage.phone && (
                  <>
                    <a
                      href={`tel:${selectedMessage.phone}`}
                      className="flex-1 px-4 py-2 bg-[#02BB31] text-white rounded-lg hover:bg-[#0D915C] transition-colors flex items-center justify-center space-x-2"
                    >
                      <FiPhone />
                      <span>Call</span>
                    </a>
                    <a
                      href={`https://wa.me/${selectedMessage.phone.replace(/^0/, "254")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors flex items-center justify-center space-x-2"
                    >
                      <FaWhatsapp />
                      <span>WhatsApp</span>
                    </a>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-[#A8D8C1]">
                {!selectedMessage.isRead && (
                  <button
                    onClick={() => {
                      markRead(selectedMessage._id)
                      setShowDetailsModal(false)
                    }}
                    className="px-4 py-2 text-[#02BB31] border border-[#02BB31] rounded-lg hover:bg-[#02BB31] hover:text-white transition-colors"
                  >
                    Mark as Read
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setShowDeleteModal(true)
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <FiTrash2 className="text-3xl text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-[#013E43] mb-2">Delete Message</h3>
              <p className="text-sm text-[#065A57]">
                Are you sure you want to delete the message from "{selectedMessage.name}"? 
                This action cannot be undone.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedMessage(null)
                }}
                className="flex-1 px-4 py-2 border border-[#A8D8C1] text-[#065A57] rounded-lg hover:bg-[#F0F7F4] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={remove}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminContacts