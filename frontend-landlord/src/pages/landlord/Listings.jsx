import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyListings,
  markListingAvailable,
  markListingTaken,
  deleteListing
} from "../../services/listings.service";
import { 
  FiHome, 
  FiMapPin, 
  FiDollarSign, 
  FiList,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiImage,
  FiPlus,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiAlertCircle,
  FiEyeOff
} from "react-icons/fi";
import { FaBed, FaBath, FaBuilding } from "react-icons/fa";
import toast from "react-hot-toast";

const mainUrl = import.meta.env.VITE_MAIN_URL || "https://rendahomes.com";

const LandlordListings = () => {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [selectedListing, setSelectedListing] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or table

  const fetchListings = async () => {
    try {
      setLoading(true);
      const data = await getMyListings();
      setListings(data.listings || []);
    } catch (error) {
      toast.error("Failed to load listings", {
        style: { background: "#0F172A", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    filterListings();
  }, [listings, searchTerm, statusFilter, availabilityFilter]);

  const filterListings = () => {
    let filtered = [...listings];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(l => 
        l.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(l => l.status === statusFilter);
    }

    // Availability filter
    if (availabilityFilter !== "all") {
      filtered = filtered.filter(l => l.availability === availabilityFilter);
    }

    setFilteredListings(filtered);
  };

  const handleTaken = async (id) => {
    try {
      await markListingTaken(id);
      toast.success("Listing marked as taken", {
        style: { background: "#126542", color: "#fff" }
      });
      fetchListings();
    } catch (error) {
      toast.error("Failed to update listing", {
        style: { background: "#0F172A", color: "#fff" }
      });
    }
  };

  const handleAvailable = async (id) => {
    try {
      await markListingAvailable(id);
      toast.success("Listing marked as available", {
        style: { background: "#126542", color: "#fff" }
      });
      fetchListings();
    } catch (error) {
      toast.error("Failed to update listing", {
        style: { background: "#0F172A", color: "#fff" }
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteListing(selectedListing._id);
      toast.success("Listing deleted successfully", {
        style: { background: "#126542", color: "#fff" }
      });
      setShowDeleteModal(false);
      setSelectedListing(null);
      fetchListings();
    } catch (error) {
      toast.error("Failed to delete listing", {
        style: { background: "#0F172A", color: "#fff" }
      });
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#126542]/10 text-[#126542]">
            <FiCheckCircle className="mr-1" />
            Approved
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
            <FiClock className="mr-1" />
            Pending
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
            <FiXCircle className="mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {status}
          </span>
        );
    }
  };

  const getAvailabilityBadge = (availability) => {
    return availability === "available" ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#126542]/10 text-[#126542]">
        <FiCheckCircle className="mr-1" />
        Available
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <FiEyeOff className="mr-1" />
        Taken
      </span>
    );
  };

  const stats = {
    total: listings.length,
    approved: listings.filter(l => l.status === "approved").length,
    pending: listings.filter(l => l.status === "pending").length,
    available: listings.filter(l => l.availability === "available").length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E2E8F0] border-t-[#126542] mx-auto mb-4"></div>
          <p className="text-[#475569]">Loading your listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-md shadow-sm p-6 border border-[#E2E8F0]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchListings}
              className="p-2 text-[#475569] hover:bg-[#F8FAFC] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
            {/* <button
              onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
              className="p-2 text-[#475569] hover:bg-[#F8FAFC] rounded-lg transition-colors"
              title={viewMode === "grid" ? "Switch to table view" : "Switch to grid view"}
            >
              {viewMode === "grid" ? <FiList className="text-lg" /> : <FiGrid className="text-lg" />}
            </button> */}
            <Link
              to="/listings/new"
              className="px-4 py-2 bg-[#126542] text-white rounded-lg font-light hover:shadow-md transition-all flex items-center"
            >
              <FiPlus className="mr-2" />
              Add Listing
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-md shadow-sm p-4 ">
          <p className="text-sm text-[#475569]">Total Listings</p>
          <p className="text-2xl font-bold text-[#0F172A]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-md shadow-sm p-4 ">
          <p className="text-sm text-[#475569]">Approved</p>
          <p className="text-2xl font-bold text-[#126542]">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-md shadow-sm p-4 ">
          <p className="text-sm text-[#475569]">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-md shadow-sm p-4 ">
          <p className="text-sm text-[#475569]">Available</p>
          <p className="text-2xl font-bold text-[#126542]">{stats.available}</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-md shadow-sm p-4 border border-[#E2E8F0]">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#475569]" />
            <input
              type="text"
              placeholder="Search by title or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#126542] focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#126542] text-[#475569]"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#126542] text-[#475569]"
            >
              <option value="all">All Availability</option>
              <option value="available">Available</option>
              <option value="taken">Taken</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-[#475569]">
          Showing {filteredListings.length} of {listings.length} listings
        </div>
      </div>

      {/* Listings Display */}
      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-md shadow-sm p-12 text-center border border-[#E2E8F0]">
          <div className="w-20 h-20 bg-[#F8FAFC] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiHome className="text-3xl text-[#E2E8F0]" />
          </div>
          <h3 className="text-lg font-semibold text-[#0F172A] mb-2">No listings found</h3>
          <p className="text-sm text-[#475569] mb-4">
            {searchTerm || statusFilter !== "all" || availabilityFilter !== "all"
              ? "Try adjusting your filters"
              : "You haven't added any properties yet"}
          </p>
          <Link
            to="/listings/new"
            className="inline-flex items-center px-6 py-3 bg-[#126542] text-white rounded-lg font-light hover:shadow-md transition-all"
          >
            <FiPlus className="mr-2" />
            Add Your First Listing
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <div
              key={listing._id}
              className="bg-white rounded-md shadow-sm border border-[#E2E8F0] overflow-hidden hover:shadow-md transition-all transform hover:-translate-y-1"
            >
              {/* Property Image */}
              <div className="relative h-48 overflow-hidden">
                {listing.images?.[0] ? (
                  <img
                    src={listing.images[0].url || listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-[#123D38] flex items-center justify-center">
                    <FiHome className="text-4xl text-white opacity-50" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  {getStatusBadge(listing.status)}
                </div>

                {/* Price Tag */}
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-[#0F172A]/90 text-white text-sm font-semibold rounded-full">
                  {formatPrice(listing.price)}
                  <span className="text-xs text-[#E2E8F0]">/month</span>
                </div>

                {/* Availability Badge */}
                <div className="absolute bottom-3 right-3">
                  {getAvailabilityBadge(listing.availability)}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-[#0F172A] mb-1 line-clamp-1">
                  {listing.title}
                </h3>
                
                <p className="text-sm text-[#475569] mb-3 flex items-center">
                  <FiMapPin className="mr-1 flex-shrink-0" />
                  <span className="line-clamp-1">{listing.location}</span>
                </p>

                {/* Property Features */}
                <div className="flex items-center space-x-4 mb-3 text-sm text-[#475569]">
                  <span className="flex items-center">
                    <FaBed className="mr-1" /> {listing.bedrooms || 0}
                  </span>
                  <span className="flex items-center">
                    <FaBath className="mr-1" /> {listing.bathrooms || 0}
                  </span>
                  <span className="flex items-center">
                    <FiImage className="mr-1" /> {listing.images?.length || 0}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
                  <a
                    href={`${mainUrl}/listings/${listing._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-[#126542] hover:text-[#0D915C] flex items-center"
                  >
                    <FiEye className="mr-1" />
                    View Details
                  </a>
                  
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/listings/${listing._id}/edit`}
                      className="p-2 text-[#475569] hover:bg-[#F8FAFC] rounded-lg transition-colors"
                      title="Edit"
                    >
                      <FiEdit2 />
                    </Link>
                    <button
                      onClick={() => {
                        setSelectedListing(listing);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>

                {/* Availability Toggle */}
                <div className="mt-3">
                  {listing.availability === "available" ? (
                    <button
                      onClick={() => handleTaken(listing._id)}
                      className="w-full py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      Mark as Taken
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAvailable(listing._id)}
                      className="w-full py-2 text-sm bg-[#126542] text-white rounded-lg hover:bg-[#0D915C] transition-colors"
                    >
                      Mark as Available
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-md shadow-sm overflow-hidden border border-[#E2E8F0]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#123D38] text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Property</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Availability</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredListings.map((listing) => (
                  <tr key={listing._id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#123D38] rounded-lg overflow-hidden flex-shrink-0">
                          {listing.images?.[0] ? (
                            <img
                              src={listing.images[0].url || listing.images[0]}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FiHome className="text-white text-lg" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#0F172A]">{listing.title}</p>
                          <p className="text-xs text-[#475569]">{listing.bedrooms} bed, {listing.bathrooms} bath</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#0F172A]">{listing.location}</td>
                    <td className="px-6 py-4 font-bold text-[#126542]">{formatPrice(listing.price)}</td>
                    <td className="px-6 py-4">{getStatusBadge(listing.status)}</td>
                    <td className="px-6 py-4">{getAvailabilityBadge(listing.availability)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/listings/${listing._id}`}
                          className="p-2 text-[#126542] hover:bg-[#F8FAFC] rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FiEye />
                        </Link>
                        <Link
                          to={`/listings/edit/${listing._id}`}
                          className="p-2 text-[#475569] hover:bg-[#F8FAFC] rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedListing(listing);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <FiTrash2 className="text-3xl text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">Delete Listing</h3>
              <p className="text-sm text-[#475569]">
                Are you sure you want to delete "{selectedListing.title}"? This action cannot be undone.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedListing(null);
                }}
                className="flex-1 px-4 py-2 border border-[#E2E8F0] text-[#475569] rounded-lg hover:bg-[#F8FAFC] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandlordListings;
