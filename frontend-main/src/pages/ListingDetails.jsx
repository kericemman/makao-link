import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiAlertTriangle, FiArrowLeft, FiCalendar, FiMail, FiMapPin, FiPhone, FiShare2, FiUsers, FiX } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { FaBath, FaBed, FaRulerCombined } from "react-icons/fa";
import LoadingScreen from "../components/common/LoadingScreen";
import ListingInquiryCard from "../components/listings/ListingInquiryCard";
import ListingRail from "../components/listings/ListingRail";
import { TrustPromise } from "../components/listings/TrustBadges";
import { getPublicListings, getSingleListing, reportListing } from "../services/listings.service";
import { mainRoutes, portalLinks } from "../config/portals";
import { getApiErrorMessage } from "../utils/apiError";
import { buildListingJsonLd, seoText, useSeo } from "../utils/seo";
import { createStayRequest } from "../services/stays.service";
import { getVideoEmbedUrl } from "../utils/videoEmbed";

const formatPrice = (price, purpose) => {
  const amount = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0
  }).format(Number(price || 0));

  if (purpose === "short_stay") return `${amount}/night`;
  return purpose === "rent" ? `${amount}/mo` : amount;
};

const normalizeImage = (image) => {
  if (!image) return null;
  if (typeof image === "string") return image;
  return image.url || image.path || null;
};

const amenityLabels = {
  garden: "Garden",
  tarmacAccess: "Tarmac access",
  nearSchools: "Near schools",
  nearShoppingCentre: "Near shopping centre",
  nearHospital: "Near hospital",
  waterAvailable: "Water available",
  electricityAvailable: "Electricity available"
};

const normalizeAmenities = (amenities) => {
  if (Array.isArray(amenities)) return amenities.filter(Boolean);
  if (!amenities || typeof amenities !== "object") return [];

  return Object.entries(amenities)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([key]) => amenityLabels[key] || key);
};

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDateDays = (value, days) => {
  const date = value ? new Date(`${value}T12:00:00`) : new Date();
  date.setDate(date.getDate() + days);
  return formatDateInput(date);
};

export default function ListingDetails() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const thumbnailRefs = useRef([]);
  const [error, setError] = useState("");
  const [related, setRelated] = useState([]);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    reason: "unavailable",
    message: "",
    name: "",
    email: "",
    phone: ""
  });
  const [reportSending, setReportSending] = useState(false);
  const [reportSuccess, setReportSuccess] = useState("");
  const [reportError, setReportError] = useState("");
  const [stayForm, setStayForm] = useState({ checkIn: "", checkOut: "", guests: "1", guestName: "", guestEmail: "", guestPhone: "", message: "" });
  const [staySending, setStaySending] = useState(false);
  const [stayRequest, setStayRequest] = useState(null);
  const [stayError, setStayError] = useState("");

  const seoLocation = listing ? [listing.area, listing.town, listing.county].filter(Boolean).join(", ") : "";
  const seoTitle = listing
    ? `${listing.title} ${seoLocation ? `in ${seoLocation}` : "in Kenya"}`
    : "Property Listing";
  const seoDescription = listing
    ? seoText(`${formatPrice(listing.price, listing.purpose)}. ${listing.description || ""}`, 155)
    : "View verified RendaHomes property details, images, location, landlord contact, and related listings.";
  const seoImage = listing?.images?.map(normalizeImage).find(Boolean);

  useSeo({
    title: seoTitle,
    description: seoDescription,
    path: listing?._id ? `/listings/${listing._id}` : `/listings/${id}`,
    image: seoImage,
    type: "product",
    jsonLd: buildListingJsonLd(listing)
  });

  useEffect(() => {
    setLoading(true);
    getSingleListing(id)
      .then((data) => {
        setError("");
        setSelectedImage(0);
        setListing(data.listing || data);
      })
      .catch((err) => {
        setListing(null);
        setError(getApiErrorMessage(err, "Could not load this listing from the backend."));
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!listing) return;

    getPublicListings({
      type: listing.type || "",
      county: listing.county || "",
      purpose: listing.purpose || "",
      limit: 8
    })
      .then((data) => {
        setRelated((data.listings || []).filter((item) => item._id !== listing._id));
      })
      .catch(() => setRelated([]));
  }, [listing]);

  if (loading) {
    return (
      <>
        <main className="min-h-screen bg-[#F0F7F4]">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="aspect-[16/9] w-full rounded-2xl bg-white shadow-sm" />
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                <div className="h-8 w-2/3 rounded bg-white" />
                <div className="h-5 w-1/3 rounded bg-white" />
                <div className="h-28 rounded bg-white" />
              </div>
              <div className="h-64 rounded-2xl bg-white" />
            </div>
          </div>
        </main>
        <LoadingScreen />
      </>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-[#013E43]">{error ? "Backend request failed" : "Listing not found"}</h1>
        {error ? <p className="mt-3 text-sm text-[#065A57]">{error}</p> : null}
        <Link to={mainRoutes.listings} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#013E43] px-5 py-3 text-sm font-extrabold text-white">
          <FiArrowLeft />
          Back to listings
        </Link>
      </div>
    );
  }

  const images = (listing.images || []).map(normalizeImage).filter(Boolean);
  const hero = images[selectedImage] || null;
  const location = [listing.area, listing.town, listing.county].filter(Boolean).join(", ") || listing.location || "Location on request";
  const amenities = normalizeAmenities(listing.amenities);
  const videoEmbedUrl = getVideoEmbedUrl(listing.video);
  const landlordPhone = listing.contactPhone || listing.landlord?.phone || "";
  const isShortStay = listing.purpose === "short_stay";
  const today = formatDateInput(new Date());
  const minimumCheckOut = addDateDays(stayForm.checkIn || today, 1);
  const stayWhatsappHref = stayRequest && landlordPhone
    ? `https://wa.me/${landlordPhone.replace(/\D/g, "").replace(/^0/, "254")}?text=${encodeURIComponent(`Hi, I'd like to book ${listing.title}. Stay request ${stayRequest.requestCode}; ${stayRequest.guests} guest(s), ${new Date(stayRequest.checkIn).toLocaleDateString("en-KE")} to ${new Date(stayRequest.checkOut).toLocaleDateString("en-KE")}. My name is ${stayRequest.guestName}, phone ${stayRequest.guestPhone}. Please confirm availability and next steps.`)}`
    : "";

  const submitStayRequest = async (event) => {
    event.preventDefault();
    if (!stayForm.checkIn || stayForm.checkOut <= stayForm.checkIn) {
      setStayError("Choose check-out at least one night after check-in.");
      return;
    }
    setStaySending(true);
    setStayError("");
    try {
      const data = await createStayRequest(listing._id, stayForm);
      setStayRequest(data.request);
    } catch (error) {
      setStayError(error.response?.data?.message || "Could not send your stay request. Please try again.");
    } finally { setStaySending(false); }
  };

  const submitReport = async (event) => {
    event.preventDefault();
    setReportSending(true);
    setReportSuccess("");
    setReportError("");

    try {
      const data = await reportListing({
        listingId: listing._id,
        ...reportForm
      });

      setReportSuccess(data.message || "Report submitted. RendaHomes will review this listing.");
      setReportForm({
        reason: "unavailable",
        message: "",
        name: "",
        email: "",
        phone: ""
      });
    } catch (error) {
      setReportError(error.response?.data?.message || "Could not submit this report. Please try again.");
    } finally {
      setReportSending(false);
    }
  };

  return (
    <div className="bg-[#F0F7F4]">
      <section className="border-b border-[#A8D8C1] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <Link to={mainRoutes.listings} className="mb-4 inline-flex items-center gap-2 text-sm font-extrabold text-[#065A57] hover:text-[#013E43] sm:mb-5">
            <FiArrowLeft />
            Back to listings
          </Link>

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-7">
            <div className="min-w-0">
              <div className="overflow-hidden rounded-xl bg-slate-100">
                {hero ? (
                  <img src={hero} alt={listing.title} fetchPriority="high" className="aspect-[16/10] w-full object-cover sm:aspect-[16/9]" />
                ) : (
                  <div className="flex aspect-[16/10] items-center justify-center text-sm font-bold text-[#065A57] sm:aspect-[16/9]">Image coming soon</div>
                )}
              </div>

              {images.length > 1 ? (
                <div className="mt-3 overflow-hidden">
                  <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-smooth px-0.5 pb-2" aria-label="Listing photos">
                    {images.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        ref={(element) => { thumbnailRefs.current[index] = element; }}
                        onClick={() => {
                          setSelectedImage(index);
                          thumbnailRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                        }}
                        aria-label={`Show photo ${index + 1} of ${images.length}`}
                        aria-pressed={selectedImage === index}
                        className={`w-20 shrink-0 snap-start overflow-hidden rounded-lg border-2 bg-white transition sm:w-24 ${
                          selectedImage === index ? "border-[#013E43]" : "border-transparent hover:border-[#02BB31]"
                        }`}
                      >
                        <img src={image} alt="" className="aspect-square w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {videoEmbedUrl ? (
                <section className="mt-4 rounded-xl border border-[#DCEBE3] bg-white p-4 sm:mt-5 sm:p-6" aria-labelledby="virtual-tour-heading">
                  <h2 id="virtual-tour-heading" className="text-lg font-extrabold text-[#013E43]">Virtual tour</h2>
                  <div className="mt-3 aspect-video overflow-hidden rounded-lg bg-[#F0F7F4]">
                    <iframe
                      src={videoEmbedUrl}
                      title={`Virtual tour of ${listing.title}`}
                      className="h-full w-full"
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </section>
              ) : null}

              <article className="mt-3 rounded-xl border border-[#DCEBE3] bg-white p-4 sm:mt-4 sm:p-6">
                <p className="text-sm font-extrabold uppercase text-[#02BB31]">Description</p>
                <div className="mt-3 whitespace-pre-line text-sm leading-7 text-[#065A57]">
                  {listing.description || "No description has been added for this listing yet."}
                </div>
              </article>
            </div>

            <aside className="h-fit rounded-xl border border-[#A8D8C1] bg-white p-4 sm:p-6 lg:sticky lg:top-28">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#F0F7F4] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-[#013E43]">
                  {isShortStay ? "BnB" : listing.purpose || "rent"}
                </span>
                <span className="rounded-full bg-[#F0F7F4] px-3 py-1 text-xs font-bold capitalize text-[#02BB31]">
                  {listing.availability || "available"}
                </span>
              </div>
              <p className="mt-4 text-3xl font-extrabold text-[#013E43] sm:mt-5">
                {formatPrice(listing.price, listing.purpose)}
              </p>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#013E43]">{listing.title}</h1>
              <p className="mt-3 flex items-start gap-2 text-sm font-semibold leading-6 text-[#065A57]">
                <FiMapPin className="mt-1 shrink-0 text-[#02BB31]" />
                {location}
              </p>
              {listing.googleMapsUrl && <a href={listing.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#087443] underline underline-offset-2">Open in Google Maps</a>}
              {Number(listing.totalUnits) > 1 && <p className="mt-3 border-l-2 border-[#02BB31] bg-[#F0F7F4] px-3 py-2 text-sm font-semibold text-[#065A57]">{listing.portfolioName ? `${listing.portfolioName} · ` : ""}{listing.portfolioCategory || "Units"}: {listing.availableUnits ?? listing.totalUnits} of {listing.totalUnits} available</p>}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Fact icon={<FaBed />} label="Bedrooms" value={listing.bedrooms ?? "N/A"} />
                <Fact icon={<FaBath />} label="Bathrooms" value={listing.bathrooms ?? "N/A"} />
                <Fact icon={<FaRulerCombined />} label="Size" value={listing.size ? `${listing.size} ${listing.sizeUnit || ""}` : "N/A"} />
                <Fact label="Type" value={listing.type || "N/A"} />
                {isShortStay && <Fact icon={<FiUsers />} label="Guests" value={listing.maxGuests || "Ask host"} />}
              </div>
              {isShortStay && <p className="mt-3 text-xs leading-5 text-[#52716A]">Minimum stay: {listing.minNights || 1} night(s) · Check-in from {listing.checkInTime || "15:00"} · Check-out by {listing.checkOutTime || "10:00"}</p>}

              {isShortStay && (
                <div className="mt-6 border-t border-[#DCEBE3] pt-5">
                  <h2 className="text-lg font-bold text-[#013E43]">Request these dates</h2>
                  <p className="mt-1 text-xs leading-5 text-[#52716A]">Your request is not a confirmed reservation. The host will confirm availability.</p>
                  {stayRequest ? (
                    <div className="mt-4 rounded-xl bg-[#F0F7F4] p-4">
                      <p className="text-sm font-bold text-[#013E43]">Request received · {stayRequest.requestCode}</p>
                      <p className="mt-1 text-xs text-[#52716A]">Contact the host on WhatsApp to confirm the stay.</p>
                      {stayWhatsappHref && <a href={stayWhatsappHref} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-[#128C4A] px-4 py-3 text-sm font-bold text-white"><FaWhatsapp />Confirm on WhatsApp</a>}
                    </div>
                  ) : (
                    <form onSubmit={submitStayRequest} className="mt-4 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block min-w-0 text-xs font-semibold text-[#36564D]">Check-in date<input required type="date" min={today} value={stayForm.checkIn} onChange={(e) => setStayForm((current) => ({ ...current, checkIn: e.target.value, checkOut: current.checkOut <= e.target.value ? "" : current.checkOut }))} className="mt-1.5 h-11 w-full min-w-0 rounded-lg border border-[#C6D9CE] bg-white px-2 text-sm text-[#173F37]" /></label>
                        <label className="block min-w-0 text-xs font-semibold text-[#36564D]">Check-out date<input required type="date" min={minimumCheckOut} value={stayForm.checkOut} onChange={(e) => setStayForm((current) => ({ ...current, checkOut: e.target.value }))} className="mt-1.5 h-11 w-full min-w-0 rounded-lg border border-[#C6D9CE] bg-white px-2 text-sm text-[#173F37]" /></label>
                      </div>
                      <label className="block text-xs font-semibold text-[#36564D]">Guests<input required type="number" min="1" max={listing.maxGuests || undefined} value={stayForm.guests} onChange={(e) => setStayForm({ ...stayForm, guests: e.target.value })} className="mt-1 w-full rounded-lg border border-[#C6D9CE] px-3 py-2 text-sm text-[#173F37]" /></label>
                      <input required placeholder="Your name" value={stayForm.guestName} onChange={(e) => setStayForm({ ...stayForm, guestName: e.target.value })} className="w-full rounded-lg border border-[#C6D9CE] px-3 py-2.5 text-sm text-[#173F37]" />
                      <input required type="email" placeholder="Email address" value={stayForm.guestEmail} onChange={(e) => setStayForm({ ...stayForm, guestEmail: e.target.value })} className="w-full rounded-lg border border-[#C6D9CE] px-3 py-2.5 text-sm text-[#173F37]" />
                      <input required type="tel" placeholder="Phone number" value={stayForm.guestPhone} onChange={(e) => setStayForm({ ...stayForm, guestPhone: e.target.value })} className="w-full rounded-lg border border-[#C6D9CE] px-3 py-2.5 text-sm text-[#173F37]" />
                      <textarea rows="2" placeholder="Message to the host (optional)" value={stayForm.message} onChange={(e) => setStayForm({ ...stayForm, message: e.target.value })} className="w-full resize-y rounded-lg border border-[#C6D9CE] px-3 py-2.5 text-sm text-[#173F37]" />
                      {stayError && <p role="alert" className="text-sm text-rose-700">{stayError}</p>}
                      <button disabled={staySending} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#013E43] px-4 py-3 text-sm font-bold text-white hover:bg-[#005C57] disabled:opacity-60"><FiCalendar />{staySending ? "Sending request…" : "Book your stay"}</button>
                    </form>
                  )}
                </div>
              )}

              {isShortStay ? null : landlordPhone ? (
                <a
                  href={`tel:${landlordPhone}`}
                  className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-[#02BB31] px-5 py-4 text-sm font-extrabold text-[#FFFFFF] transition hover:bg-[#0D915C]"
                >
                  <FiPhone />
                  Call landlord
                </a>
              ) : (
                <a
                  href={portalLinks.user.href}
                  title={portalLinks.user.purpose}
                  className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-[#013E43] px-5 py-4 text-sm font-extrabold text-white"
                >
                  Ask through user portal
                </a>
              )}

              {!isShortStay && <button
                type="button"
                onClick={() => setInquiryOpen(true)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#013E43] px-5 py-4 text-sm font-extrabold text-white transition hover:bg-[#005C57]"
              >
                <FiMail />
                Send inquiry
              </button>}

              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(window.location.href)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#A8D8C1] bg-white px-5 py-4 text-sm font-extrabold text-[#013E43]"
              >
                <FiShare2 />
                Copy listing link
              </button>

              <button
                type="button"
                onClick={() => {
                  setReportOpen(true);
                  setReportSuccess("");
                  setReportError("");
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold text-[#9A3B1F] transition hover:bg-[#F8E5DE]"
              >
                <FiAlertTriangle />
                Report listing
              </button>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-7 pt-5 sm:px-6 sm:pb-9 sm:pt-7 lg:grid-cols-2 lg:gap-6 lg:px-8">
        <TrustPromise trust={listing.trust} lastCheckedAt={listing.updatedAt} />

        <aside className="rounded-xl border border-[#DDEBE4] bg-white p-4 sm:p-5">
            <p className="text-sm font-extrabold uppercase text-[#02BB31]">Amenities</p>
            {amenities.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {amenities.map((amenity) => (
                  <span key={amenity} className="rounded-full bg-[#F0F7F4] px-3 py-2 text-xs font-bold text-[#065A57]">
                    {amenity}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[#065A57]">Amenities have not been listed yet.</p>
            )}
        </aside>
      </section>

      {inquiryOpen && !isShortStay ? (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#013E43]/70 px-4 py-6 backdrop-blur-sm sm:py-10">
          <div className="mx-auto max-w-xl">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setInquiryOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#013E43] shadow-lg transition hover:bg-[#F0F7F4]"
                aria-label="Close inquiry form"
              >
                <FiX />
              </button>
            </div>
            <ListingInquiryCard listing={listing} />
          </div>
        </div>
      ) : null}

      {reportOpen ? (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#013E43]/70 px-4 py-6 backdrop-blur-sm sm:py-10">
          <div className="mx-auto max-w-xl">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#013E43] shadow-lg transition hover:bg-[#F0F7F4]"
                aria-label="Close report form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={submitReport} className="rounded-3xl bg-white p-6 shadow-2xl">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#9A3B1F]">Report listing</p>
              <h2 className="mt-2 text-2xl font-extrabold text-[#013E43]">Help us keep RendaHomes accurate.</h2>
              <p className="mt-2 text-sm leading-6 text-[#065A57]">
                Tell us if this property is unavailable, misleading, or difficult to verify. Admin will review the listing.
              </p>

              {reportSuccess ? (
                <div className="mt-5 rounded-2xl bg-[#E9F8EF] p-4 text-sm font-bold text-[#137A38]">{reportSuccess}</div>
              ) : null}
              {reportError ? (
                <div className="mt-5 rounded-2xl bg-[#F8E5DE] p-4 text-sm font-bold text-[#9A3B1F]">{reportError}</div>
              ) : null}

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#013E43]">What is wrong?</span>
                  <select
                    value={reportForm.reason}
                    onChange={(event) => setReportForm((prev) => ({ ...prev, reason: event.target.value }))}
                    className="w-full rounded-2xl border border-[#A8D8C1] bg-white px-4 py-3 text-sm font-semibold text-[#013E43] outline-none focus:border-[#02BB31]"
                  >
                    <option value="unavailable">Property is unavailable</option>
                    <option value="wrong_price">Price is wrong</option>
                    <option value="wrong_location">Location is wrong</option>
                    <option value="fake_photos">Photos look fake or misleading</option>
                    <option value="landlord_unreachable">Landlord is unreachable</option>
                    <option value="agent_issue">Agent or contact issue</option>
                    <option value="other">Other issue</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#013E43]">Details</span>
                  <textarea
                    value={reportForm.message}
                    onChange={(event) => setReportForm((prev) => ({ ...prev, message: event.target.value }))}
                    rows="4"
                    placeholder="Example: I called and was told the house was taken, or the price is different..."
                    className="w-full rounded-2xl border border-[#A8D8C1] px-4 py-3 text-sm font-semibold text-[#013E43] outline-none focus:border-[#02BB31]"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-3">
                  <ReportInput label="Name" value={reportForm.name} onChange={(value) => setReportForm((prev) => ({ ...prev, name: value }))} />
                  <ReportInput label="Email" type="email" value={reportForm.email} onChange={(value) => setReportForm((prev) => ({ ...prev, email: value }))} />
                  <ReportInput label="Phone" value={reportForm.phone} onChange={(value) => setReportForm((prev) => ({ ...prev, phone: value }))} />
                </div>
              </div>

              <button
                type="submit"
                disabled={reportSending}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#013E43] px-5 py-4 text-sm font-extrabold text-white transition hover:bg-[#005C57] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <FiAlertTriangle />
                {reportSending ? "Submitting report..." : "Submit report"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <ListingRail
        title="Related listings"
        eyebrow="Similar homes nearby"
        listings={related}
        viewAllTo={`/listings?type=${encodeURIComponent(listing.type || "")}&county=${encodeURIComponent(listing.county || "")}&purpose=${encodeURIComponent(listing.purpose || "")}`}
        emptyText="No related listings are available yet."
      />
    </div>
  );
}

function ReportInput({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-[#065A57]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[#A8D8C1] px-3 py-2.5 text-sm font-semibold text-[#013E43] outline-none focus:border-[#02BB31]"
      />
    </label>
  );
}

function Fact({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-[#F0F7F4] p-4">
      <div className="flex h-5 items-center gap-2 text-[#02BB31]">{icon}</div>
      <p className="mt-2 text-xs font-bold text-[#065A57]">{label}</p>
      <p className="mt-1 text-sm font-extrabold capitalize text-[#013E43]">{value}</p>
    </div>
  );
}
