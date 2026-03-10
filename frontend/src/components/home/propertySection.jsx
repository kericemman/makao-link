import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getPropertiesByType } from "../../services/property.service"
import { 
  FiHome, 
  FiMapPin, 
  FiDollarSign, 
  FiArrowRight,
  FiCamera,
  FiHeart,
  FiEye
} from "react-icons/fi"
import { FaBed, FaBath } from "react-icons/fa"
import toast from "react-hot-toast"

function PropertySection({ title, type }) {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProperties()
  }, [type])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const res = await getPropertiesByType(type)
      // Get approved properties and slice to 3
      const approvedProperties = res.data.filter(p => p.status === "approved")
      setProperties(approvedProperties.slice(0, 3))
    } catch (error) {
      toast.error(`Failed to load ${title} properties`, {
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

  // Get icon based on property type
  const getTypeIcon = () => {
    switch(type) {
      case "apartment":
        return <FiHome className="text-[#02BB31]" />
      case "house":
        return <FiHome className="text-[#02BB31]" />
      case "studio":
        return <FiHome className="text-[#02BB31]" />
      case "bedsitter":
        return <FiHome className="text-[#02BB31]" />
      default:
        return <FiHome className="text-[#02BB31]" />
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-[#F0F7F4] rounded-xl">
            {getTypeIcon()}
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#013E43]">
              {title}
            </h2>
            <p className="text-sm text-[#065A57]">
              Discover the best {title.toLowerCase()} in Kenya
            </p>
          </div>
        </div>
        
        <Link
          to={`/properties?type=${type}`}
          className="inline-flex items-center space-x-2 px-4 py-2 text-[#02BB31] hover:text-white border border-[#02BB31] hover:bg-[#02BB31] rounded-lg transition-all group"
        >
          <span>View All</span>
          <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden animate-pulse">
              <div className="h-56 bg-gray-200"></div>
              <div className="p-5 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-5 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
          <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiHome className="text-3xl text-[#A8D8C1]" />
          </div>
          <h3 className="text-lg font-semibold text-[#013E43] mb-2">No properties found</h3>
          <p className="text-sm text-[#065A57] mb-4">
            There are currently no {title.toLowerCase()} available.
          </p>
          <Link
            to="/properties"
            className="inline-flex items-center px-6 py-3 bg-[#02BB31] text-white rounded-lg font-semibold hover:bg-[#0D915C] transition-colors"
          >
            Browse All Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Link
              key={property._id}
              to={`/properties/${property._id}`}
              className="group bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              {/* Property Image */}
              <div className="relative h-56 overflow-hidden">
                {property.images?.[0] ? (
                  <img
                    src={property.images[0].url || property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-[#013E43] to-[#005C57] flex items-center justify-center">
                    <FiHome className="text-5xl text-white opacity-50" />
                  </div>
                )}
                
                {/* Price Tag */}
                <div className="absolute bottom-4 left-4 px-4 py-2 bg-[#013E43]/90 text-white font-bold rounded-lg backdrop-blur-sm">
                  {formatPrice(property.price)}
                  <span className="text-xs text-[#A8D8C1] ml-1">/month</span>
                </div>

                {/* Property Type Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm text-[#013E43] text-sm font-medium rounded-full">
                  {property.propertyType}
                </div>

                {/* Image Count */}
                <div className="absolute top-4 left-4 px-2 py-1 bg-black/50 text-white text-xs rounded-full flex items-center">
                  <FiCamera className="mr-1" />
                  {property.images?.length || 0}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-xl font-bold text-[#013E43] mb-2 line-clamp-1 group-hover:text-[#02BB31] transition-colors">
                  {property.title}
                </h3>
                
                <p className="text-[#065A57] mb-4 flex items-start">
                  <FiMapPin className="mr-2 mt-1 flex-shrink-0 text-[#02BB31]" />
                  <span className="line-clamp-1">{property.location}, {property.city}</span>
                </p>

                {/* Property Features */}
                <div className="flex items-center space-x-4 mb-4 text-[#065A57]">
                  <span className="flex items-center text-sm">
                    <FaBed className="mr-2 text-[#02BB31]" /> 
                    {property.bedrooms || 0} {property.bedrooms === 1 ? 'bed' : 'beds'}
                  </span>
                  <span className="flex items-center text-sm">
                    <FaBath className="mr-2 text-[#02BB31]" /> 
                    {property.bathrooms || 0} {property.bathrooms === 1 ? 'bath' : 'baths'}
                  </span>
                </div>

                {/* Amenities Preview */}
                {property.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {property.amenities.slice(0, 3).map((amenity) => (
                      <span
                        key={amenity}
                        className="px-3 py-1 bg-[#F0F7F4] text-[#065A57] text-xs rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                    {property.amenities.length > 3 && (
                      <span className="px-3 py-1 bg-[#F0F7F4] text-[#065A57] text-xs rounded-full">
                        +{property.amenities.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* View Details Link */}
                <div className="flex items-center justify-end text-[#02BB31] font-medium">
                  View Details
                  <FiEye className="ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export default PropertySection