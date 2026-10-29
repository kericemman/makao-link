import { useState } from "react"
import { createTicket } from "../../services/ticket.service"
import { useNavigate, Link } from "react-router-dom"
import { 
  FiHelpCircle, 
  FiMessageSquare, 
  FiSend,
  FiArrowLeft,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiInfo,
  FiPaperclip,
  FiTag,
  FiFlag
} from "react-icons/fi"
import { FaWhatsapp } from "react-icons/fa"
import toast from "react-hot-toast"

function CreateTicket() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    subject: "",
    message: "",
    category: "general",
    priority: "medium"
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({
      ...form,
      [name]: value
    })
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!form.subject.trim()) {
      newErrors.subject = "Subject is required"
    } else if (form.subject.length < 5) {
      newErrors.subject = "Subject must be at least 5 characters"
    }

    if (!form.message.trim()) {
      newErrors.message = "Message is required"
    } else if (form.message.length < 20) {
      newErrors.message = "Please provide more details (at least 20 characters)"
    }

    if (!form.category) {
      newErrors.category = "Please select a category"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly", {
        style: { background: "#0F172A", color: "#fff" }
      })
      return
    }

    try {
      setLoading(true)
      await createTicket(form)
      
      toast.success("Support ticket created successfully! We'll get back to you soon.", {
        style: {
          background: "#126542",
          color: "#fff",
        },
        duration: 5000
      })

      navigate("/dashboard/support")

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create ticket. Please try again.",
        {
          style: {
            background: "#0F172A",
            color: "#fff",
          }
        }
      )
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority) => {
    switch(priority) {
      case "low":
        return "text-blue-600 bg-blue-100"
      case "medium":
        return "text-yellow-600 bg-yellow-100"
      case "high":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const categories = [
    { value: "payment", label: "Payment Issue", icon: "💰" },
    { value: "listing", label: "Listing Problem", icon: "🏠" },
    { value: "account", label: "Account Issue", icon: "👤" },
    { value: "technical", label: "Technical Bug", icon: "🔧" },
    { value: "general", label: "General Question", icon: "❓" }
  ]

  const priorities = [
    { value: "low", label: "Low Priority", color: "text-blue-600", bg: "bg-blue-100" },
    { value: "medium", label: "Medium Priority", color: "text-yellow-600", bg: "bg-yellow-100" },
    { value: "high", label: "High Priority", color: "text-red-600", bg: "bg-red-100" }
  ]

  const commonIssues = [
    "Cannot list a property",
    "Payment not processed",
    "Account access problem",
    "Property not showing up",
    "Inquiry not working",
    "Other"
  ]

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-md shadow-sm p-6 border border-[#E2E8F0]">
        <div className="flex items-center space-x-4">
          <Link
            to="/dashboard/support"
            className="p-2 hover:bg-[#F8FAFC] rounded-lg transition-colors"
          >
            <FiArrowLeft className="text-xl text-[#475569]" />
          </Link>
          <div className="p-3 bg-[#123D38] rounded-md">
            <FiHelpCircle className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Create Support Ticket</h1>
            <p className="text-sm text-[#475569]">Get help from our support team</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form - Left Column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-md shadow-md border border-[#E2E8F0] overflow-hidden">
            <div className="bg-[#123D38] p-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <FiMessageSquare className="mr-2" />
                Ticket Details
              </h2>
              <p className="text-sm text-[#E2E8F0] mt-1">
                Please provide as much detail as possible to help us assist you better
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Subject Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#0F172A]">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Brief summary of your issue"
                  className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                    errors.subject
                      ? 'border-red-400 focus:border-red-500 bg-red-50'
                      : 'border-[#E2E8F0] focus:border-[#126542]'
                  }`}
                />
                {errors.subject && (
                  <p className="text-xs text-red-500 mt-1">{errors.subject}</p>
                )}
                <p className="text-xs text-[#475569]">
                  Example: "Cannot access my account" or "Payment not processed"
                </p>
              </div>

              {/* Category and Priority Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Select */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#0F172A] flex items-center">
                    <FiTag className="mr-2 text-[#126542]" />
                    Category <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-colors appearance-none ${
                      errors.category
                        ? 'border-red-400 focus:border-red-500 bg-red-50'
                        : 'border-[#E2E8F0] focus:border-[#126542]'
                    }`}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-xs text-red-500 mt-1">{errors.category}</p>
                  )}
                </div>

                {/* Priority Select */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#0F172A] flex items-center">
                    <FiFlag className="mr-2 text-[#126542]" />
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-[#E2E8F0] rounded-lg focus:border-[#126542] outline-none transition-colors appearance-none"
                  >
                    {priorities.map(pri => (
                      <option key={pri.value} value={pri.value}>
                        {pri.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-[#475569]">
                    Current priority: <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(form.priority)}`}>
                      {priorities.find(p => p.value === form.priority)?.label}
                    </span>
                  </p>
                </div>
              </div>

              {/* Message Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#0F172A]">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows="6"
                  placeholder="Please describe your issue in detail. Include any error messages, steps you've tried, and relevant information."
                  className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-colors resize-none ${
                    errors.message
                      ? 'border-red-400 focus:border-red-500 bg-red-50'
                      : 'border-[#E2E8F0] focus:border-[#126542]'
                  }`}
                />
                {errors.message && (
                  <p className="text-xs text-red-500 mt-1">{errors.message}</p>
                )}
                <div className="flex justify-between items-center">
                  <p className="text-xs text-[#475569]">
                    Minimum 20 characters. {form.message.length}/20
                  </p>
                  {form.message.length >= 20 && (
                    <span className="text-xs text-[#126542] flex items-center">
                      <FiCheckCircle className="mr-1" />
                      Good length
                    </span>
                  )}
                </div>
              </div>

              

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-[#E2E8F0]">
                <Link
                  to="/dashboard/support"
                  className="px-6 py-3 text-[#475569] border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-[#126542] text-white rounded-lg font-semibold hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FiSend className="mr-2" />
                      Submit Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - Help & Tips */}
        <div className="space-y-6">
          {/* Common Issues */}
          <div className="bg-white rounded-md shadow-sm border border-[#E2E8F0] p-6">
            <h3 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center">
              <FiInfo className="mr-2 text-[#126542]" />
              Common Issues
            </h3>
            <div className="space-y-2">
              {commonIssues.map((issue, index) => (
                <button
                  key={index}
                  onClick={() => setForm({ ...form, subject: issue })}
                  className="w-full text-left px-3 py-2 text-sm text-[#475569] hover:bg-[#F8FAFC] rounded-lg transition-colors"
                >
                  {issue}
                </button>
              ))}
            </div>
          </div>

        
          {/* Priority Guide */}
          <div className="bg-white rounded-md shadow-sm border border-[#E2E8F0] p-6">
            <h3 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center">
              <FiFlag className="mr-2 text-[#126542]" />
              Priority Guide
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                <span className="text-sm font-medium text-[#0F172A]">Low Priority</span>
              </div>
              <p className="text-xs text-[#475569] pl-5">
                General questions, feature requests, non-urgent issues
              </p>
              
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span className="text-sm font-medium text-[#0F172A]">Medium Priority</span>
              </div>
              <p className="text-xs text-[#475569] pl-5">
                Account issues, listing problems, payment inquiries
              </p>
              
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span className="text-sm font-medium text-[#0F172A]">High Priority</span>
              </div>
              <p className="text-xs text-[#475569] pl-5">
                System outages, security issues, urgent payment failures
              </p>
            </div>
          </div>

          
          {/* WhatsApp Support */}
          <div className="bg-white rounded-md shadow-sm border border-[#E2E8F0] p-6">
            <div className="flex items-center space-x-3 mb-3">
              <FaWhatsapp className="text-2xl text-[#25D366]" />
              <h3 className="text-lg font-bold text-[#0F172A]">WhatsApp Support</h3>
            </div>
            <p className="text-sm text-[#475569] mb-4">
              For urgent issues, you can also reach us on WhatsApp
            </p>
            <a
              href="https://wa.me/254738388000"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-4 py-3 bg-[#25D366] text-white rounded-lg font-semibold hover:bg-[#128C7E] transition-colors text-center"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateTicket