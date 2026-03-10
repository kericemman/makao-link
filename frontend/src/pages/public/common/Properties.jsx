import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getProperties } from "../../../services/property.service"
import { 
  FiHome, 
  FiMapPin, 
  FiDollarSign, 
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiGrid,
  FiList,
  FiHeart,
  FiEye,
  FiCamera
} from "react-icons/fi"
import { FaBed, FaBath, FaBuilding } from "react-icons/fa"
import toast from "react-hot-toast"

function Properties() {

  useEffect(() => {
    window.scrollTo(0, 0);
}, []);

  const [properties, setProperties] = useState([])
  const [filteredProperties, setFilteredProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [priceRange, setPriceRange] = useState({ min: "", max: "" })
  const [propertyType, setPropertyType] = useState("all")
  const [bedrooms, setBedrooms] = useState("all")
  const [viewMode, setViewMode] = useState("grid")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchProperties()
  }, [])

  useEffect(() => {
    filterProperties()
  }, [properties, searchTerm, priceRange, propertyType, bedrooms])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const res = await getProperties()
      setProperties(res.data || [])
    } catch (error) {
      toast.error("Failed to load properties", {
        style: { background: "#013E43", color: "#fff" }
      })
    } finally {
      setLoading(false)
    }
  }

  const filterProperties = () => {
    let filtered = properties.filter(p => p.status === "approved")

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Price range filter
    if (priceRange.min) {
      filtered = filtered.filter(p => p.price >= Number(priceRange.min))
    }
    if (priceRange.max) {
      filtered = filtered.filter(p => p.price <= Number(priceRange.max))
    }

    // Property type filter
    if (propertyType !== "all") {
      filtered = filtered.filter(p => p.propertyType === propertyType)
    }

    // Bedrooms filter
    if (bedrooms !== "all") {
      if (bedrooms === "4") {
        filtered = filtered.filter(p => p.bedrooms >= 4)
      } else {
        filtered = filtered.filter(p => p.bedrooms === Number(bedrooms))
      }
    }

    setFilteredProperties(filtered)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price)
  }

  const propertyTypes = [
    "all",
    "apartment",
    "bedsitter",
    "studio",
    "house",
    "villa"
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57] text-lg">Loading properties...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#013E43] to-[#005C57] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find Your Perfect Home
          </h1>
          <p className="text-xl text-[#A8D8C1] mb-8 max-w-2xl">
            Discover verified rental properties across Kenya. Connect directly with landlords.
          </p>
          
          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-3xl">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#065A57]" />
                <input
                  type="text"
                  placeholder="Search by location, city, or property name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-[#A8D8C1] focus:outline-none focus:ring-2 focus:ring-[#02BB31] focus:border-transparent text-[#013E43]"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 py-4 bg-[#013E43] text-white rounded-xl hover:bg-[#005C57] transition-colors flex items-center justify-center space-x-2"
              >
                <FiFilter />
                <span>Filters</span>
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-[#A8D8C1] grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">Min Price (KES)</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-[#A8D8C1] focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#013E43]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">Max Price (KES)</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-[#A8D8C1] focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#013E43]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">Property Type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-[#A8D8C1] focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#013E43]"
                  >
                    {propertyTypes.map(type => (
                      <option key={type} value={type}>
                        {type === "all" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">Bedrooms</label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-[#A8D8C1] focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#013E43]"
                  >
                    <option value="all">Any</option>
                    <option value="1">1 Bedroom</option>
                    <option value="2">2 Bedrooms</option>
                    <option value="3">3 Bedrooms</option>
                    <option value="4">4+ Bedrooms</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Results Count and View Toggle */}
          <div className="mt-6 flex items-center justify-between text-white">
            <p className="text-[#A8D8C1]">
              {filteredProperties.length} properties found
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid" ? "bg-white/20" : "hover:bg-white/10"
                }`}
              >
                <FiGrid className="text-xl" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list" ? "bg-white/20" : "hover:bg-white/10"
                }`}
              >
                <FiList className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Display */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredProperties.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-[#A8D8C1]">
            <div className="w-24 h-24 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-6">
              <FiHome className="text-4xl text-[#A8D8C1]" />
            </div>
            <h2 className="text-2xl font-bold text-[#013E43] mb-3">No properties found</h2>
            <p className="text-[#065A57] mb-6">
              {searchTerm || priceRange.min || priceRange.max || propertyType !== "all" || bedrooms !== "all"
                ? "Try adjusting your filters to see more results"
                : "No properties are currently available"}
            </p>
            <button
              onClick={() => {
                setSearchTerm("")
                setPriceRange({ min: "", max: "" })
                setPropertyType("all")
                setBedrooms("all")
              }}
              className="px-6 py-3 bg-[#02BB31] text-white rounded-lg font-semibold hover:bg-[#0D915C] transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <Link
                key={property._id}
                to={`/properties/${property._id}`}
                className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1 group"
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
                  <div className="absolute bottom-4 left-4 px-4 py-2 bg-[#013E43]/90 text-white font-bold rounded-lg">
                    {formatPrice(property.price)}
                    <span className="text-xs text-[#A8D8C1]">/month</span>
                  </div>

                  {/* Property Type Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm text-[#013E43] text-sm font-medium rounded-full">
                    {property.propertyType}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-[#013E43] mb-2 line-clamp-1">
                    {property.title}
                  </h3>
                  
                  <p className="text-[#065A57] mb-4 flex items-start">
                    <FiMapPin className="mr-2 mt-1 flex-shrink-0 text-[#02BB31]" />
                    <span className="line-clamp-1">{property.location}, {property.city}</span>
                  </p>

                  {/* Property Features */}
                  <div className="flex items-center space-x-4 mb-4 text-[#065A57]">
                    <span className="flex items-center">
                      <FaBed className="mr-2 text-[#02BB31]" /> {property.bedrooms || 0} beds
                    </span>
                    <span className="flex items-center">
                      <FaBath className="mr-2 text-[#02BB31]" /> {property.bathrooms || 0} baths
                    </span>
                    <span className="flex items-center">
                      <FiCamera className="mr-2 text-[#02BB31]" /> {property.images?.length || 0}
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
                    <FiEye className="ml-2" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {filteredProperties.map((property) => (
              <Link
                key={property._id}
                to={`/properties/${property._id}`}
                className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all flex flex-col md:flex-row group"
              >
                {/* Property Image */}
                <div className="md:w-72 h-56 md:h-auto relative overflow-hidden">
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
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-2xl font-bold text-[#013E43] mb-1">
                        {property.title}
                      </h3>
                      <p className="text-[#065A57] flex items-center">
                        <FiMapPin className="mr-2 text-[#02BB31]" />
                        {property.location}, {property.city}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#02BB31]">{formatPrice(property.price)}</p>
                      <p className="text-sm text-[#065A57]">per month</p>
                    </div>
                  </div>

                  {/* Property Features */}
                  <div className="flex items-center space-x-6 mb-4">
                    <span className="flex items-center text-[#065A57]">
                      <FaBed className="mr-2 text-[#02BB31]" /> {property.bedrooms || 0} Bedrooms
                    </span>
                    <span className="flex items-center text-[#065A57]">
                      <FaBath className="mr-2 text-[#02BB31]" /> {property.bathrooms || 0} Bathrooms
                    </span>
                    <span className="px-3 py-1 bg-[#013E43] text-white text-sm rounded-full">
                      {property.propertyType}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-[#065A57] mb-4 line-clamp-2">
                    {property.description}
                  </p>

                  {/* Amenities */}
                  {property.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {property.amenities.slice(0, 5).map((amenity) => (
                        <span
                          key={amenity}
                          className="px-3 py-1 bg-[#F0F7F4] text-[#065A57] text-sm rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                      {property.amenities.length > 5 && (
                        <span className="px-3 py-1 bg-[#F0F7F4] text-[#065A57] text-sm rounded-full">
                          +{property.amenities.length - 5}
                        </span>
                      )}
                    </div>
                  )}

                  {/* View Details */}
                  <div className="flex items-center text-[#02BB31] font-medium">
                    View Full Details
                    <FiEye className="ml-2" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {filteredProperties.length > 9 && (
          <div className="mt-12 text-center">
            <button className="px-8 py-3 bg-white text-[#013E43] border-2 border-[#A8D8C1] rounded-lg font-semibold hover:bg-[#F0F7F4] transition-colors">
              Load More Properties
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Properties