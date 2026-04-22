import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getSingleListing } from "../../../services/listings.service";
import { sendInquiry } from "../../../services/inquiry.service";
import {
  FiMapPin,
  FiUser,
  FiMail,
  FiPhone,
  FiMessageSquare,
  FiCheckCircle,
  FiAlertCircle,
  FiHome,
  FiArrowLeft,
  FiHeart,
  FiXCircle,
  FiPhoneCall,
  FiMaximize2,
  FiTag
} from "react-icons/fi";
import {
  FaBed,
  FaBath,
  FaBuilding,
  FaWhatsapp,
  FaHome as FaHomeIcon,
  FaPhoneAlt,
  FaRulerCombined
} from "react-icons/fa";
import toast from "react-hot-toast";

const amenityLabels = {
  garden: "Garden",
  tarmacAccess: "Tarmac Access",
  nearSchools: "Near Schools",
  nearShoppingCentre: "Near Shopping Centre",
  nearHospital: "Near Hospital",
  waterAvailable: "Water Available",
  electricityAvailable: "Electricity Available"
};

const residentialTypes = [
  "apartment",
  "bedsitter",
  "maisonette",
  "studio",
  "bungalow",
  "townhouse"
];

const prettify = (value) => {
  if (!value) return "";
  return String(value)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const ListingDetailsPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const data = await getSingleListing(id);
        setListing(data.listing);
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to load listing";
        setError(msg);
        toast.error("Failed to load property details", {
          style: { background: "#013E43", color: "#fff" }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0
    }).format(price);
  };

  const getImageUrl = (image) => {
    if (!image) return null;
    if (typeof image === "object" && image.url) return image.url;
    if (typeof image === "string") return image;
    return null;
  };

  const normalizeKenyanPhone = (phone) => {
    if (!phone) return null;

    const cleaned = String(phone).replace(/\D/g, "");

    if (cleaned.startsWith("0") && cleaned.length === 10) {
      return `254${cleaned.slice(1)}`;
    }

    if (cleaned.startsWith("254") && cleaned.length === 12) {
      return cleaned;
    }

    if ((cleaned.startsWith("7") || cleaned.startsWith("1")) && cleaned.length === 9) {
      return `254${cleaned}`;
    }

    return null;
  };

  const validateInquiryFields = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Please fill in your name, email, and message", {
        style: { background: "#013E43", color: "#fff" }
      });
      return false;
    }
    return true;
  };

  const locationText = useMemo(() => {
    if (!listing) return "";
    const parts = [
      listing.area,
      listing.town ? prettify(listing.town) : "",
      listing.county ? prettify(listing.county) : ""
    ].filter(Boolean);
    return parts.join(", ");
  }, [listing]);

  const isResidential = useMemo(() => {
    return residentialTypes.includes(listing?.type);
  }, [listing]);

  const purposeLabel = useMemo(() => {
    return listing?.purpose === "sale" ? "For Sale" : "For Rent";
  }, [listing]);

  const typeLabel = useMemo(() => {
    if (!listing?.type) return "";
    return listing.type === "office" ? "Office Space" : prettify(listing.type);
  }, [listing]);

  const priceSuffix = useMemo(() => {
    return listing?.purpose === "sale" ? "" : "/month";
  }, [listing]);

  const generateWhatsAppMessage = ({ name, email, phone, message }) => {
    const lines = [
      "*RendaHomes Property Inquiry*",
      "",
      `🏠 *Property:* ${listing.title}`,
      `🎯 *Purpose:* ${purposeLabel}`,
      `🏷️ *Type:* ${typeLabel}`,
      `📍 *Location:* ${locationText || "Not specified"}`,
      `💰 *Price:* ${formatPrice(listing.price)}${priceSuffix}`
    ];

    if (isResidential) {
      lines.push(`🛏️ *Bedrooms:* ${listing.bedrooms ?? "N/A"}`);
      lines.push(`🛁 *Bathrooms:* ${listing.bathrooms ?? "N/A"}`);
    }

    if (listing.type === "office" && listing.size) {
      lines.push(`📐 *Size:* ${listing.size} ${listing.sizeUnit || "sqft"}`);
    }

    lines.push("");
    lines.push(`👤 *Inquiry from:* ${name || "Potential Client"}`);
    lines.push("");
    lines.push("*Message:*");
    lines.push(message || "I'm interested in this property. Please get in touch.");
    lines.push("");
    lines.push("--");
    lines.push("Sent via RendaHomes Property Platform");
    lines.push(`View listing: ${window.location.href}`);

    return encodeURIComponent(lines.join("\n"));
  };

  const handleWhatsAppClick = () => {
  const currentName = formData.name.trim();
  const currentEmail = formData.email.trim();
  const currentPhone = formData.phone.trim();
  const currentMessage = formData.message.trim();

  if (!currentName || !currentEmail || !currentMessage) {
    toast.error("Please fill in your name, email, and message before contacting via WhatsApp", {
      style: { background: "#013E43", color: "#fff" },
      duration: 4000
    });
    return;
  }

  const rawPhone = listing?.contactPhone || listing?.landlord?.phone;
  const landlordPhone = normalizeKenyanPhone(rawPhone);

  if (!landlordPhone) {
    toast.error("This listing does not have a valid WhatsApp/contact number.", {
      style: { background: "#013E43", color: "#fff" }
    });
    return;
  }

  const encodedMessage = generateWhatsAppMessage({
    name: currentName,
    email: currentEmail,
    phone: currentPhone,
    message: currentMessage
  });

  const whatsappUrl = `https://wa.me/${landlordPhone}?text=${encodedMessage}`;

  // More reliable than window.open in some setups
  window.location.href = whatsappUrl;
};


  const handleInquiry = async (e) => {
    e.preventDefault();

    if (!validateInquiryFields()) return;

    try {
      setSubmittingInquiry(true);
      setSuccess("");
      setError("");

      await sendInquiry({
        listingId: id,
        ...formData
      });

      setSuccess("Inquiry sent successfully!");
      toast.success("Inquiry sent successfully!", {
        style: { background: "#02BB31", color: "#fff" }
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        message: ""
      });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send inquiry";
      setError(msg);
      toast.error(msg, {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const activeAmenities = useMemo(() => {
    return Object.entries(listing?.amenities || {}).filter(([, value]) => value === true);
  }, [listing]);

  const images = useMemo(() => {
    const rawImages = listing?.images?.length ? listing.images : [null];
    return rawImages.map((img) => getImageUrl(img));
  }, [listing]);

  const mainImage = images[selectedImage] || null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#A8D8C1] border-t-[#02BB31]"></div>
          <p className="text-[#065A57]">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 text-center">
        <div className="rounded-2xl border border-[#A8D8C1] bg-white p-12 shadow-lg">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <FiAlertCircle className="text-3xl text-red-500" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-[#013E43]">Property Not Found</h2>
          <p className="mb-6 text-[#065A57]">{error}</p>
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#02BB31] to-[#0D915C] px-6 py-3 font-semibold text-white transition-all hover:shadow-lg"
          >
            <FiArrowLeft />
            Browse Other Properties
          </Link>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      <div className="sticky top-0 z-10 border-b border-[#A8D8C1] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/properties"
            className="inline-flex items-center text-[#065A57] transition-colors hover:text-[#013E43]"
          >
            <FiArrowLeft className="mr-2" />
            Back to Properties
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#013E43] to-[#005C57]">
              <div className="aspect-video">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={listing.title}
                    className="h-full w-full cursor-pointer object-cover transition-transform duration-300 hover:scale-105"
                    onClick={() => setShowFullImage(true)}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement.classList.add(
                        "flex",
                        "items-center",
                        "justify-center"
                      );
                    }}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-white">
                    <FiHome className="mb-4 text-6xl text-white/50" />
                    <p className="text-sm text-white/50">No image available</p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className="absolute right-4 top-4 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-sm transition-all hover:scale-110"
              >
                <FiHeart
                  className={`text-xl transition-colors ${
                    isFavorite ? "fill-red-500 text-red-500" : "text-[#065A57]"
                  }`}
                />
              </button>
            </div>

            {images.length > 1 && images.some(Boolean) && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {images.map(
                  (img, index) =>
                    img && (
                      <button
                        type="button"
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`relative aspect-square overflow-hidden rounded-lg ${
                          selectedImage === index ? "ring-2 ring-[#02BB31]" : ""
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                        />
                      </button>
                    )
                )}
              </div>
            )}

            <div className="mt-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#02BB31]/10 px-3 py-1 text-xs font-medium text-[#02BB31]">
                      <FiTag />
                      {purposeLabel}
                    </span>

                    {listing.availability === "taken" ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-600">
                        Taken
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                        Available
                      </span>
                    )}
                  </div>

                  <h1 className="text-xl font-bold text-[#013E43]">{listing.title}</h1>
                  <p className="mt-2 flex items-center text-[#065A57]">
                    <FiMapPin className="mr-2 text-[#02BB31]" />
                    {locationText}
                  </p>
                </div>
                <p className="text-xl font-bold text-[#02BB31]">
                  {formatPrice(listing.price)}
                  <span className="ml-1 text-sm font-normal text-[#065A57]">{priceSuffix}</span>
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F0F7F4] px-4 py-2 text-sm text-[#013E43]">
                <FaBuilding className="text-[#02BB31]" />
                {typeLabel}
              </span>

              {isResidential ? (
                <>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#F0F7F4] px-4 py-2 text-sm text-[#013E43]">
                    <FaBed className="text-[#02BB31]" />
                    {listing.bedrooms} {Number(listing.bedrooms) === 1 ? "Bedroom" : "Bedrooms"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#F0F7F4] px-4 py-2 text-sm text-[#013E43]">
                    <FaBath className="text-[#02BB31]" />
                    {listing.bathrooms} {Number(listing.bathrooms) === 1 ? "Bathroom" : "Bathrooms"}
                  </span>
                </>
              ) : null}

              {listing.type === "office" && listing.size ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#F0F7F4] px-4 py-2 text-sm text-[#013E43]">
                  <FaRulerCombined className="text-[#02BB31]" />
                  {listing.size} {listing.sizeUnit || "sqft"}
                </span>
              ) : null}

              <span className="inline-flex items-center gap-2 rounded-full bg-[#F0F7F4] px-4 py-2 text-sm text-[#013E43]">
                <FaHomeIcon className="text-[#02BB31]" />
                {listing.kitchen ? "Kitchen Available" : "No Kitchen"}
              </span>
            </div>
            <div>
            <div className="mb-6 rounded-2xl border border-[#A8D8C1] bg-white p-6 shadow-lg">
              <h3 className="mb-4 flex items-center text-lg font-bold text-[#013E43]">
                <FiUser className="mr-2 text-[#02BB31]" />
                Landlord Information
              </h3>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-[#013E43]">
                    {listing.landlord?.businessName || listing.landlord?.name || "Property Owner"}
                  </p>
                  <p className="text-sm text-[#065A57]">Verified Landlord</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPhone(!showPhone)}
                  className="flex items-center gap-2 rounded-lg bg-[#013E43] px-4 py-2 text-white transition-colors hover:bg-[#005C57]"
                >
                  <FiPhoneCall />
                  <span>{showPhone ? "Hide Phone" : "Call Landlord"}</span>
                </button>
              </div>

              {showPhone && (
                <div className="mt-4 rounded-lg border border-[#A8D8C1] bg-[#F0F7F4] p-3">
                  <p className="mb-2 text-sm text-[#065A57]">Contact Number:</p>
                  <a
                    href={`tel:${listing.contactPhone || listing.landlord?.phone || ""}`}
                    className="flex items-center gap-2 text-lg font-semibold text-[#02BB31] hover:underline"
                  >
                    <FaPhoneAlt />
                    {listing.contactPhone || listing.landlord?.phone || "Not provided"}
                  </a>
                </div>
              )}
            </div>


            <div className="mt-8 rounded-2xl border border-[#A8D8C1] bg-white p-6">
              <h2 className="text-xl font-bold text-[#013E43]">About this property</h2>
              <p className="mt-4 leading-relaxed text-[#065A57]">{listing.description}</p>
            </div>

            <div className="mt-6 rounded-2xl border border-[#A8D8C1] bg-white p-6">
              <h2 className="text-xl font-bold text-[#013E43]">Amenities</h2>
              {activeAmenities.length === 0 ? (
                <p className="mt-4 text-sm text-[#065A57]">No amenities listed.</p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-3">
                  {activeAmenities.map(([key]) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-2 rounded-full bg-[#F0F7F4] px-4 py-2 text-sm text-[#013E43]"
                    >
                      <FiCheckCircle className="text-[#02BB31]" />
                      {amenityLabels[key] || key}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          
            <div className="sticky top-24 rounded-2xl border border-[#A8D8C1] bg-white p-6 shadow-lg">
              <h2 className="text-xl font-bold text-[#013E43]">Contact Landlord</h2>
              <p className="mt-2 text-sm text-[#065A57]">
                Send an inquiry and the landlord will receive your message directly.
              </p>

              <form onSubmit={handleInquiry} className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#013E43]">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 transform text-[#0D915C]" />
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full rounded-lg border-2 border-[#A8D8C1] py-3 pl-10 pr-4 outline-none transition-colors focus:border-[#02BB31]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#013E43]">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 transform text-[#0D915C]" />
                    <input
                      type="email"
                      name="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full rounded-lg border-2 border-[#A8D8C1] py-3 pl-10 pr-4 outline-none transition-colors focus:border-[#02BB31]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#013E43]">
                    Phone Number
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 transform text-[#0D915C]" />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="e.g., 0712345678"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full rounded-lg border-2 border-[#A8D8C1] py-3 pl-10 pr-4 outline-none transition-colors focus:border-[#02BB31]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#013E43]">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiMessageSquare className="absolute left-3 top-3 text-[#0D915C]" />
                    <textarea
                      name="message"
                      rows="4"
                      placeholder="I am interested in this property..."
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full resize-none rounded-lg border-2 border-[#A8D8C1] py-3 pl-10 pr-4 outline-none transition-colors focus:border-[#02BB31]"
                      required
                    />
                  </div>
                </div>

                {success && (
                  <div className="flex items-center gap-2 rounded-lg bg-[#02BB31]/10 p-3 text-sm text-[#02BB31]">
                    <FiCheckCircle />
                    {success}
                  </div>
                )}

                {error && listing && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    <FiAlertCircle />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingInquiry}
                  className="w-full transform rounded-lg bg-gradient-to-r from-[#02BB31] to-[#0D915C] py-3 font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-60"
                >
                  {submittingInquiry ? "Sending..." : "Send Inquiry"}
                </button>
              </form>

              <div className="mt-4 border-t border-[#A8D8C1] pt-4">
                <p className="mb-3 text-center text-xs text-[#065A57]">
                  Or contact via WhatsApp
                </p>
                <a
                    href={`https://wa.me/${normalizeKenyanPhone(listing?.contactPhone || listing?.landlord?.phone)}?text=${generateWhatsAppMessage({
                      name: formData.name.trim() || "Interested Client",
                      email: formData.email.trim() || "Not provided",
                      phone: formData.phone.trim() || "Not provided",
                      message: formData.message.trim() || "I am interested in this property."
                    })}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#128C7E]"
                  >
                    <FaWhatsapp className="text-lg" />
                    <span>Send WhatsApp Message</span>
                  </a>
                <p className="mt-2 text-center text-xs text-[#065A57]">
                  Your name, email, and message will be included in the WhatsApp message
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#A8D8C1] bg-white p-6">
              <h3 className="text-lg font-bold text-[#013E43]">Quick Details</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#065A57]">Purpose</span>
                  <span className="font-medium text-[#013E43]">{purposeLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#065A57]">Location</span>
                  <span className="font-medium text-[#013E43]">{locationText}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#065A57]">Property Type</span>
                  <span className="font-medium text-[#013E43]">{typeLabel}</span>
                </div>

                {isResidential ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-[#065A57]">Bedrooms</span>
                      <span className="font-medium text-[#013E43]">{listing.bedrooms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#065A57]">Bathrooms</span>
                      <span className="font-medium text-[#013E43]">{listing.bathrooms}</span>
                    </div>
                  </>
                ) : null}

                {listing.type === "office" && listing.size ? (
                  <div className="flex justify-between">
                    <span className="text-[#065A57]">Size</span>
                    <span className="font-medium text-[#013E43]">
                      {listing.size} {listing.sizeUnit || "sqft"}
                    </span>
                  </div>
                ) : null}

                <div className="flex justify-between">
                  <span className="text-[#065A57]">Kitchen</span>
                  <span className="font-medium text-[#013E43]">
                    {listing.kitchen ? "Yes" : "No"}
                  </span>
                </div>

                <div className="flex justify-between border-t border-[#A8D8C1] pt-2">
                  <span className="text-[#065A57]">Price</span>
                  <span className="font-bold text-[#02BB31]">
                    {formatPrice(listing.price)}{priceSuffix}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFullImage && mainImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
          <div className="relative w-full max-w-5xl">
            <button
              type="button"
              onClick={() => setShowFullImage(false)}
              className="absolute -top-10 right-0 text-white transition-colors hover:text-[#02BB31]"
            >
              <FiXCircle className="text-3xl" />
            </button>

            <img
              src={mainImage}
              alt={listing.title}
              className="w-full rounded-lg shadow-2xl"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                const errorDiv = document.createElement("div");
                errorDiv.className = "flex h-full items-center justify-center text-white";
                errorDiv.innerHTML = "<p>Failed to load image</p>";
                parent?.appendChild(errorDiv);
              }}
            />

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform rounded-full bg-black/50 px-4 py-2 text-sm text-white">
              {selectedImage + 1} / {images.filter(Boolean).length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetailsPage;