import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getListingsByType } from "../../services/listings.service"
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
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchListings()
  }, [type])

  const fetchListings = async () => {
    try {
      setLoading(true)
      // Fetch listings by type using the updated service
      const response = await getListingsByType(type)
      // The API now returns approved listings by default
      setListings(response.listings?.slice(0, 3) || [])
    } catch (error) {
      toast.error(`Failed to load ${title} listings`, {
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

  // Get icon based on listing type
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
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
          <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiHome className="text-3xl text-[#A8D8C1]" />
          </div>
          <h3 className="text-lg font-semibold text-[#013E43] mb-2">No listings found</h3>
          <p className="text-sm text-[#065A57] mb-4">
            There are currently no {title.toLowerCase()} available.
          </p>
          <Link
            to="/properties"
            className="inline-flex items-center px-6 py-3 bg-[#02BB31] text-white rounded-lg font-semibold hover:bg-[#0D915C] transition-colors"
          >
            Browse All Listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <Link
              key={listing._id}
              to={`/properties/${listing._id}`}
              className="group bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              {/* Listing Image */}
              <div className="relative h-56 overflow-hidden">
                {listing.images?.[0] ? (
                  <img
                    src={listing.images[0].url || listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-[#013E43] to-[#005C57] flex items-center justify-center">
                    <FiHome className="text-5xl text-white opacity-50" />
                  </div>
                )}
                
                {/* Price Tag */}
                <div className="absolute bottom-4 left-4 px-4 py-2 bg-[#013E43]/90 text-white font-bold rounded-lg backdrop-blur-sm">
                  {formatPrice(listing.price)}
                  <span className="text-xs text-[#A8D8C1] ml-1">/month</span>
                </div>

                {/* Listing Type Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm text-[#013E43] text-sm font-medium rounded-full">
                  {listing.propertyType}
                </div>

                {/* Image Count */}
                <div className="absolute top-4 left-4 px-2 py-1 bg-black/50 text-white text-xs rounded-full flex items-center">
                  <FiCamera className="mr-1" />
                  {listing.images?.length || 0}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-xl font-bold text-[#013E43] mb-2 line-clamp-1 group-hover:text-[#02BB31] transition-colors">
                  {listing.title}
                </h3>
                
                <p className="text-[#065A57] mb-4 flex items-start">
                  <FiMapPin className="mr-2 mt-1 flex-shrink-0 text-[#02BB31]" />
                  <span className="line-clamp-1">{listing.location}, {listing.city}</span>
                </p>

                {/* Listing Features */}
                <div className="flex items-center space-x-4 mb-4 text-[#065A57]">
                  <span className="flex items-center text-sm">
                    <FaBed className="mr-2 text-[#02BB31]" /> 
                    {listing.bedrooms || 0} {listing.bedrooms === 1 ? 'bed' : 'beds'}
                  </span>
                  <span className="flex items-center text-sm">
                    <FaBath className="mr-2 text-[#02BB31]" /> 
                    {listing.bathrooms || 0} {listing.bathrooms === 1 ? 'bath' : 'baths'}
                  </span>
                </div>

                {/* Amenities Preview */}
                {listing.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {listing.amenities.slice(0, 3).map((amenity) => (
                      <span
                        key={amenity}
                        className="px-3 py-1 bg-[#F0F7F4] text-[#065A57] text-xs rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                    {listing.amenities.length > 3 && (
                      <span className="px-3 py-1 bg-[#F0F7F4] text-[#065A57] text-xs rounded-full">
                        +{listing.amenities.length - 3}
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