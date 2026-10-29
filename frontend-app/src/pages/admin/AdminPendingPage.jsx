import { useEffect, useState } from "react";
import {
  getPendingListings,
  approveListing,
  rejectListing
} from "../../services/admin.service";
import { 
  FiMapPin, 
  FiUser, 
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiImage,
  FiRefreshCw,
  FiAlertCircle,
  FiEye,
  FiExternalLink
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
  const [selectedListing, setSelectedListing] = useState(null);

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
        style: { background: "#0D915C", color: "#fff" }
      });
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve listing", {
        style: { background: "#013E43", color: "#fff" }
      });
      return false;
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
        style: { background: "#0D915C", color: "#fff" }
      });
      setShowRejectModal(false);
      setRejectReason("");
      setRejectId("");
      setSelectedListing(null);
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

  const formatLocation = (listing) => {
    return [listing.area, listing.town, listing.county].filter(Boolean).join(", ") || listing.location || "Location not set";
  };

  const getImageUrl = (image) => {
    if (!image) return null;
    if (typeof image === "object" && image.url) return image.url;
    if (typeof image === "string") return image;
    return null;
  };

  const getAmenityEntries = (amenities = {}) => {
    if (Array.isArray(amenities)) {
      return amenities.map((amenity) => [amenity, true]);
    }

    return Object.entries(amenities).filter(([, value]) => Boolean(value));
  };

  const formatAmenity = (amenity) => {
    return String(amenity)
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (letter) => letter.toUpperCase());
  };

  const openRejectModal = (listingId) => {
    setRejectId(listingId);
    setShowRejectModal(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-[#DDEAE3] border-t-[#0D915C]" />
          <p className="text-sm font-semibold text-[#013E43]">Loading pending listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#DDEAE3] pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0D915C]">Listing Control</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#013E43]">Pending review</h1>
          <p className="mt-1 text-sm text-[#647C75]">Inspect the complete property before approving or rejecting it.</p>
        </div>
        <button
          type="button"
          onClick={fetchPendingListings}
          className="inline-flex items-center gap-2 rounded-lg border border-[#DDEAE3] bg-white px-3 py-2 text-sm font-semibold text-[#013E43] transition hover:bg-[#F6FAF7]"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      <div className="flex items-center justify-between border-b border-[#DDEAE3] py-3">
        <span className="text-sm font-semibold text-[#013E43]">Review queue</span>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">{listings.length} pending</span>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0 text-red-500" />
            <span>{error}</span>
        </div>
      )}

      {listings.length === 0 ? (
        <div className="border-y border-[#DDEAE3] bg-white px-5 py-12 text-center">
          <FiCheckCircle className="mx-auto mb-3 text-3xl text-[#0D915C]" />
          <h2 className="text-base font-semibold text-[#013E43]">No pending listings</h2>
          <p className="mt-1 text-sm text-[#647C75]">The review queue is clear.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#E7F0EA] border-y border-[#DDEAE3] bg-white">
          {listings.map((listing) => {
            const busy = actionLoadingId === listing._id;
            const firstImage = getImageUrl(listing.images?.[0]);

            return (
              <div
                key={listing._id}
                className="grid gap-4 px-4 py-4 transition hover:bg-[#FAFCFA] sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-center sm:px-5"
              >
                  <div className="relative h-24 overflow-hidden rounded-md bg-[#F1F7F3] sm:h-20">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={listing.title}
                        className="h-full w-full cursor-pointer object-cover transition-transform duration-300 hover:scale-105"
                        onClick={() => {
                          setSelectedImage(firstImage);
                          setShowImageModal(true);
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#8A9C96]">
                        <FiImage className="text-xl" />
                      </div>
                    )}
                    {listing.images?.length > 1 && (
                      <span className="absolute bottom-1 right-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white">{listing.images.length} photos</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-semibold text-[#013E43]">{listing.title}</h2>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800"><FiClock /> Pending</span>
                    </div>
                    <p className="mt-1 flex items-center gap-1 truncate text-sm text-[#647C75]"><FiMapPin className="shrink-0 text-[#0D915C]" />{formatLocation(listing)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#647C75]">
                      <span className="font-semibold text-[#013E43]">{formatPrice(listing.price)} <span className="font-normal text-[#647C75]">{listing.purpose === "rent" ? "/ month" : "/ total"}</span></span>
                      <span className="capitalize">{listing.type || "Property"} · {listing.purpose || "purpose not set"}</span>
                      <span className="inline-flex items-center gap-1"><FiUser />{listing.landlord?.name || "Landlord not set"}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedListing(listing)}
                      disabled={busy}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#BFD6CA] bg-white px-3 py-2 text-sm font-semibold text-[#013E43] transition hover:bg-[#F1F7F3] disabled:opacity-50 sm:flex-none"
                    >
                      <FiEye /> Review
                    </button>
                    <button
                      type="button"
                      onClick={() => openRejectModal(listing._id)}
                      disabled={busy}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50 sm:flex-none"
                    >
                      <FiXCircle /> Reject
                    </button>
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
              className="absolute -top-10 right-0 text-white hover:text-[#0D915C] transition-colors"
            >
              <FiXCircle className="text-3xl" />
            </button>
            <img
              src={selectedImage}
              alt="Full size property"
              className="w-full rounded-lg shadow-sm"
            />
            <button
              onClick={() => window.open(selectedImage, '_blank')}
              className="absolute -bottom-10 right-0 text-white hover:text-[#0D915C] transition-colors flex items-center"
            >
              <FiEye className="mr-2" />
              View Full Size
            </button>
          </div>
        </div>
      )}

      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white shadow-sm">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#DDEAE3] bg-white px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0D915C]">Full listing review</p>
                <h3 className="text-xl font-bold text-[#013E43]">{selectedListing.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedListing(null)}
                className="rounded-lg p-2 text-[#41635A] transition hover:bg-[#F1F7F3]"
                aria-label="Close review"
              >
                <FiXCircle className="text-2xl" />
              </button>
            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  {(selectedListing.images || []).map((image, index) => {
                    const imageUrl = getImageUrl(image);
                    if (!imageUrl) return null;

                    return (
                      <button
                        key={`${imageUrl}-${index}`}
                        type="button"
                        onClick={() => {
                          setSelectedImage(imageUrl);
                          setShowImageModal(true);
                        }}
                        className="overflow-hidden rounded-lg border border-[#DDEAE3] bg-[#F1F7F3]"
                      >
                        <img src={imageUrl} alt={`${selectedListing.title} ${index + 1}`} className="h-56 w-full object-cover" />
                      </button>
                    );
                  })}
                  {!selectedListing.images?.length && (
                    <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-[#DDEAE3] bg-[#F8FAF8] text-sm text-[#41635A]">
                      No listing images uploaded
                    </div>
                  )}
                </div>

                <section className="border-y border-[#DDEAE3] py-4">
                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#647C75]">Description</h4>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-[#013E43]">{selectedListing.description}</p>
                </section>

                {getAmenityEntries(selectedListing.amenities).length > 0 && (
                  <section className="border-b border-[#DDEAE3] pb-4">
                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#647C75]">Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {getAmenityEntries(selectedListing.amenities).map(([amenity]) => (
                        <span key={amenity} className="rounded-full border border-[#DCEBE2] px-3 py-1 text-xs font-semibold text-[#013E43]">
                          {formatAmenity(amenity)}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <div className="space-y-5">
                <section className="grid grid-cols-2 gap-3 border-b border-[#DDEAE3] pb-4">
                  <div>
                    <p className="text-xs text-[#647C75]">Price</p>
                    <p className="font-semibold text-[#013E43]">
                      {formatPrice(selectedListing.price)}
                      <span className="ml-1 text-xs font-normal text-[#647C75]">
                        {selectedListing.purpose === "rent" ? "/month" : "/total"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#647C75]">Purpose</p>
                    <p className="font-semibold capitalize text-[#013E43]">{selectedListing.purpose || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#647C75]">Type</p>
                    <p className="font-semibold capitalize text-[#013E43]">{selectedListing.type || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#647C75]">Status</p>
                    <p className="font-semibold capitalize text-[#013E43]">{selectedListing.status}</p>
                  </div>
                </section>

                <section className="grid grid-cols-2 gap-3 border-b border-[#DDEAE3] pb-4">
                  <div>
                    <p className="text-xs text-[#647C75]">County</p>
                    <p className="font-semibold text-[#013E43]">{selectedListing.county || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#647C75]">Town</p>
                    <p className="font-semibold text-[#013E43]">{selectedListing.town || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#647C75]">Area</p>
                    <p className="font-semibold text-[#013E43]">{selectedListing.area || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#647C75]">Map</p>
                    {selectedListing.latitude && selectedListing.longitude ? (
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${selectedListing.latitude}&mlon=${selectedListing.longitude}#map=16/${selectedListing.latitude}/${selectedListing.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#0D915C]"
                      >
                        Open map <FiExternalLink />
                      </a>
                    ) : (
                      <p className="font-semibold text-[#013E43]">Not set</p>
                    )}
                  </div>
                </section>

                <section className="grid grid-cols-2 gap-3 border-b border-[#DDEAE3] pb-4">
                  <div>
                    <p className="text-xs text-[#647C75]">Bedrooms</p>
                    <p className="font-semibold text-[#013E43]">{selectedListing.bedrooms ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#647C75]">Bathrooms</p>
                    <p className="font-semibold text-[#013E43]">{selectedListing.bathrooms ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#647C75]">Size</p>
                    <p className="font-semibold text-[#013E43]">
                      {selectedListing.size ? `${selectedListing.size} ${selectedListing.sizeUnit || ""}` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#647C75]">Video</p>
                    {selectedListing.video ? (
                      <a href={selectedListing.video} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#0D915C]">
                        Open video <FiExternalLink />
                      </a>
                    ) : (
                      <p className="font-semibold text-[#013E43]">Not added</p>
                    )}
                  </div>
                </section>

                <section className="border-b border-[#DDEAE3] pb-4">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#647C75]">Landlord</h4>
                  <div className="space-y-2 text-sm text-[#013E43]">
                    <p><span className="text-[#647C75]">Name:</span> {selectedListing.landlord?.name || "N/A"}</p>
                    <p><span className="text-[#647C75]">Email:</span> {selectedListing.landlord?.email || "N/A"}</p>
                    <p><span className="text-[#647C75]">Phone:</span> {selectedListing.landlord?.phone || "N/A"}</p>
                    <p><span className="text-[#647C75]">Listing contact:</span> {selectedListing.contactPhone || "N/A"}</p>
                  </div>
                </section>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={async () => {
                      if (await handleApprove(selectedListing._id)) setSelectedListing(null);
                    }}
                    disabled={actionLoadingId === selectedListing._id}
                    className="flex-1 rounded-lg bg-[#0D915C] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#08764C] disabled:opacity-50"
                  >
                    Approve listing
                  </button>
                  <button
                    type="button"
                    onClick={() => openRejectModal(selectedListing._id)}
                    disabled={actionLoadingId === selectedListing._id}
                    className="flex-1 rounded-lg bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                  >
                    Reject listing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#062E2B]/55 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-[#DDEAE3] bg-white shadow-2xl">
            <div className="border-b border-[#E8F0EB] px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-700">Listing decision</p>
              <h3 className="mt-1 text-lg font-semibold text-[#013E43]">Reject listing</h3>
              <p className="mt-1 text-sm text-[#647C75]">
                Please provide a reason for rejecting this listing. This will be shared with the landlord.
              </p>
            </div>

            <div className="p-5">
              <label className="mb-2 block text-sm font-semibold text-[#013E43]">
                Reason for rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows="4"
                className="w-full resize-none rounded-lg border border-[#DDEAE3] px-3 py-2.5 text-sm text-[#013E43] outline-none transition focus:border-[#0D915C]"
                placeholder="Enter the reason for rejection..."
              />

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                    setRejectId("");
                  }}
                  className="rounded-lg border border-[#DDEAE3] px-3 py-2 text-sm font-semibold text-[#013E43] transition hover:bg-[#F6FAF7]"
                >Cancel</button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || Boolean(actionLoadingId)}
                  className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                >Reject listing</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingListingsPage;
