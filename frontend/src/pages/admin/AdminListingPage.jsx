import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllListings } from "../../services/admin.service";
import { 
  FiHome, 
  FiMapPin, 
  FiDollarSign, 
  FiUser, 
  FiMail,
  FiPhone,
  FiCalendar,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiImage,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiAlertCircle,
  FiArrowRight,
  FiTag,
  FiTrendingUp
} from "react-icons/fi";
import { FaBed, FaBath, FaBuilding } from "react-icons/fa";
import toast from "react-hot-toast";

const statusClasses = {
  pending: "bg-yellow-100 text-yellow-600",
  approved: "bg-[#02BB31]/10 text-[#02BB31]",
  rejected: "bg-red-100 text-red-600"
};

const statusIcons = {
  pending: <FiClock className="text-yellow-500" />,
  approved: <FiCheckCircle className="text-[#02BB31]" />,
  rejected: <FiXCircle className="text-red-500" />
};

const availabilityClasses = {
  available: "bg-[#02BB31]/10 text-[#02BB31]",
  taken: "bg-gray-100 text-gray-600"
};

const availabilityIcons = {
  available: <FiCheckCircle className="text-[#02BB31]" />,
  taken: <FiXCircle className="text-gray-500" />
};

const AdminAllListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [status, setStatus] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [purpose, setPurpose] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (status !== "all") params.status = status;
      if (availability !== "all") params.availability = availability;
      if (purpose !== "all") params.purpose = purpose;

      const data = await getAllListings(params);
      setListings(data.listings || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load listings");
      toast.error("Failed to load listings", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [status, availability, purpose]);

  useEffect(() => {
    filterListings();
  }, [listings, searchTerm]);

  const filterListings = () => {
    let filtered = [...listings];

    if (searchTerm) {
      filtered = filtered.filter(listing => 
        listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.landlord?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.landlord?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredListings(filtered);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getImageUrl = (image) => {
    if (!image) return null;
    if (typeof image === 'object' && image.url) return image.url;
    if (typeof image === 'string') return image;
    return null;
  };

  const stats = {
    total: listings.length,
    approved: listings.filter(l => l.status === "approved").length,
    pending: listings.filter(l => l.status === "pending").length,
    rejected: listings.filter(l => l.status === "rejected").length,
    available: listings.filter(l => l.availability === "available").length,
    rent: listings.filter(l => l.purpose === "rent").length,
    sale: listings.filter(l => l.purpose === "sale").length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading listings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-[#A8D8C1]">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="text-3xl text-red-500" />
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchListings}
          className="px-4 py-2 bg-[#02BB31] text-white rounded-lg hover:bg-[#0D915C] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl">
              <FiHome className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">All Listings</h1>
              <p className="text-sm text-[#065A57]">
                View every property listing across the platform
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchListings}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <p className="text-sm text-[#065A57]">Total</p>
          <p className="text-2xl font-bold text-[#013E43]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 ">
          <p className="text-sm text-[#065A57]">Approved</p>
          <p className="text-2xl font-bold text-[#02BB31]">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 ">
          <p className="text-sm text-[#065A57]">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
       
        <div className="bg-white rounded-xl shadow-lg p-4 ">
          <p className="text-sm text-[#065A57]">Available</p>
          <p className="text-2xl font-bold text-blue-600">{stats.available}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 ">
          <p className="text-sm text-[#065A57]">For Rent</p>
          <p className="text-2xl font-bold text-purple-600">{stats.rent}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 ">
          <p className="text-sm text-[#065A57]">For Sale</p>
          <p className="text-2xl font-bold text-orange-600">{stats.sale}</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-4 border border-[#A8D8C1]">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#065A57]" />
            <input
              type="text"
              placeholder="Search by title, location, landlord name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
            >
              <option value="all">All Availability</option>
              <option value="available">Available</option>
              <option value="taken">Taken</option>
            </select>

            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
            >
              <option value="all">All Purpose</option>
              <option value="rent">For Rent</option>
              <option value="sale">For Sale</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-[#065A57]">
          Showing {filteredListings.length} of {listings.length} listings
        </div>
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
          <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiHome className="text-3xl text-[#A8D8C1]" />
          </div>
          <h2 className="text-lg font-semibold text-[#013E43] mb-2">No listings found</h2>
          <p className="text-sm text-[#065A57]">
            {searchTerm || status !== "all" || availability !== "all" || purpose !== "all"
              ? "Try adjusting your search or filters"
              : "No property listings have been created yet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredListings.map((listing) => {
            const firstImage = listing.images?.[0] ? getImageUrl(listing.images[0]) : null;
            
            return (
              <div
                key={listing._id}
                className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                  {/* Image Section */}
                  <div className="relative h-56 lg:h-auto overflow-hidden bg-gradient-to-r from-[#013E43] to-[#005C57]">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={listing.title}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                        onClick={() => {
                          setSelectedImage(firstImage);
                          setShowImageModal(true);
                        }}
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-white">
                        <FiHome className="text-4xl text-white/50 mb-2" />
                        <p className="text-sm text-white/50">No image</p>
                      </div>
                    )}
                    
                    {/* Image count badge */}
                    {listing.images?.length > 1 && (
                      <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/50 text-white text-xs rounded-full">
                        +{listing.images.length - 1} more
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-[#013E43] group-hover:text-[#02BB31] transition-colors">
                          {listing.title}
                        </h2>
                        <p className="mt-1 text-sm text-[#065A57] flex items-center">
                          <FiMapPin className="mr-1 text-[#02BB31]" />
                          {listing.location}
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-[#02BB31]">
                        {formatPrice(listing.price)}
                        <span className="text-sm text-[#065A57] font-normal ml-1">
                          {listing.purpose === "rent" ? "/month" : "/total"}
                        </span>
                      </p>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusClasses[listing.status]}`}>
                        {statusIcons[listing.status]}
                        <span className="ml-1 capitalize">{listing.status}</span>
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${availabilityClasses[listing.availability]}`}>
                        {availabilityIcons[listing.availability]}
                        <span className="ml-1 capitalize">{listing.availability}</span>
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
                        <FiTag className="mr-1" />
                        {listing.purpose === "rent" ? "For Rent" : "For Sale"}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-600">
                        <FaBuilding className="mr-1" />
                        {listing.type}
                      </span>
                    </div>

                    {/* Property Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-[#F0F7F4] rounded-lg">
                      <div className="text-center">
                        <FaBed className="text-[#02BB31] mx-auto mb-1" />
                        <p className="text-xs text-[#065A57]">Bedrooms</p>
                        <p className="text-sm font-medium text-[#013E43]">{listing.bedrooms || 0}</p>
                      </div>
                      <div className="text-center">
                        <FaBath className="text-[#02BB31] mx-auto mb-1" />
                        <p className="text-xs text-[#065A57]">Bathrooms</p>
                        <p className="text-sm font-medium text-[#013E43]">{listing.bathrooms || 0}</p>
                      </div>
                      <div className="text-center">
                        <FiImage className="text-[#02BB31] mx-auto mb-1" />
                        <p className="text-xs text-[#065A57]">Photos</p>
                        <p className="text-sm font-medium text-[#013E43]">{listing.images?.length || 0}</p>
                      </div>
                      <div className="text-center">
                        <FiEye className="text-[#02BB31] mx-auto mb-1" />
                        <p className="text-xs text-[#065A57]">Visibility</p>
                        <p className="text-sm font-medium text-[#013E43]">{listing.isActive ? "Active" : "Hidden"}</p>
                      </div>
                    </div>

                    {/* Landlord Info */}
                    <div className="mb-4 p-3 bg-[#F0F7F4] rounded-lg">
                      <p className="text-sm font-medium text-[#013E43] mb-2 flex items-center">
                        <FiUser className="mr-2 text-[#02BB31]" />
                        Landlord Information
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <p className="text-[#065A57]">
                          <span className="font-medium">Name:</span> {listing.landlord?.name || 'N/A'}
                        </p>
                        <p className="text-[#065A57]">
                          <span className="font-medium">Email:</span> {listing.landlord?.email || 'N/A'}
                        </p>
                        {listing.landlord?.phone && (
                          <p className="text-[#065A57]">
                            <span className="font-medium">Phone:</span> {listing.landlord.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-4 p-3 bg-[#F0F7F4] rounded-lg">
                      <p className="text-sm text-[#065A57] whitespace-pre-wrap line-clamp-2">
                        {listing.description}
                      </p>
                    </div>

                    {/* Footer
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#A8D8C1]">
                      <div className="flex items-center gap-2 text-xs text-[#065A57]">
                        <FiCalendar className="text-[#02BB31]" />
                        Created: {formatDate(listing.createdAt)}
                      </div>
                      <Link
                        to={`/landlord/properties/${listing._id}`}
                        className="inline-flex items-center gap-1 text-sm text-[#02BB31] hover:text-[#0D915C] font-medium"
                      >
                        View Details
                        <FiArrowRight className="text-sm" />
                      </Link>
                    </div> */}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => {
                setShowImageModal(false);
                setSelectedImage(null);
              }}
              className="absolute -top-10 right-0 text-white hover:text-[#02BB31] transition-colors"
            >
              <FiXCircle className="text-3xl" />
            </button>
            <img
              src={selectedImage}
              alt="Full size property"
              className="w-full rounded-lg shadow-2xl"
            />
            <button
              onClick={() => window.open(selectedImage, '_blank')}
              className="absolute -bottom-10 right-0 text-white hover:text-[#02BB31] transition-colors flex items-center gap-2"
            >
              <FiEye />
              View Full Size
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAllListingsPage;