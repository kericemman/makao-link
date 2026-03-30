import { useEffect, useState } from "react";
import {
  getPendingListings,
  approveListing,
  rejectListing
} from "../../services/admin.service";
import { 
  FiHome, 
  FiMapPin, 
  FiDollarSign, 
  FiUser, 
  FiMail,
  FiPhone,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiImage,
  FiRefreshCw,
  FiAlertCircle,
  FiEye,
  FiArrowRight
} from "react-icons/fi";
import { FaBed, FaBath, FaBuilding } from "react-icons/fa";
import toast from "react-hot-toast";

const PendingListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectId, setRejectId] = useState("");

  const fetchPendingListings = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getPendingListings();
      setListings(data.listings || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load pending listings");
      toast.error("Failed to load pending listings", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingListings();
  }, []);

  const handleApprove = async (id) => {
    try {
      setActionLoadingId(id);
      await approveListing(id);
      setListings((prev) => prev.filter((item) => item._id !== id));
      toast.success("Listing approved successfully", {
        style: { background: "#02BB31", color: "#fff" }
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve listing", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setActionLoadingId("");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    try {
      setActionLoadingId(rejectId);
      await rejectListing(rejectId, { reason: rejectReason });
      setListings((prev) => prev.filter((item) => item._id !== rejectId));
      toast.success("Listing rejected", {
        style: { background: "#02BB31", color: "#fff" }
      });
      setShowRejectModal(false);
      setRejectReason("");
      setRejectId("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject listing", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setActionLoadingId("");
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading pending listings...</p>
        </div>
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
              <FiClock className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">Pending Listings</h1>
              <p className="text-sm text-[#065A57]">
                Review, approve, or reject newly submitted properties
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchPendingListings}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 rounded-xl p-4 text-sm text-red-600 border border-red-200">
          <div className="flex items-start space-x-3">
            <FiAlertCircle className="text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {listings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
          <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="text-3xl text-[#02BB31]" />
          </div>
          <h2 className="text-lg font-semibold text-[#013E43] mb-2">No pending listings</h2>
          <p className="text-sm text-[#065A57]">
            Everything is up to date right now.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {listings.map((listing) => {
            const busy = actionLoadingId === listing._id;
            const firstImage = listing.images?.[0]?.url || listing.images?.[0];

            return (
              <div
                key={listing._id}
                className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                  {/* Image Section */}
                  <div className="relative h-64 lg:h-auto overflow-hidden bg-[#F0F7F4]">
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
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <FiImage className="text-3xl text-[#A8D8C1] mx-auto mb-2" />
                          <p className="text-sm text-[#065A57]">No image</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Image count badge */}
                    {listing.images?.length > 1 && (
                      <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/50 text-white text-xs rounded-full">
                        +{listing.images.length - 1} more
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
                        <FiClock className="mr-1" />
                        Pending Review
                      </span>
                    </div>
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
                        <span className="text-xs text-[#065A57] font-normal ml-1">/month</span>
                      </p>
                    </div>

                    {/* Property Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-[#F0F7F4] rounded-lg">
                      <div className="text-center">
                        <FaBuilding className="text-[#02BB31] mx-auto mb-1" />
                        <p className="text-xs text-[#065A57]">Type</p>
                        <p className="text-sm font-medium text-[#013E43] capitalize">{listing.type}</p>
                      </div>
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
                    </div>

                    {/* Description */}
                    <div className="mb-4 p-3 bg-[#F0F7F4] rounded-lg">
                      <p className="text-sm text-[#065A57] whitespace-pre-wrap line-clamp-3">
                        {listing.description}
                      </p>
                      {listing.description?.length > 150 && (
                        <button className="text-xs text-[#02BB31] mt-1 hover:underline">
                          Read more
                        </button>
                      )}
                    </div>

                    {/* Landlord Info */}
                    <div className="mb-4 p-3 bg-[#F0F7F4] rounded-lg">
                      <p className="text-sm font-medium text-[#013E43] mb-2 flex items-center">
                        <FiUser className="mr-2 text-[#02BB31]" />
                        Landlord Information
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
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
                        {listing.contactPhone && listing.contactPhone !== listing.landlord?.phone && (
                          <p className="text-[#065A57]">
                            <span className="font-medium">Contact:</span> {listing.contactPhone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Amenities Preview */}
                    {listing.amenities?.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {listing.amenities.slice(0, 4).map((amenity) => (
                            <span
                              key={amenity}
                              className="text-xs bg-[#F0F7F4] text-[#065A57] px-2 py-1 rounded-full"
                            >
                              {amenity}
                            </span>
                          ))}
                          {listing.amenities.length > 4 && (
                            <span className="text-xs bg-[#F0F7F4] text-[#065A57] px-2 py-1 rounded-full">
                              +{listing.amenities.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        onClick={() => handleApprove(listing._id)}
                        disabled={busy}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {busy && actionLoadingId === listing._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <FiCheckCircle className="mr-2" />
                            Approve Listing
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setRejectId(listing._id);
                          setShowRejectModal(true);
                        }}
                        disabled={busy}
                        className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <FiXCircle className="mr-2" />
                        Reject
                      </button>
                    </div>
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
              className="absolute -bottom-10 right-0 text-white hover:text-[#02BB31] transition-colors flex items-center"
            >
              <FiEye className="mr-2" />
              View Full Size
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <FiXCircle className="text-3xl text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-[#013E43] mb-2">Reject Listing</h3>
              <p className="text-sm text-[#065A57]">
                Please provide a reason for rejecting this listing. This will be shared with the landlord.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[#065A57] mb-2">
                Reason for rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows="4"
                className="w-full px-4 py-3 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] resize-none"
                placeholder="Enter the reason for rejection..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                  setRejectId("");
                }}
                className="flex-1 px-4 py-2 border border-[#A8D8C1] text-[#065A57] rounded-lg hover:bg-[#F0F7F4] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Reject Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingListingsPage;