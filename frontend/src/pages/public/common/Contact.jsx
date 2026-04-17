import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { sendMessage } from "../../../services/contact.service"
import { Link } from "react-router-dom"
import { 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiUser, 
  FiMessageSquare,
  FiSend,
  FiCheckCircle,
  FiClock,
  FiGlobe,
  FiArrowRight,
  FiHelpCircle
} from "react-icons/fi"
import { FaWhatsapp, FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaTiktok, FaCalendar } from "react-icons/fa"
import toast from "react-hot-toast"

function Contact() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
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

    if (!form.name.trim()) newErrors.name = "Name is required"
    if (!form.email.trim()) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Please enter a valid email"
    if (!form.phone.trim()) newErrors.phone = "Phone number is required"
    else if (!/^(07|01)\d{8}$/.test(form.phone)) {
      newErrors.phone = "Please enter a valid Kenyan phone number"
    }
    if (!form.subject.trim()) newErrors.subject = "Subject is required"
    if (!form.message.trim()) newErrors.message = "Message is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fill in all required fields", {
        style: { background: "#013E43", color: "#fff" }
      })
      return
    }

    try {
      setLoading(true)
      await sendMessage(form)
      
      toast.success("Message sent successfully! We'll get back to you soon.", {
        style: {
          background: "#02BB31",
          color: "#fff",
        },
        duration: 5000
      })

      // Reset form
      setForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      })

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send message. Please try again.",
        {
          style: {
            background: "#013E43",
            color: "#fff",
          }
        }
      )
    } finally {
      setLoading(false)
    }
  }

  const contactInfo = [
    {
      icon: FiMail,
      title: "Email Us",
      
      link: "mailto:info@rendahomes.com",
      bgColor: "bg-[#02BB31]/10",
      textColor: "text-[#02BB31]"
    },
    {
      icon: FiPhone,
      title: "Call Us",
   
      link: "tel:+254729353537",
      bgColor: "bg-[#25D366]/10",
      textColor: "text-[#25D366]"
    },
    {
      icon: FaWhatsapp,
      title: "WhatsApp",
    
      link: "https://wa.me/254729353537",
      bgColor: "bg-[#25D366]/10",
      textColor: "text-[#25D366]"
    },

    {
      icon: FaCalendar,
      title: "Book a Session",
      link: "https://calendly.com/info-rendahomes/30min",
      bgColor: "bg-[#25D366]/10",
      textColor: "text-[#25D366]"


    }
   
  ]

  const socialLinks = [
    { icon: FaFacebook, link: "https://www.facebook.com/share/1CYY4uVPTy/", color: "text-[#25D366]" },
    { icon: FaLinkedin, link: "https://www.linkedin.com/company/renda-homes/", color: "text-[#25D366]" },
    
    { icon: FaInstagram, link: "https://www.instagram.com/renda.homes?igsh=MW5hM2s3dHMyeHZlaQ==", color: "text-[#25D366]" },
    { icon: FaTiktok, link: "https://www.tiktok.com/@rendahomes", color: "text-[#25D366]" },
    { icon: FaTwitter, link: "https://x.com/RendaHomes" }
  ]

  const faqs = [
    {
      question: "How quickly will I get a response?",
      answer: "We typically respond within 24 hours during business days."
    },
    {
      question: "What are your support hours?",
      answer: "Our support team is available Monday-Friday, 9am-5pm EAT."
    },
    {
      question: "Can I report a problem with a listing?",
      answer: "Yes, please include the property details in your message."
    }
  ]

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      {/* Hero Section with Background Image */}
      <div className="relative h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="Contact us background"
            className="w-full h-full object-cover"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#013E43]/95 to-[#005C57]/90"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        </div>

        {/* Centered Hero Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center text-white px-4 sm:px-6 lg:px-8">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-6">
            <FiMessageSquare className="text-[#02BB31] text-sm sm:text-base" />
            <span className="text-xs sm:text-sm font-medium">Get in Touch</span>
          </div>

          

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-[#A8D8C1] max-w-2xl mb-6 sm:mb-8 px-4">
            RendaHomes team is here to help.
          </p>

          {/* Quick Contact Stats */}
          <div className="hidden sm:flex items-center space-x-6 mt-4 text-sm text-[#A8D8C1]">
            <span className="flex items-center">
              <FiClock className="mr-2 text-[#02BB31]" />
              Response within 24h
            </span>
            <span className="flex items-center">
              <FiCheckCircle className="mr-2 text-[#02BB31]" />
              Dedicated support
            </span>
            
          </div>
        </div>

        
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Contact Info Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-12">
          {contactInfo.map((info, index) => {
            const Icon = info.icon
            return info.link ? (
              <a
                key={index}
                href={info.link}
                target={info.link.startsWith('http') ? '_blank' : undefined}
                rel={info.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="bg-white rounded-xl shadow-lg border border-[#A8D8C1] p-3 md:p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 group"
              >
                <div className={`w-8 h-8 md:w-12 md:h12 ${info.bgColor} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className={`text-sm md:text-xl ${info.textColor}`} />
                </div>
                <p className="text-sm text-[#065A57]">{info.title}</p>
                <p className="font-semibold text-[#013E43]">{info.value}</p>
              </a>
            ) : (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg border border-[#A8D8C1] p-6"
              >
                <div className={`w-12 h-12 ${info.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className={`text-xl ${info.textColor}`} />
                </div>
                <p className="text-sm text-[#065A57]">{info.title}</p>
                
              </div>
            )
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-[#A8D8C1] overflow-hidden">
            <div className="bg-gradient-to-r from-[#013E43] to-[#005C57] p-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <FiSend className="mr-2" />
                Send Us a Message
              </h2>
              <p className="text-sm text-[#A8D8C1] mt-1">
                Fill out the form and we'll get back to you within 24 hours
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                        errors.name
                          ? 'border-red-400 focus:border-red-500 bg-red-50'
                          : 'border-[#A8D8C1] focus:border-[#02BB31]'
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                        errors.email
                          ? 'border-red-400 focus:border-red-500 bg-red-50'
                          : 'border-[#A8D8C1] focus:border-[#02BB31]'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="0712345678"
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                        errors.phone
                          ? 'border-red-400 focus:border-red-500 bg-red-50'
                          : 'border-[#A8D8C1] focus:border-[#02BB31]'
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="What is this about?"
                    className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                      errors.subject
                        ? 'border-red-400 focus:border-red-500 bg-red-50'
                        : 'border-[#A8D8C1] focus:border-[#02BB31]'
                    }`}
                  />
                  {errors.subject && (
                    <p className="text-xs text-red-500 mt-1">{errors.subject}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#013E43] mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows="5"
                  placeholder="How can we help you?"
                  className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-colors resize-none ${
                    errors.message
                      ? 'border-red-400 focus:border-red-500 bg-red-50'
                      : 'border-[#A8D8C1] focus:border-[#02BB31]'
                  }`}
                />
                {errors.message && (
                  <p className="text-xs text-red-500 mt-1">{errors.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <FiSend className="mr-2" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
            {/* Office Hours */}
            <div className="bg-white rounded-2xl shadow-xl border border-[#A8D8C1] p-6">
              <h3 className="text-lg font-bold text-[#013E43] mb-4 flex items-center">
                <FiClock className="mr-2 text-[#02BB31]" />
                Office Hours
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#065A57]">Monday - Friday</span>
                  <span className="font-medium text-[#013E43]">9:00 AM - 5:00 PM</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#065A57]">Saturday</span>
                  <span className="font-medium text-[#013E43]">10:00 AM - 2:00 PM</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#065A57]">Sunday</span>
                  <span className="font-medium text-[#013E43]">Closed</span>
                </div>
              </div>
              <p className="text-xs text-[#065A57] mt-4">
                * All times are East African Time (EAT)
              </p>
            </div>

            {/* FAQ Preview */}
            <div className="bg-white rounded-2xl shadow-xl border border-[#A8D8C1] p-6">
              <h3 className="text-lg font-bold text-[#013E43] mb-4 flex items-center">
                <FiHelpCircle className="mr-2 text-[#02BB31]" />
                Quick Answers
              </h3>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index}>
                    <p className="font-medium text-[#013E43] text-sm mb-1">{faq.question}</p>
                    <p className="text-xs text-[#065A57]">{faq.answer}</p>
                  </div>
                ))}
              </div>
              <Link
                to="/faqs"
                className="mt-4 inline-flex items-center text-sm text-[#02BB31] hover:text-[#0D915C] font-medium"
              >
                View all FAQs
                <FiArrowRight className="ml-2" />
              </Link>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-2xl shadow-xl border border-[#A8D8C1] p-6">
              <h3 className="text-lg font-bold text-[#013E43] mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={index}
                      href={social.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-[#013E43] transition-all transform hover:scale-110`}
                    >
                      <Icon className="text-xl" />
                    </a>
                  )
                })}
              </div>
            </div>

            </div>
       </div>
      </div>
    </div>
  )
}

export default Contact