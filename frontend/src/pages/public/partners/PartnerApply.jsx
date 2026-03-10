import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { applyPartner } from "../../../services/partner.service"
import {  
  FiUser, 
  FiPhone, 
  FiMail, 
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiUpload,
  FiImage,
  FiX,
  FiArrowLeft,
  FiShield,
  FiDollarSign,
  FiClock,
  FiBriefcase,
  FiMapPin,
  FiGlobe,
  FiHome, 
  FiUsers
} from "react-icons/fi"
import { FaHandshake, FaTruck, FaBoxOpen } from "react-icons/fa"
import { MdCleaningServices } from "react-icons/md"
import toast from "react-hot-toast"

function PartnerApply() {

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)
  const [documentPreviews, setDocumentPreviews] = useState([])

  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    description: "",
    serviceType: "moving",
    yearsInBusiness: "",
    website: "",
    address: ""
  })

  const [logo, setLogo] = useState(null)
  const [documents, setDocuments] = useState([])
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

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo must be less than 2MB", {
          style: { background: "#013E43", color: "#fff" }
        })
        return
      }
      setLogo(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleDocumentsChange = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024)
    
    if (validFiles.length !== files.length) {
      toast.error("Some files exceed 5MB and were skipped", {
        style: { background: "#013E43", color: "#fff" }
      })
    }

    setDocuments(prev => [...prev, ...validFiles])
    
    const newPreviews = validFiles.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file)
    }))
    setDocumentPreviews(prev => [...prev, ...newPreviews])
  }

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index))
    setDocumentPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!form.companyName.trim()) newErrors.companyName = "Company name is required"
    if (!form.contactPerson.trim()) newErrors.contactPerson = "Contact person is required"
    if (!form.phone.trim()) newErrors.phone = "Phone number is required"
    else if (!/^(07|01)\d{8}$/.test(form.phone)) {
      newErrors.phone = "Please enter a valid Kenyan phone number"
    }
    if (!form.email.trim()) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Please enter a valid email"
    }
    if (!form.description.trim()) newErrors.description = "Business description is required"
    if (!logo) newErrors.logo = "Company logo is required"
    if (documents.length === 0) newErrors.documents = "At least one business document is required"

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
      setIsLoading(true)

      const formData = new FormData()

      Object.keys(form).forEach(key => {
        if (form[key]) {
          formData.append(key, form[key])
        }
      })

      if (logo) {
        formData.append("logo", logo)
      }

      documents.forEach(doc => {
        formData.append("documents", doc)
      })

      await applyPartner(formData)

      toast.success("Application submitted successfully! We'll review and contact you soon.", {
        style: {
          background: "#02BB31",
          color: "#fff",
        },
        duration: 5000
      })

      // Redirect to partners page after success
      setTimeout(() => {
        navigate("/partners")
      }, 3000)

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Application failed. Please try again.",
        {
          style: {
            background: "#013E43",
            color: "#fff",
          }
        }
      )
    } finally {
      setIsLoading(false)
    }
  }

  const getServiceIcon = (type) => {
    switch(type) {
      case "moving":
        return FaTruck
      case "cleaning":
        return MdCleaningServices
      default:
        return FaBoxOpen
    }
  }

  const ServiceIcon = getServiceIcon(form.serviceType)

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      {/* Hero Section with Background Image */}
      <div className="relative h-[400px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1556911220-bff31c812dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="Partnership background"
            className="w-full h-full object-cover"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#013E43]/95 to-[#005C57]/90"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        </div>

        {/* Centered Hero Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center text-white px-4 sm:px-6 lg:px-8">
          {/* Back Button - Positioned Absolutely */}
          <Link
            to="/partners"
            className="absolute top-6 left-6 inline-flex items-center text-[#A8D8C1] hover:text-white transition-colors bg-black/20 backdrop-blur-sm px-4 py-2 rounded-lg"
          >
            <FiArrowLeft className="mr-2" />
            Back to Partners
          </Link>

          {/* Partnership Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <FaHandshake className="text-[#02BB31]" />
            <span className="text-sm font-medium">Become a Trusted Partner</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 max-w-4xl">
            Partner With MakaoLink
          </h1>

          {/* Description */}
          <p className="text-xl text-[#A8D8C1] max-w-2xl">
            Join MakaoLink as a verified relocation partner and connect with tenants and landlords who need moving and cleaning services.
          </p>

          {/* Trust Indicators */}
          <div className="mt-8 flex flex-wrap justify-center gap-6">
            <div className="flex items-center space-x-2">
              <FiCheckCircle className="text-[#02BB31]" />
              <span className="text-sm">Verified Partners</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiShield className="text-[#02BB31]" />
              <span className="text-sm">Secure Platform</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiUsers className="text-[#02BB31]" />
              <span className="text-sm">Growing Network</span>
            </div>
          </div>
        </div>

        
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-[#A8D8C1] overflow-hidden">
          {/* Progress Steps */}
          <div className="bg-[#F0F7F4] p-6 border-b border-[#A8D8C1]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-10 h-10 bg-[#02BB31] text-white rounded-full font-bold">1</div>
                <div>
                  <p className="font-semibold text-[#013E43]">Application</p>
                  <p className="text-xs text-[#065A57]">Fill in your details</p>
                </div>
              </div>
              <div className="flex-1 h-0.5 bg-[#A8D8C1] mx-4"></div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-10 h-10 bg-[#A8D8C1] text-[#065A57] rounded-full font-bold">2</div>
                <div>
                  <p className="font-semibold text-[#013E43]">Payment</p>
                  <p className="text-xs text-[#065A57]">Application fee</p>
                </div>
              </div>
              <div className="flex-1 h-0.5 bg-[#A8D8C1] mx-4"></div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-10 h-10 bg-[#A8D8C1] text-[#065A57] rounded-full font-bold">3</div>
                <div>
                  <p className="font-semibold text-[#013E43]">Review</p>
                  <p className="text-xs text-[#065A57]">Await approval</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Service Type Selection */}
            <div className="bg-gradient-to-r from-[#F0F7F4] to-white p-6 rounded-xl border border-[#A8D8C1]">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-[#02BB31]/10 rounded-lg">
                  <ServiceIcon className="text-2xl text-[#02BB31]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#013E43]">Service Type</h2>
                  <p className="text-sm text-[#065A57]">Select the service you provide</p>
                </div>
              </div>
              <select
                name="serviceType"
                value={form.serviceType}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors bg-white"
              >
                <option value="moving">Moving Services</option>
                <option value="cleaning">Cleaning Services</option>
              </select>
            </div>

            {/* Company Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#013E43] flex items-center">
                <FiHome className="mr-2 text-[#02BB31]" />
                Company Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    placeholder="Enter company name"
                    className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                      errors.companyName
                        ? 'border-red-400 focus:border-red-500 bg-red-50'
                        : 'border-[#A8D8C1] focus:border-[#02BB31]'
                    }`}
                  />
                  {errors.companyName && (
                    <p className="text-xs text-red-500 mt-1">{errors.companyName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
                    Years in Business
                  </label>
                  <input
                    name="yearsInBusiness"
                    type="number"
                    value={form.yearsInBusiness}
                    onChange={handleChange}
                    placeholder="e.g., 5"
                    className="w-full px-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#013E43] flex items-center">
                <FiUser className="mr-2 text-[#02BB31]" />
                Contact Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
                    Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="contactPerson"
                    value={form.contactPerson}
                    onChange={handleChange}
                    placeholder="Full name"
                    className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                      errors.contactPerson
                        ? 'border-red-400 focus:border-red-500 bg-red-50'
                        : 'border-[#A8D8C1] focus:border-[#02BB31]'
                    }`}
                  />
                  {errors.contactPerson && (
                    <p className="text-xs text-red-500 mt-1">{errors.contactPerson}</p>
                  )}
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
                    className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-colors ${
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
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                      errors.email
                        ? 'border-red-400 focus:border-red-500 bg-red-50'
                        : 'border-[#A8D8C1] focus:border-[#02BB31]'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
                    Website (Optional)
                  </label>
                  <input
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
                    Business Address
                  </label>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Street, city, postal code"
                    className="w-full px-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Business Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Business Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="4"
                placeholder="Tell us about your business, experience, and services..."
                className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-colors resize-none ${
                  errors.description
                    ? 'border-red-400 focus:border-red-500 bg-red-50'
                    : 'border-[#A8D8C1] focus:border-[#02BB31]'
                }`}
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">{errors.description}</p>
              )}
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Company Logo <span className="text-red-500">*</span>
              </label>
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                errors.logo ? 'border-red-300 bg-red-50' : 'border-[#A8D8C1] hover:border-[#02BB31]'
              }`}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <FiImage className="text-3xl text-[#065A57] mb-2" />
                  <span className="text-sm text-[#065A57]">
                    Click to upload company logo
                  </span>
                  <span className="text-xs text-[#065A57] mt-1">
                    PNG, JPG up to 2MB
                  </span>
                </label>
              </div>
              {logoPreview && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-20 w-20 object-cover rounded-lg border-2 border-[#A8D8C1]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLogo(null)
                      setLogoPreview(null)
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              )}
              {errors.logo && (
                <p className="text-xs text-red-500 mt-1">{errors.logo}</p>
              )}
            </div>

            {/* Documents Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Business Documents <span className="text-red-500">*</span>
              </label>
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                errors.documents ? 'border-red-300 bg-red-50' : 'border-[#A8D8C1] hover:border-[#02BB31]'
              }`}>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleDocumentsChange}
                  className="hidden"
                  id="documents-upload"
                />
                <label
                  htmlFor="documents-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <FiFileText className="text-3xl text-[#065A57] mb-2" />
                  <span className="text-sm text-[#065A57]">
                    Click to upload business documents
                  </span>
                  <span className="text-xs text-[#065A57] mt-1">
                    PDF, PNG, JPG up to 5MB each
                  </span>
                </label>
              </div>

              {/* Document Previews */}
              {documentPreviews.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-[#013E43]">Uploaded Documents:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {documentPreviews.map((doc, index) => (
                      <div key={index} className="relative bg-[#F0F7F4] p-2 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <FiFileText className="text-[#02BB31]" />
                          <span className="text-xs text-[#013E43] truncate">{doc.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {errors.documents && (
                <p className="text-xs text-red-500 mt-1">{errors.documents}</p>
              )}
            </div>

            {/* Fee Information */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <FiDollarSign className="text-2xl text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#013E43] mb-2">Application Fee</h3>
                  <p className="text-2xl font-bold text-[#013E43] mb-2">
                    KES 5,000 <span className="text-sm font-normal text-[#065A57]">one-time payment</span>
                  </p>
                  <p className="text-sm text-[#065A57] flex items-center">
                    <FiClock className="mr-1" />
                    Your application will be reviewed after payment verification
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                  Submitting Application...
                </>
              ) : (
                <>
                  <FaHandshake className="mr-2" />
                  Submit Application
                </>
              )}
            </button>

            {/* Terms */}
            <p className="text-xs text-center text-[#065A57]">
              By submitting this application, you agree to our{' '}
              <Link to="/terms" className="text-[#02BB31] hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-[#02BB31] hover:underline">
                Privacy Policy
              </Link>
            </p>
          </form>
        </div>

        {/* Trust Badge */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-[#065A57]">
          <FiShield className="text-[#02BB31]" />
          <span>Your information is secure and encrypted</span>
        </div>
      </div>
    </div>
  )
}

export default PartnerApply