import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { getProperty } from "../../../services/property.service"
import { sendInquiry } from "../../../services/inquiry.service"
import { 
  FiHome, 
  FiMapPin, 
  FiDollarSign, 
  FiUser, 
  FiMail,
  FiPhone,
  FiMessageSquare,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCamera,
  FiArrowLeft,
  FiShare2,
  FiHeart,
  FiPrinter
} from "react-icons/fi"
import { FaBed, FaBath, FaBuilding, FaWhatsapp } from "react-icons/fa"
import toast from "react-hot-toast"
import { Link } from "react-router-dom"

function PropertyDetails() {

  useEffect(() => {
    window.scrollTo(0, 0);
}, []);

  const { id } = useParams()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [showInquiryForm, setShowInquiryForm] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchProperty()
  }, [id])

  const fetchProperty = async () => {
    try {
      setLoading(true)
      const res = await getProperty(id)
      setProperty(res.data)
    } catch (error) {
      toast.error("Failed to load property details", {
        style: { background: "#013E43", color: "#fff" }
      })
    } finally {
      setLoading(false)
    }
  }

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
    if (!form.phone.trim()) newErrors.phone = "Phone number is required"
    else if (!/^(07|01)\d{8}$/.test(form.phone)) {
      newErrors.phone = "Please enter a valid Kenyan phone number"
    }
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
      setSubmitting(true)
      
      // Send inquiry to backend
      await sendInquiry({
        propertyId: property._id,
        tenantName: form.name,
        tenantEmail: form.email || undefined,
        tenantPhone: form.phone,
        message: form.message,
        inquiryType: "general"
      })

      // Prepare WhatsApp message
      const message = `
*Property Inquiry from MakaoLink*

*Property:* ${property.title}
*Location:* ${property.location}, ${property.city}
*Price:* KES ${property.price.toLocaleString()}/month

*Tenant Details:*
Name: ${form.name}
Phone: ${form.phone}
${form.email ? `Email: ${form.email}` : ''}

*Message:*
${form.message}

Sent via MakaoLink
`

      const whatsapp = `https://wa.me/${property.landlord?.phone?.replace(/^0/, "254")}?text=${encodeURIComponent(message)}`
      
      toast.success("Opening WhatsApp to contact landlord", {
        style: { background: "#02BB31", color: "#fff" }
      })

      window.open(whatsapp, "_blank")
      
      // Reset form
      setForm({ name: "", email: "", phone: "", message: "" })
      setShowInquiryForm(false)

    } catch (error) {
      toast.error("Failed to send inquiry", {
        style: { background: "#013E43", color: "#fff" }
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57] text-lg">Loading property details...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FiXCircle className="text-5xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#013E43] mb-2">Property Not Found</h2>
          <p className="text-[#065A57] mb-4">The property you're looking for doesn't exist.</p>
          <Link
            to="/properties"
            className="inline-flex items-center px-6 py-3 bg-[#02BB31] text-white rounded-lg font-semibold hover:bg-[#0D915C] transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Properties
          </Link>
        </div>
      </div>
    )
  }

  const images = property.images || []
  const mainImage = images[selectedImage]?.url || images[selectedImage]

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      {/* Back Navigation */}
      <div className="bg-white border-b border-[#A8D8C1] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/properties"
            className="inline-flex items-center text-[#065A57] hover:text-[#013E43] transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Properties
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden">
              <div className="relative h-96">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-[#013E43] to-[#005C57] flex items-center justify-center">
                    <FiHome className="text-6xl text-white opacity-50" />
                  </div>
                )}
                
                {/* Image Navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage(prev => Math.max(0, prev - 1))}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-[#013E43] hover:bg-white transition-colors"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => setSelectedImage(prev => Math.min(images.length - 1, prev + 1))}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-[#013E43] hover:bg-white transition-colors"
                    >
                      ›
                    </button>
                  </>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
                  {selectedImage + 1} / {images.length}
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="p-4 border-t border-[#A8D8C1]">
                  <div className="grid grid-cols-5 gap-2">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          index === selectedImage
                            ? 'border-[#02BB31] shadow-lg'
                            : 'border-transparent hover:border-[#A8D8C1]'
                        }`}
                      >
                        <img
                          src={img.url || img}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Property Details Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-[#013E43] mb-2">
                    {property.title}
                  </h1>
                  <p className="text-[#065A57] flex items-center">
                    <FiMapPin className="mr-2 text-[#02BB31]" />
                    {property.location}, {property.city}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-[#02BB31]">
                    {formatPrice(property.price)}
                  </p>
                  <p className="text-sm text-[#065A57]">per month</p>
                </div>
              </div>

              {/* Property Features */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-b border-[#A8D8C1]">
                <div className="text-center">
                  <FaBed className="text-2xl text-[#02BB31] mx-auto mb-2" />
                  <p className="text-sm text-[#065A57]">Bedrooms</p>
                  <p className="text-lg font-bold text-[#013E43]">{property.bedrooms || 0}</p>
                </div>
                <div className="text-center">
                  <FaBath className="text-2xl text-[#02BB31] mx-auto mb-2" />
                  <p className="text-sm text-[#065A57]">Bathrooms</p>
                  <p className="text-lg font-bold text-[#013E43]">{property.bathrooms || 0}</p>
                </div>
                <div className="text-center">
                  <FaBuilding className="text-2xl text-[#02BB31] mx-auto mb-2" />
                  <p className="text-sm text-[#065A57]">Property Type</p>
                  <p className="text-lg font-bold text-[#013E43] capitalize">{property.propertyType}</p>
                </div>
                <div className="text-center">
                  <FiCamera className="text-2xl text-[#02BB31] mx-auto mb-2" />
                  <p className="text-sm text-[#065A57]">Photos</p>
                  <p className="text-lg font-bold text-[#013E43]">{images.length}</p>
                </div>
              </div>

              {/* Description */}
              <div className="py-4">
                <h2 className="text-xl font-bold text-[#013E43] mb-3">Description</h2>
                <p className="text-[#065A57] whitespace-pre-wrap leading-relaxed">
                  {property.description}
                </p>
              </div>

              {/* Amenities */}
              {property.amenities?.length > 0 && (
                <div className="py-4 border-t border-[#A8D8C1]">
                  <h2 className="text-xl font-bold text-[#013E43] mb-3">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center text-[#065A57]">
                        <FiCheckCircle className="text-[#02BB31] mr-2 flex-shrink-0" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Contact & Inquiry */}
          <div className="lg:col-span-1 space-y-6">
            {/* Landlord Info Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6 sticky top-24">
              <h2 className="text-xl font-bold text-[#013E43] mb-4">Contact Landlord</h2>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {property.landlord?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-[#013E43]">{property.landlord?.name}</p>
                  <p className="text-sm text-[#065A57]">Landlord</p>
                  {property.landlord?.isVerified && (
                    <span className="inline-flex items-center text-xs text-[#02BB31] mt-1">
                      <FiCheckCircle className="mr-1" />
                      Verified
                    </span>
                  )}
                </div>
              </div>

              {!showInquiryForm ? (
                <>
                  <div className="space-y-3 mb-6">
                    {property.landlord?.phone && (
                      <a
                        href={`tel:${property.landlord.phone}`}
                        className="flex items-center space-x-3 p-3 bg-[#F0F7F4] rounded-lg hover:bg-[#A8D8C1] transition-colors"
                      >
                        <FiPhone className="text-[#02BB31]" />
                        <span className="text-[#013E43]">{property.landlord.phone}</span>
                      </a>
                    )}
                    
                    <a
                      href={`https://wa.me/${property.landlord?.phone?.replace(/^0/, "254")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 p-3 bg-[#F0F7F4] rounded-lg hover:bg-[#A8D8C1] transition-colors"
                    >
                      <FaWhatsapp className="text-[#25D366] text-xl" />
                      <span className="text-[#013E43]">WhatsApp</span>
                    </a>
                  </div>

                  <button
                    onClick={() => setShowInquiryForm(true)}
                    className="w-full py-4 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <FiMessageSquare />
                    <span>Send Inquiry</span>
                  </button>
                </>
              ) : (
                /* Inquiry Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#013E43] mb-1">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className={`w-full px-4 py-3 rounded-lg border-2 outline-none transition-all ${
                        errors.name
                          ? 'border-red-400 focus:border-red-500 bg-red-50'
                          : 'border-[#A8D8C1] focus:border-[#02BB31]'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#013E43] mb-1">
                      Email (Optional)
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 rounded-lg border-2 border-[#A8D8C1] focus:border-[#02BB31] outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#013E43] mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="e.g., 0712345678"
                      className={`w-full px-4 py-3 rounded-lg border-2 outline-none transition-all ${
                        errors.phone
                          ? 'border-red-400 focus:border-red-500 bg-red-50'
                          : 'border-[#A8D8C1] focus:border-[#02BB31]'
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#013E43] mb-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows="4"
                      placeholder="I'm interested in this property. Please contact me..."
                      className={`w-full px-4 py-3 rounded-lg border-2 outline-none transition-all resize-none ${
                        errors.message
                          ? 'border-red-400 focus:border-red-500 bg-red-50'
                          : 'border-[#A8D8C1] focus:border-[#02BB31]'
                      }`}
                    />
                    {errors.message && (
                      <p className="text-xs text-red-500 mt-1">{errors.message}</p>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowInquiryForm(false)
                        setForm({ name: "", email: "", phone: "", message: "" })
                        setErrors({})
                      }}
                      className="flex-1 px-4 py-3 text-[#065A57] border border-[#A8D8C1] rounded-lg hover:bg-[#F0F7F4] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {submitting ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      ) : (
                        'Send'
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-[#065A57] text-center">
                    You'll be redirected to WhatsApp to complete your inquiry
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertyDetails