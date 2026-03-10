import { useEffect, useState } from "react"
import { getPartners } from "../../../services/partner.service"
import { 
  FiBriefcase, 
  FiPhone, 
  FiMail,
  FiMapPin,
  FiStar,
  FiCheckCircle,
  FiClock,
  FiShield,
  FiUsers,
  FiAward,
  FiArrowRight,
  FiSearch, 
  FiFilter,
  FiPlay,
  FiPause
} from "react-icons/fi"
import { FaWhatsapp, FaBuilding, FaTruck, FaBoxOpen, FaHandshake } from "react-icons/fa"
import { MdCleaningServices } from "react-icons/md"
import { Link } from "react-router-dom"
import toast from "react-hot-toast"

function PartnersPage() {

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    
  const [partners, setPartners] = useState([])
  const [filteredPartners, setFilteredPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [serviceFilter, setServiceFilter] = useState("all")
  const [isVideoPlaying, setIsVideoPlaying] = useState(true)

  useEffect(() => {
    fetchPartners()
  }, [])

  useEffect(() => {
    filterPartners()
  }, [partners, searchTerm, serviceFilter])

  const fetchPartners = async () => {
    try {
      setLoading(true)
      const res = await getPartners()
      setPartners(res.data || [])
    } catch (error) {
      toast.error("Failed to load partners", {
        style: { background: "#013E43", color: "#fff" }
      })
    } finally {
      setLoading(false)
    }
  }

  const filterPartners = () => {
    let filtered = [...partners]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.serviceType?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Service type filter
    if (serviceFilter !== "all") {
      filtered = filtered.filter(p => p.serviceType === serviceFilter)
    }

    setFilteredPartners(filtered)
  }

  const getServiceIcon = (type) => {
    switch(type?.toLowerCase()) {
      case "moving":
        return FaTruck
      case "cleaning":
        return MdCleaningServices
      case "packing":
        return FaBoxOpen
      default:
        return FaBuilding
    }
  }

  const getServiceColor = (type) => {
    switch(type?.toLowerCase()) {
      case "moving":
        return {
          bg: "bg-[#013E43]/10",
          text: "text-[#013E43]",
          border: "border-[#013E43]/20",
          gradient: "from-[#013E43] to-[#005C57]"
        }
      case "cleaning":
        return {
          bg: "bg-purple-100",
          text: "text-purple-600",
          border: "border-purple-200",
          gradient: "from-purple-400 to-purple-500"
        }
      default:
        return {
          bg: "bg-[#02BB31]/10",
          text: "text-[#02BB31]",
          border: "border-[#02BB31]/20",
          gradient: "from-[#02BB31] to-[#0D915C]"
        }
    }
  }

  const serviceTypes = [
    { value: "all", label: "All Services" },
    { value: "moving", label: "Moving Services" },
    { value: "cleaning", label: "Cleaning Services" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57] text-lg">Loading partners...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      {/* Hero Section with Video Background */}
      <div className="relative h-[500px] md:h-[400px] lg:h-[350px] overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute min-w-full min-h-full object-cover"
          >
            <source src="https://player.vimeo.com/external/370331553.hd.mp4?s=5b9f9b7e5b5b5b5b5b5b5b5b5b5b5b5b&profile_id=174" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#013E43]/90 to-[#005C57]/80"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        </div>

        {/* Hero Content - Centered */}
        <div className="relative h-full flex flex-col items-center justify-center text-center text-white px-4 sm:px-6 lg:px-8">
          {/* Video Controls */}
          <button
            onClick={() => setIsVideoPlaying(!isVideoPlaying)}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
          >
            {isVideoPlaying ? <FiPause className="text-white" /> : <FiPlay className="text-white" />}
          </button>

          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <FaHandshake className="text-[#02BB31]" />
            <span className="text-sm font-medium">Trusted Service Partners</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 max-w-4xl">
            Movers & Cleaning Partners
          </h1>

          {/* Description */}
          <p className="text-xl text-[#A8D8C1] max-w-2xl mb-8">
            These trusted partners help you relocate smoothly into your new home.
          </p>

          {/* Partnership CTA */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-2xl w-full border border-white/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-[#02BB31]/20 rounded-xl">
                  <FaHandshake className="text-[#02BB31] text-2xl" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">Are you a service provider?</h3>
                  <p className="text-sm text-[#A8D8C1]">Join our network of trusted partners</p>
                </div>
              </div>
              <Link
                to="/partners/apply"
                className="px-6 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105 whitespace-nowrap"
              >
                Apply as Partner
              </Link>
            </div>
          </div>
        </div>

        
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
          
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-4 border border-[#A8D8C1] mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#065A57]" />
              <input
                type="text"
                placeholder="Search partners by name or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-2">
              <FiFilter className="text-[#065A57]" />
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
              >
                {serviceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-[#065A57]">
            Showing {filteredPartners.length} of {partners.length} partners
          </div>
        </div>

        {/* Partners Grid */}
        {filteredPartners.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-[#A8D8C1]">
            <div className="w-24 h-24 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-6">
              <FaBuilding className="text-4xl text-[#A8D8C1]" />
            </div>
            <h2 className="text-2xl font-bold text-[#013E43] mb-3">No partners found</h2>
            <p className="text-[#065A57]">
              {searchTerm || serviceFilter !== "all"
                ? "Try adjusting your search or filters"
                : "No partners are currently available"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPartners.map((partner) => {
              const ServiceIcon = getServiceIcon(partner.serviceType)
              const colors = getServiceColor(partner.serviceType)
              const whatsappLink = `https://wa.me/${partner.phone?.replace(/^0/, "254")}`
              const callLink = `tel:${partner.phone}`

              return (
                <div
                  key={partner._id}
                  className="group bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  {/* Header with Service Color */}
                  <div className={`h-2 bg-gradient-to-r ${colors.gradient}`}></div>
                  
                  <div className="p-6">
                    {/* Logo and Service Type */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {partner.logo?.url ? (
                          <img
                            src={partner.logo.url}
                            alt={partner.companyName}
                            className="w-16 h-16 rounded-xl object-cover border-2 border-[#A8D8C1]"
                          />
                        ) : (
                          <div className={`w-16 h-16 ${colors.bg} rounded-xl flex items-center justify-center`}>
                            <ServiceIcon className={`text-3xl ${colors.text}`} />
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-[#013E43]">
                            {partner.companyName}
                          </h3>
                          <span className={`inline-block px-3 py-1 mt-1 text-xs font-medium ${colors.bg} ${colors.text} rounded-full`}>
                            {partner.serviceType}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rating (if available) */}
                    {partner.rating && (
                      <div className="flex items-center space-x-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={i < partner.rating ? "text-yellow-400 fill-current" : "text-gray-300"}
                          />
                        ))}
                        <span className="text-sm text-[#065A57] ml-2">({partner.reviews || 0} reviews)</span>
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-[#065A57] mb-4 line-clamp-3">
                      {partner.description}
                    </p>

                    {/* Features/Benefits */}
                    {partner.features && partner.features.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {partner.features.slice(0, 3).map((feature, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-sm text-[#065A57]">
                            <FiCheckCircle className="text-[#02BB31] flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Contact Buttons */}
                    <div className="flex gap-3 mt-6">
                      <a
                        href={callLink}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-[#013E43] text-white rounded-lg hover:bg-[#005C57] transition-colors"
                      >
                        <FiPhone />
                        <span>Call</span>
                      </a>

                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors"
                      >
                        <FaWhatsapp />
                        <span>WhatsApp</span>
                      </a>
                    </div>

                    {/* View Profile Link */}
                    <div className="mt-4 text-center">
                      <button className="text-sm text-[#02BB31] hover:text-[#0D915C] font-medium flex items-center justify-center group/link">
                        View Full Profile
                        <FiArrowRight className="ml-2 group-hover/link:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Load More Button */}
        {filteredPartners.length > 6 && (
          <div className="mt-12 text-center">
            <button className="px-8 py-3 bg-white text-[#013E43] border-2 border-[#A8D8C1] rounded-lg font-semibold hover:bg-[#F0F7F4] transition-colors">
              Load More Partners
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PartnersPage