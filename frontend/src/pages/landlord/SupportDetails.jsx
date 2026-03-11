import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { getTicket, replyTicket } from "../../services/ticket.service"
import { 
  FiHelpCircle, 
  FiMessageSquare, 
  FiSend,
  FiArrowLeft,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiMail,
  FiCalendar,
  FiPaperclip,
  FiRefreshCw,
  FiAlertCircle
} from "react-icons/fi"
import { FaWhatsapp } from "react-icons/fa"
import toast from "react-hot-toast"

function TicketDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState(null)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const fetchTicket = async () => {
    try {
      setLoading(true)
      const res = await getTicket(id)
      setTicket(res.data)
    } catch (error) {
      toast.error("Failed to load ticket", {
        style: { background: "#013E43", color: "#fff" }
      })
      navigate("/dashboard/support")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTicket()
  }, [id])

  const handleReply = async () => {
    if (!message.trim()) {
      toast.error("Please enter a reply message", {
        style: { background: "#013E43", color: "#fff" }
      })
      return
    }

    try {
      setSending(true)
      await replyTicket(id, { message })
      
      toast.success("Reply sent successfully", {
        style: { background: "#02BB31", color: "#fff" }
      })
      
      setMessage("")
      fetchTicket()

    } catch (error) {
      toast.error("Failed to send reply", {
        style: { background: "#013E43", color: "#fff" }
      })
    } finally {
      setSending(false)
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
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-600">
            <FiClock className="mr-1" />
            Open
          </span>
        )
      case "in-progress":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-600">
            <FiRefreshCw className="mr-1" />
            In Progress
          </span>
        )
      case "resolved":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#02BB31]/10 text-[#02BB31]">
            <FiCheckCircle className="mr-1" />
            Resolved
          </span>
        )
      case "closed":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
            <FiXCircle className="mr-1" />
            Closed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
            {status}
          </span>
        )
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading ticket...</p>
        </div>
      </div>
    )
  }

  if (!ticket) return null

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
        <div className="flex items-center space-x-4">
          <Link
            to="/dashboard/support"
            className="p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
          >
            <FiArrowLeft className="text-xl text-[#065A57]" />
          </Link>
          <div className="p-3 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl">
            <FiHelpCircle className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#013E43]">Ticket Details</h1>
            <p className="text-sm text-[#065A57]">ID: {ticket._id.slice(-8)}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Ticket Conversation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original Ticket */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden">
            <div className="bg-gradient-to-r from-[#013E43] to-[#005C57] p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Original Message</h2>
                {getStatusBadge(ticket.status)}
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-full flex items-center justify-center text-white font-bold">
                  {ticket.subject?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-[#013E43]">{ticket.subject}</h3>
                    <span className="text-xs text-[#065A57]">
                      {formatTimeAgo(ticket.createdAt)}
                    </span>
                  </div>
                  <p className="text-[#065A57] whitespace-pre-wrap">
                    {ticket.message}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Replies */}
          {ticket.replies && ticket.replies.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden">
              <div className="bg-gradient-to-r from-[#02BB31] to-[#0D915C] p-6">
                <h2 className="text-xl font-bold text-white">Conversation History</h2>
              </div>
              
              <div className="p-6 space-y-4">
                {ticket.replies.map((reply, index) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-3 ${
                      reply.sender === 'support' ? 'flex-row' : 'flex-row-reverse'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                      reply.sender === 'support'
                        ? 'bg-[#02BB31]'
                        : 'bg-gradient-to-r from-[#013E43] to-[#005C57]'
                    }`}>
                      {reply.sender === 'support' ? 'S' : 'U'}
                    </div>
                    <div className={`flex-1 ${reply.sender === 'support' ? '' : 'text-right'}`}>
                      <div className={`inline-block max-w-[80%] ${
                        reply.sender === 'support'
                          ? 'bg-[#F0F7F4]'
                          : 'bg-[#02BB31]/10'
                      } rounded-xl p-4`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-[#013E43]">
                            {reply.sender === 'support' ? 'Support Team' : 'You'}
                          </span>
                          <span className="text-xs text-[#065A57] ml-4">
                            {formatTimeAgo(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-[#065A57] whitespace-pre-wrap">
                          {reply.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reply Form */}
          {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
            <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden">
              <div className="bg-gradient-to-r from-[#013E43] to-[#005C57] p-6">
                <h2 className="text-xl font-bold text-white">Add Reply</h2>
              </div>
              
              <div className="p-6">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows="4"
                  placeholder="Type your reply here..."
                  className="w-full px-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors resize-none mb-4"
                />
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setMessage("")}
                    className="px-6 py-2 text-[#065A57] border border-[#A8D8C1] rounded-lg hover:bg-[#F0F7F4] transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleReply}
                    disabled={sending || !message.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {sending ? (
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
              </div>
            </div>
          )}

          {/* Closed Ticket Message */}
          {(ticket.status === 'closed' || ticket.status === 'resolved') && (
            <div className="bg-[#F0F7F4] rounded-2xl p-6 border border-[#A8D8C1] text-center">
              <FiCheckCircle className="text-4xl text-[#02BB31] mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-[#013E43] mb-2">
                This ticket is {ticket.status}
              </h3>
              <p className="text-sm text-[#065A57]">
                You cannot reply to a {ticket.status} ticket. If you need further assistance, please create a new ticket.
              </p>
              <Link
                to="/dashboard/support/new"
                className="inline-block mt-4 px-6 py-2 bg-[#02BB31] text-white rounded-lg hover:bg-[#0D915C] transition-colors"
              >
                Create New Ticket
              </Link>
            </div>
          )}
        </div>

        {/* Right Column - Ticket Info */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
            <h3 className="text-lg font-bold text-[#013E43] mb-4 flex items-center">
              <FiAlertCircle className="mr-2 text-[#02BB31]" />
              Ticket Status
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#065A57]">Current Status</span>
                {getStatusBadge(ticket.status)}
              </div>
              
              <div className="pt-4 border-t border-[#A8D8C1]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#065A57]">Created</span>
                  <span className="text-sm font-medium text-[#013E43]">
                    {formatDate(ticket.createdAt)}
                  </span>
                </div>
                {ticket.updatedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#065A57]">Last Updated</span>
                    <span className="text-sm font-medium text-[#013E43]">
                      {formatTimeAgo(ticket.updatedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
            <h3 className="text-lg font-bold text-[#013E43] mb-4">Ticket Stats</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#065A57]">Total Replies</span>
                <span className="text-lg font-bold text-[#013E43]">
                  {ticket.replies?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#065A57]">Response Time</span>
                <span className="text-lg font-bold text-[#013E43]">~2h</span>
              </div>
            </div>
          </div>

          {/* Need Help? */}
          <div className="bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-2xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Need immediate help?</h3>
            <p className="text-sm text-[#A8D8C1] mb-4">
              Our support team is available 24/7
            </p>
            <div className="space-y-2">
              <a
                href="mailto:support@makaolink.com"
                className="block w-full px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-center"
              >
                support@makaolink.com
              </a>
              <a
                href="https://wa.me/254712345678"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors text-center flex items-center justify-center"
              >
                <FaWhatsapp className="mr-2" />
                WhatsApp Support
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
            <Link
              to="/dashboard/support"
              className="block w-full px-4 py-2 text-center text-[#065A57] border border-[#A8D8C1] rounded-lg hover:bg-[#F0F7F4] transition-colors"
            >
              Back to Tickets
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketDetails