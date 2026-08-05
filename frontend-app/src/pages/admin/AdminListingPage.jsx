import { useEffect, useMemo, useState } from "react";
import {
  getAllListings,
  moveListingToTrash,
  permanentlyDeleteListing,
  restoreListingFromTrash,
  updateListingTrust
} from "../../services/admin.service";
import {
  FiCalendar,
  FiCheckCircle,
  FiImage,
  FiMapPin,
  FiRefreshCw,
  FiRotateCcw,
  FiSearch,
  FiTrash2,
  FiXCircle
} from "react-icons/fi";
import { FaBath, FaBed } from "react-icons/fa";
import toast from "react-hot-toast";

const statusStyle = {
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
  rejected: "bg-red-50 text-red-700 border-red-100"
};

const AdminAllListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [status, setStatus] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [purpose, setPurpose] = useState("all");
  const [viewMode, setViewMode] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [trustForm, setTrustForm] = useState({
    verificationStatus: "unverified",
    listingSource: "landlord",
    availability: "available",
    isActive: true,
    adminNote: ""
  });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [error, setError] = useState("");

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (status !== "all") params.status = status;
      if (availability !== "all") params.availability = availability;
      if (purpose !== "all") params.purpose = purpose;
      if (viewMode === "trash") params.trash = true;

      const data = await getAllListings(params);
      setListings(data.listings || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load listings");
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [status, availability, purpose, viewMode]);

  const filteredListings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return listings;

    return listings.filter((listing) => {
      return [
        listing.title,
        listing.county,
        listing.town,
        listing.area,
        listing.landlord?.name,
        listing.landlord?.email
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [listings, searchTerm]);

  const stats = useMemo(
    () => ({
      total: listings.length,
      approved: listings.filter((listing) => listing.status === "approved").length,
      pending: listings.filter((listing) => listing.status === "pending").length,
      hidden: listings.filter((listing) => !listing.isActive).length,
      trash: listings.filter((listing) => listing.isDeleted).length
    }),
    [listings]
  );

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0
    }).format(price || 0);

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        })
      : "N/A";

  const getImageUrl = (image) => {
    if (!image) return null;
    if (typeof image === "object" && image.url) return image.url;
    if (typeof image === "string") return image;
    return null;
  };

  const formatLocation = (listing) => {
    return [listing.area, listing.town, listing.county].filter(Boolean).join(", ") || "Location not set";
  };

  const formatTrashExpiry = (date) => {
    if (!date) return "30 days";
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    if (diff <= 0) return "soon";
    return `${diff} day${diff === 1 ? "" : "s"}`;
  };

  const handleMoveToTrash = async (listing) => {
    if (!window.confirm(`Remove "${listing.title}" from public listings?`)) return;

    try {
      setActionLoadingId(listing._id);
      await moveListingToTrash(listing._id, { reason: "Removed by admin" });
      setSelectedListing(null);
      toast.success("Listing moved to trash");
      fetchListings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to move listing to trash");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleRestore = async (listing) => {
    try {
      setActionLoadingId(listing._id);
      await restoreListingFromTrash(listing._id);
      setSelectedListing(null);
      toast.success("Listing restored");
      fetchListings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to restore listing");
    } finally {
      setActionLoadingId("");
    }
  };

  const handlePermanentDelete = async (listing) => {
    if (!window.confirm(`Permanently delete "${listing.title}"? This cannot be undone.`)) return;

    try {
      setActionLoadingId(listing._id);
      await permanentlyDeleteListing(listing._id);
      setSelectedListing(null);
      toast.success("Listing permanently deleted");
      fetchListings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to permanently delete listing");
    } finally {
      setActionLoadingId("");
    }
  };

  const openListing = (listing) => {
    setSelectedListing(listing);
    setTrustForm({
      verificationStatus: listing.verificationStatus || "unverified",
      listingSource: listing.listingSource || "landlord",
      availability: listing.availability || "available",
      isActive: Boolean(listing.isActive),
      adminNote: listing.adminNote || ""
    });
  };

  const handleTrustChange = (field, value) => {
    setTrustForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTrustSave = async ({ markAvailabilityChecked = false } = {}) => {
    if (!selectedListing) return;

    try {
      setActionLoadingId(selectedListing._id);
      const data = await updateListingTrust(selectedListing._id, {
        ...trustForm,
        markAvailabilityChecked
      });
      setSelectedListing(data.listing);
      toast.success(markAvailabilityChecked ? "Availability checked" : "Trust details updated");
      fetchListings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update listing trust details");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 border-b border-[#DDEAE3] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0D915C]">Listing Control</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#013E43]">
            {viewMode === "trash" ? "Trash" : "Listings"}
          </h2>
          <p className="mt-1 text-sm text-[#647C75]">
            {viewMode === "trash"
              ? "Restore listings or permanently remove them before the 30-day cleanup."
              : "Scan listings quickly. Open a row only when you need to inspect or take action."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-[#DDEAE3] bg-[#F1F6F3] p-1">
            {["active", "trash"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold capitalize transition ${
                  viewMode === mode ? "bg-white text-[#013E43] shadow-sm" : "text-[#647C75] hover:text-[#013E43]"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={fetchListings}
            className="inline-flex items-center gap-2 rounded-lg border border-[#DDEAE3] bg-white px-3 py-2 text-sm font-semibold text-[#013E43] transition hover:border-[#BFD6CA]"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 border-y border-[#DDEAE3] py-4 md:grid-cols-5">
        {[
          ["Total", stats.total],
          ["Approved", stats.approved],
          ["Pending", stats.pending],
          [viewMode === "trash" ? "Trashed" : "Hidden", viewMode === "trash" ? stats.trash : stats.hidden],
          ["Showing", filteredListings.length]
        ].map(([label, value]) => (
          <div key={label} className="border-r border-[#E7F0EA] last:border-r-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8A9C96]">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-[#013E43]">{value}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 border-b border-[#DDEAE3] pb-4 xl:flex-row xl:items-center">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9C96]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search title, location, landlord..."
            className="w-full rounded-lg border border-[#DDEAE3] bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#0D915C]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-[#DDEAE3] bg-white px-3 py-2.5 text-sm text-[#013E43] outline-none">
            <option value="all">All status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={availability} onChange={(event) => setAvailability(event.target.value)} className="rounded-lg border border-[#DDEAE3] bg-white px-3 py-2.5 text-sm text-[#013E43] outline-none">
            <option value="all">All availability</option>
            <option value="available">Available</option>
            <option value="taken">Taken</option>
          </select>
          <select value={purpose} onChange={(event) => setPurpose(event.target.value)} className="rounded-lg border border-[#DDEAE3] bg-white px-3 py-2.5 text-sm text-[#013E43] outline-none">
            <option value="all">All purpose</option>
            <option value="rent">Rent</option>
            <option value="sale">Sale</option>
          </select>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-[#CDE6D8] border-t-[#02BB31]" />
            <p className="text-sm text-[#647C75]">Loading listings...</p>
          </div>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#CFE0D6] bg-[#F7FAF8] px-6 py-14 text-center">
          <p className="font-semibold text-[#013E43]">No listings found</p>
          <p className="mt-1 text-sm text-[#647C75]">Try a different filter or search term.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#DDEAE3] bg-white">
          <div className="hidden grid-cols-[minmax(260px,1.5fr)_120px_120px_150px_150px_80px] gap-4 border-b border-[#DDEAE3] bg-[#F4F8F5] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#647C75] lg:grid">
            <span>Listing</span>
            <span>Status</span>
            <span>Purpose</span>
            <span>Landlord</span>
            <span>Updated</span>
            <span className="text-right">Action</span>
          </div>

          <div className="divide-y divide-[#EEF4F0]">
            {filteredListings.map((listing) => {
              const firstImage = getImageUrl(listing.images?.[0]);

              return (
                <button
                  key={listing._id}
                  type="button"
                  onClick={() => openListing(listing)}
                  className="grid w-full gap-3 px-4 py-4 text-left transition hover:bg-[#F8FAF8] lg:grid-cols-[minmax(260px,1.5fr)_120px_120px_150px_150px_80px] lg:items-center lg:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-14 w-16 shrink-0 overflow-hidden rounded-md bg-[#E7F0EA]">
                      {firstImage ? (
                        <img src={firstImage} alt={listing.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[#8A9C96]">
                          <FiImage />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#013E43]">{listing.title}</p>
                      <p className="mt-1 flex items-center gap-1 truncate text-xs text-[#647C75]">
                        <FiMapPin />
                        {formatLocation(listing)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#0D915C]">{formatPrice(listing.price)}</p>
                    </div>
                  </div>

                  <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[listing.status] || "border-gray-100 bg-gray-50 text-gray-700"}`}>
                    {listing.status}
                  </span>
                  <span className="text-sm capitalize text-[#013E43]">{listing.purpose || "N/A"}</span>
                  <span className="truncate text-sm text-[#647C75]">{listing.landlord?.name || "N/A"}</span>
                  <span className="text-sm text-[#647C75]">{formatDate(listing.updatedAt || listing.createdAt)}</span>
                  <span className="inline-flex justify-start text-sm font-semibold text-[#0D915C] lg:justify-end">
                    View
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#001A1C]/55 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#DDEAE3] bg-white px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0D915C]">
                  {selectedListing.isDeleted ? `Trash • deletes in ${formatTrashExpiry(selectedListing.deleteExpiresAt)}` : "Listing details"}
                </p>
                <h3 className="text-xl font-semibold text-[#013E43]">{selectedListing.title}</h3>
              </div>
              <button type="button" onClick={() => setSelectedListing(null)} className="rounded-lg p-2 text-[#647C75] hover:bg-[#F4F8F5]">
                <FiXCircle className="text-2xl" />
              </button>
            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {(selectedListing.images || []).slice(0, 6).map((image, index) => {
                    const imageUrl = getImageUrl(image);
                    if (!imageUrl) return null;

                    return (
                      <button
                        key={`${imageUrl}-${index}`}
                        type="button"
                        onClick={() => setSelectedImage(imageUrl)}
                        className="h-48 overflow-hidden rounded-lg border border-[#DDEAE3] bg-[#F4F8F5]"
                      >
                        <img src={imageUrl} alt={`${selectedListing.title} ${index + 1}`} className="h-full w-full object-cover" />
                      </button>
                    );
                  })}
                  {!selectedListing.images?.length && (
                    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-[#CFE0D6] bg-[#F7FAF8] text-sm text-[#647C75]">
                      No images uploaded
                    </div>
                  )}
                </div>

                <section className="border-y border-[#DDEAE3] py-4">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8A9C96]">Description</h4>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-[#013E43]">{selectedListing.description}</p>
                </section>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 border-b border-[#DDEAE3] pb-4">
                  <Detail label="Price" value={formatPrice(selectedListing.price)} />
                  <Detail label="Status" value={selectedListing.status} />
                  <Detail label="Purpose" value={selectedListing.purpose} />
                  <Detail label="Type" value={selectedListing.type} />
                  <Detail label="Availability" value={selectedListing.availability} />
                  <Detail label="Visibility" value={selectedListing.isActive ? "Public" : "Hidden"} />
                  <Detail label="Verification" value={selectedListing.verificationStatus || "unverified"} />
                  <Detail label="Source" value={(selectedListing.listingSource || "landlord").replace("_", " ")} />
                  <Detail label="Bedrooms" value={selectedListing.bedrooms ?? "N/A"} icon={<FaBed />} />
                  <Detail label="Bathrooms" value={selectedListing.bathrooms ?? "N/A"} icon={<FaBath />} />
                </div>

                <div className="grid grid-cols-1 gap-3 border-b border-[#DDEAE3] pb-4">
                  <Detail label="Location" value={formatLocation(selectedListing)} />
                  <Detail label="Landlord" value={selectedListing.landlord?.name || "N/A"} />
                  <Detail label="Email" value={selectedListing.landlord?.email || "N/A"} />
                  <Detail label="Phone" value={selectedListing.landlord?.phone || selectedListing.contactPhone || "N/A"} />
                  <Detail label="Created" value={formatDate(selectedListing.createdAt)} />
                  <Detail label="Availability checked" value={formatDate(selectedListing.availabilityCheckedAt)} />
                  <Detail label="Reviewed by" value={selectedListing.reviewedByAdmin?.name || "N/A"} />
                </div>

                <section className="rounded-lg border border-[#DDEAE3] bg-[#F8FAF8] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0D915C]">Trust operations</p>
                      <p className="mt-1 text-sm text-[#647C75]">Keep verification, source, and availability checks clear for public trust.</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <TrustField label="Verification status">
                      <select
                        value={trustForm.verificationStatus}
                        onChange={(event) => handleTrustChange("verificationStatus", event.target.value)}
                        className="w-full rounded-lg border border-[#DDEAE3] bg-white px-3 py-2.5 text-sm text-[#013E43] outline-none"
                      >
                        <option value="unverified">Unverified</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="verified">Verified</option>
                        <option value="flagged">Flagged</option>
                      </select>
                    </TrustField>

                    <TrustField label="Listing source">
                      <select
                        value={trustForm.listingSource}
                        onChange={(event) => handleTrustChange("listingSource", event.target.value)}
                        className="w-full rounded-lg border border-[#DDEAE3] bg-white px-3 py-2.5 text-sm text-[#013E43] outline-none"
                      >
                        <option value="landlord">Landlord</option>
                        <option value="agent">Agent</option>
                        <option value="admin_assisted">Admin assisted</option>
                        <option value="app">Mobile app</option>
                        <option value="unknown">Unknown</option>
                      </select>
                    </TrustField>

                    <TrustField label="Availability">
                      <select
                        value={trustForm.availability}
                        onChange={(event) => handleTrustChange("availability", event.target.value)}
                        className="w-full rounded-lg border border-[#DDEAE3] bg-white px-3 py-2.5 text-sm text-[#013E43] outline-none"
                      >
                        <option value="available">Available</option>
                        <option value="taken">Taken</option>
                      </select>
                    </TrustField>

                    <TrustField label="Public visibility">
                      <select
                        value={trustForm.isActive ? "true" : "false"}
                        onChange={(event) => handleTrustChange("isActive", event.target.value === "true")}
                        className="w-full rounded-lg border border-[#DDEAE3] bg-white px-3 py-2.5 text-sm text-[#013E43] outline-none"
                      >
                        <option value="true">Public</option>
                        <option value="false">Hidden</option>
                      </select>
                    </TrustField>
                  </div>

                  <TrustField label="Internal admin note" className="mt-3">
                    <textarea
                      value={trustForm.adminNote}
                      onChange={(event) => handleTrustChange("adminNote", event.target.value)}
                      rows="3"
                      placeholder="Example: Called landlord on WhatsApp, availability confirmed."
                      className="w-full rounded-lg border border-[#DDEAE3] bg-white px-3 py-2.5 text-sm text-[#013E43] outline-none"
                    />
                  </TrustField>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => handleTrustSave()}
                      disabled={actionLoadingId === selectedListing._id}
                      className="flex-1 rounded-lg bg-[#013E43] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065A57] disabled:opacity-50"
                    >
                      Save trust details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTrustSave({ markAvailabilityChecked: true })}
                      disabled={actionLoadingId === selectedListing._id}
                      className="flex-1 rounded-lg border border-[#02BB31] bg-white px-4 py-3 text-sm font-semibold text-[#013E43] transition hover:bg-[#F0F7F4] disabled:opacity-50"
                    >
                      <FiCheckCircle className="mr-2 inline text-[#02BB31]" />
                      Mark availability checked
                    </button>
                  </div>
                </section>

                {viewMode === "trash" ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => handleRestore(selectedListing)}
                      disabled={actionLoadingId === selectedListing._id}
                      className="flex-1 rounded-lg border border-[#DDEAE3] px-4 py-3 text-sm font-semibold text-[#013E43] transition hover:bg-[#F4F8F5] disabled:opacity-50"
                    >
                      <FiRotateCcw className="mr-2 inline" />
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePermanentDelete(selectedListing)}
                      disabled={actionLoadingId === selectedListing._id}
                      className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                      <FiTrash2 className="mr-2 inline" />
                      Delete forever
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleMoveToTrash(selectedListing)}
                    disabled={actionLoadingId === selectedListing._id}
                    className="w-full rounded-lg border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <FiTrash2 className="mr-2 inline" />
                    Stop public listing
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <button type="button" onClick={() => setSelectedImage(null)} className="absolute right-5 top-5 text-white">
            <FiXCircle className="text-3xl" />
          </button>
          <img src={selectedImage} alt="Listing full view" className="max-h-[88vh] max-w-full rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
};

const Detail = ({ label, value, icon }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A9C96]">{label}</p>
    <p className="mt-1 flex items-center gap-2 text-sm font-semibold capitalize text-[#013E43]">
      {icon}
      {value}
    </p>
  </div>
);

const TrustField = ({ label, children, className = "" }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#647C75]">{label}</span>
    {children}
  </label>
);

export default AdminAllListingsPage;
