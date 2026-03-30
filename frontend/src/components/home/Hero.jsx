import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getPublicListings } from "../../services/listings.service";
import { 
  FiHome, 
  FiMapPin, 
  FiDollarSign, 
  FiTrendingUp,
  FiShield,
  FiUsers,
  FiClock,
  FiArrowRight,
  FiCheckCircle,
  FiStar
} from "react-icons/fi"
import { FaBuilding, FaHandshake, FaKey } from "react-icons/fa"
import toast from "react-hot-toast"

function Hero() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Background images for slideshow
  const backgroundImages = [
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
  ]

  useEffect(() => {
    fetchProperties()
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const response = await getPublicListings({ limit: 3 })
      setProperties(response.listings || [])
    } catch (error) {
      toast.error("Failed to load recent properties", {
        style: { background: "#013E43", color: "#fff" }
      })
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price)
  }

  const features = [
    "Direct landlord contact",
    "Verified properties",
    "No middlemen fees",
    "Fast response times"
  ]

  const stats = [
    { icon: FiHome, value: "1,200+", label: "Verified Properties" },
    { icon: FiUsers, value: "850+", label: "Happy Landlords" },
    { icon: FiShield, value: "100%", label: "Secure Platform" },
    { icon: FiClock, value: "24/7", label: "Support" }
  ]

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image Slideshow */}
      <div className="absolute inset-0">
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image}
              alt={`Property ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        
        {/* Multi-layer Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#013E43] via-[#013E43]/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#013E43]/80"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#013E43]/50 via-transparent to-[#013E43]/50"></div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#02BB31] rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#A8D8C1] rounded-full opacity-20 blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 xl:py-24 z-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 xl:gap-16 items-start">
          
          {/* LEFT SIDE - Main Content */}
          <div className="w-full lg:w-1/2 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Floating Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full">
              <FiTrendingUp className="text-[#02BB31] text-sm sm:text-base" />
              <span className="text-xs sm:text-sm font-medium">Kenya's #1 Property Platform</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold leading-tight">
              <span className="text-white">Find Your Next Home</span>
              <span className="block text-[#02BB31] mt-1 sm:mt-2">Without Agents</span>
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base md:text-lg text-[#A8D8C1] leading-relaxed max-w-xl">
              MakaoLink connects tenants directly with landlords. 
              Browse verified homes, schedule viewings and move 
              into your next home faster.
            </p>

            {/* Features List */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 text-white">
                  <FiCheckCircle className="text-[#02BB31] text-xs sm:text-sm flex-shrink-0" />
                  <span className="text-xs sm:text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                to="/properties"
                className="inline-flex items-center justify-center space-x-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 text-sm sm:text-base"
              >
                <span>Browse Homes</span>
                <FiArrowRight className="text-sm sm:text-base" />
              </Link>
              
              <Link
                to="/register"
                className="inline-flex items-center justify-center space-x-2 px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20 text-sm sm:text-base"
              >
                <FaKey className="text-sm sm:text-base" />
                <span>List Your Property</span>
              </Link>
            </div>

            {/* Stats - Hidden on mobile, visible on tablet+ */}
            <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={index} className="text-center">
                    <Icon className="text-xl md:text-2xl text-[#02BB31] mx-auto mb-2" />
                    <p className="text-base md:text-lg font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-[#A8D8C1]">{stat.label}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT SIDE - Recent Listings */}
          <div className="w-full lg:w-1/2 space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
                <FiHome className="mr-2 text-[#02BB31] text-sm sm:text-base" />
                Recent Listings
              </h3>
              <Link
                to="/properties"
                className="text-xs sm:text-sm text-[#A8D8C1] hover:text-white transition-colors flex items-center"
              >
                View all
                <FiArrowRight className="ml-1 text-xs" />
              </Link>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 sm:p-8 text-center border border-white/10">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#02BB31] border-t-transparent mx-auto mb-2"></div>
                <p className="text-xs sm:text-sm text-[#A8D8C1]">Loading properties...</p>
              </div>
            ) : properties.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 sm:p-8 text-center border border-white/10">
                <FiHome className="text-2xl sm:text-3xl text-[#A8D8C1] mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-[#A8D8C1]">No properties available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {properties.map((property) => (
                  <Link
                    key={property._id}
                    to={`/properties/${property._id}`}
                    className="flex gap-3 sm:gap-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-3 transition-all group border border-white/10 hover:border-white/20"
                  >
                    {/* Property Image */}
                    <div className="w-20 h-16 sm:w-24 sm:h-20 rounded-lg overflow-hidden flex-shrink-0">
                      {property.images?.[0] ? (
                        <img
                          src={property.images[0].url || property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-[#013E43] to-[#005C57] flex items-center justify-center">
                          <FiHome className="text-white text-lg sm:text-xl opacity-50" />
                        </div>
                      )}
                    </div>

                    {/* Property Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm sm:text-base truncate group-hover:text-[#02BB31] transition-colors">
                        {property.title}
                      </p>
                      <p className="text-xs sm:text-sm text-[#A8D8C1] flex items-center mt-1">
                        <FiMapPin className="mr-1 text-xs flex-shrink-0" />
                        <span className="truncate">{property.location}</span>
                      </p>
                      <p className="text-[#02BB31] font-bold text-xs sm:text-sm mt-1">
                        {formatPrice(property.price)}
                        <span className="text-[#A8D8C1] text-xs font-normal">/month</span>
                      </p>
                    </div>

                    {/* Arrow Indicator */}
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <FiArrowRight className="text-[#02BB31] text-sm sm:text-base" />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Trust Badges */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <p className="text-xs text-[#A8D8C1] mb-2 sm:mb-3 flex items-center">
                <FiShield className="mr-1 text-[#02BB31] text-xs" />
                Why landlords choose MakaoLink
              </p>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <FaHandshake className="text-[#02BB31] text-xs sm:text-sm" />
                  <span className="text-xs text-white">Direct contact</span>
                </div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <FaBuilding className="text-[#02BB31] text-xs sm:text-sm" />
                  <span className="text-xs text-white">Verified listings</span>
                </div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <FiClock className="text-[#02BB31] text-xs sm:text-sm" />
                  <span className="text-xs text-white">Quick response</span>
                </div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <FiDollarSign className="text-[#02BB31] text-xs sm:text-sm" />
                  <span className="text-xs text-white">No hidden fees</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 8s ease-in-out infinite;
          animation-delay: 2s;
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .delay-100 {
          animation-delay: 0.1s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
        .delay-300 {
          animation-delay: 0.3s;
        }
        .delay-400 {
          animation-delay: 0.4s;
        }
        .delay-500 {
          animation-delay: 0.5s;
        }
      `}</style>
    </section>
  )
}

export default Hero