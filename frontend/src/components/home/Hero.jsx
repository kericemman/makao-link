import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getProperties } from "../../services/property.service"
import { 
  FiHome, 
  FiMapPin, 
  FiDollarSign, 
  FiTrendingUp,
  FiShield,
  FiUsers,
  FiClock,
  FiArrowRight,
  FiCheckCircle
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
    
    // Image slideshow interval
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const res = await getProperties()
      // Get approved properties and slice to 3
      const approvedProperties = res.data.filter(p => p.status === "approved")
      setProperties(approvedProperties.slice(0, 3))
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
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[#013E43]/90"></div>
        
       
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#02BB31] rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#A8D8C1] rounded-full opacity-20 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#0D915C] rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Floating Property Cards (Decorative) */}
      
        

      <div className="absolute bottom-20 right-10 hidden lg:block animate-float-delayed">
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20">
          <div className="flex items-center space-x-3">
            <img 
              src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80" 
              alt="Property"
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div>
              <p className="text-white text-sm font-medium">Luxury Villa</p>
              <p className="text-[#A8D8C1] text-xs">KES 85,000/mo</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          
          {/* LEFT SIDE - Main Content */}
          <div className="space-y-8">
            {/* Floating Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full animate-fade-in">
              <FiTrendingUp className="text-[#02BB31]" />
              <span className="text-sm font-medium">Kenya's #1 Direct Landlord Platform</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-2xl lg:text-3xl xl:text-5xl font-bold leading-tight animate-slide-up">
              <span className="text-white">Find Your Next Home</span>
              <span className="block text-[#02BB31] mt-2">Without Agents</span>
            </h1>

            {/* Description */}
            <p className="text-lg text-[#A8D8C1] leading-relaxed max-w-xl animate-slide-up delay-100">
              MakaoLink connects tenants directly with landlords. 
              Browse verified homes, schedule viewings and move 
              into your next home faster.
            </p>

            {/* Features List */}
            <div className="grid grid-cols-2 gap-3 animate-slide-up delay-200">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 text-white">
                  <FiCheckCircle className="text-[#02BB31] flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-2 animate-slide-up delay-300">
              <Link
                to="/properties"
                className="inline-flex items-center space-x-2 px-10 text-sm  py-4 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
              >
                <span>Browse Homes</span>
                
              </Link>
              
              <Link
                to="/register"
                className="inline-flex items-center justify-center text-sm space-x-2 px-10 py-2 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20"
              >
                
                <span>List Your Property</span>
              </Link>
            </div>

            
            
          </div>

          {/* RIGHT SIDE - Recent Listings */}
          <div className="space-y-4 animate-slide-up delay-500">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center">
              <FiHome className="mr-2 text-[#02BB31]" />
                Recent Listings
              </h3>
              <Link
                to="/properties"
                className="text-sm text-[#A8D8C1] hover:text-white transition-colors flex items-center"
              >
                View all
                <FiArrowRight className="ml-1" />
              </Link>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 text-center border border-white/10">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#02BB31] border-t-transparent mx-auto mb-2"></div>
                <p className="text-sm text-[#A8D8C1]">Loading properties...</p>
              </div>
            ) : properties.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 text-center border border-white/10">
                <FiHome className="text-3xl text-[#A8D8C1] mx-auto mb-2" />
                <p className="text-sm text-[#A8D8C1]">No properties available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {properties.map((property) => (
                  <Link
                    key={property._id}
                    to={`/properties/${property._id}`}
                    className="flex gap-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-3 transition-all group border border-white/10 hover:border-white/20"
                  >
                    {/* Property Image */}
                    <div className="w-24 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      {property.images?.[0] ? (
                        <img
                          src={property.images[0].url || property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-[#013E43] to-[#005C57] flex items-center justify-center">
                          <FiHome className="text-white text-xl opacity-50" />
                        </div>
                      )}
                    </div>

                    {/* Property Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate group-hover:text-[#02BB31] transition-colors">
                        {property.title}
                      </p>
                      <p className="text-sm text-[#A8D8C1] flex items-center mt-1">
                      <FiMapPin className="mr-1 text-xs flex-shrink-0" />
                        <span className="truncate">{property.location}</span>
                      </p>
                      <p className="text-[#02BB31] font-bold text-sm mt-1">
                        {formatPrice(property.price)}
                        <span className="text-xs text-[#A8D8C1] font-normal">/month</span>
                      </p>
                    </div>

                    {/* Arrow Indicator */}
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <FiArrowRight className="text-[#02BB31]" />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Trust Badges */}
            <div className="mt-6 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <p className="text-xs text-[#A8D8C1] mb-3 flex items-center">
                <FiShield className="mr-1 text-[#02BB31]" />
                Why landlords choose MakaoLink
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <FaHandshake className="text-[#02BB31] text-xs" />
                  <span className="text-xs text-white">Direct tenant contact</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaBuilding className="text-[#02BB31] text-xs" />
                  <span className="text-xs text-white">Verified listings</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiClock className="text-[#02BB31] text-xs" />
                  <span className="text-xs text-white">Quick response</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiDollarSign className="text-[#02BB31] text-xs" />
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