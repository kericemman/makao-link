import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getSingleListing } from "../../../services/listings.service";
import { sendInquiry } from "../../../services/inquiry.service";
import { 
  FiMapPin, 
  FiDollarSign, 
  FiUser, 
  FiMail, 
  FiPhone,
  FiMessageSquare,
  FiCheckCircle,
  FiAlertCircle,
  FiCamera,
  FiHome,
  FiArrowLeft,
  FiHeart,
  FiShare2,
  FiPrinter,
  FiCalendar,
  FiClock,
  FiTag,
  FiXCircle,
  FiPhoneCall,
  FiMail as FiMailIcon
} from "react-icons/fi";
import { FaBed, FaBath, FaBuilding, FaWhatsapp, FaHome as FaHomeIcon, FaPhoneAlt } from "react-icons/fa";
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
        setError(err.response?.data?.message || "Failed to load listing");
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

  const handleInquiry = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    try {
      setSuccess("");
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
      setError(err.response?.data?.message || "Failed to send inquiry");
      toast.error("Failed to send inquiry", {
        style: { background: "#013E43", color: "#fff" }
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

  // Helper function to get image URL - handles both string and object formats
  const getImageUrl = (image) => {
    if (!image) return null;
    if (typeof image === 'object' && image.url) return image.url;
    if (typeof image === 'string') return image;
    return null;
  };

  // Generate WhatsApp message with property details
  const getWhatsAppMessage = () => {
    const message = `*RendaHomes Property Inquiry*

🏠 *Property:* ${listing.title}
📍 *Location:* ${listing.location}
💰 *Price:* ${formatPrice(listing.price)}/month
🛏️ *Bedrooms:* ${listing.bedrooms}
🛁 *Bathrooms:* ${listing.bathrooms}
🏷️ *Type:* ${listing.type}

👤 *Inquiry from:* ${formData.name || "Potential Tenant"}
📧 *Email:* ${formData.email || "Not provided"}
📱 *Phone:* ${formData.phone || "Not provided"}

📝 *Message:* 
${formData.message || "I'm interested in this property. Please get in touch."}

--
Sent via RendaHomes Property Platform
View listing: ${window.location.href}`;

    return encodeURIComponent(message);
  };

  const getWhatsAppLink = () => {
    const phoneNumber = listing.contactPhone?.replace(/^0/, "254") || "254712345678";
    const message = getWhatsAppMessage();
    return `https://wa.me/${phoneNumber}?text=${message}`;
  };

  const handleWhatsAppClick = (e) => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      e.preventDefault();
      toast.error("Please fill in your name, email, and message before contacting via WhatsApp", {
        style: { background: "#013E43", color: "#fff" },
        duration: 4000
      });
      return false;
    }
    window.open(getWhatsAppLink(), "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="max-w-9xl mx-auto px-4 py-10 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-12 border border-[#A8D8C1]">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="text-3xl text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#013E43] mb-2">Property Not Found</h2>
          <p className="text-[#065A57] mb-6">{error}</p>
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            <FiArrowLeft />
            Browse Other Properties
          </Link>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const activeAmenities = Object.entries(listing.amenities || {}).filter(
    ([, value]) => value === true
  );

  // Process images - handle both formats
  const rawImages = listing.images?.length ? listing.images : [null];
  const images = rawImages.map(img => getImageUrl(img));
  const mainImage = images[selectedImage];

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      {/* Back Navigation */}
      <div className="bg-white border-b border-[#A8D8C1] sticky top-0 z-10">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/properties"
            className="inline-flex items-center text-[#065A57] hover:text-[#013E43] transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Properties
          </Link>
        </div>
      </div>

      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Left Column - Images & Details */}
          <div>
            {/* Main Image */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#013E43] to-[#005C57]">
              <div className="aspect-video">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={listing.title}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                    onClick={() => setShowFullImage(true)}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                    }}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-white">
                    <FiHome className="text-6xl text-white/50 mb-4" />
                    <p className="text-sm text-white/50">No image available</p>
                  </div>
                )}
              </div>

              {/* Favorite Button */}
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="absolute top-4 right-4 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-sm transition-all hover:scale-110"
              >
                <FiHeart 
                  className={`text-xl transition-colors ${
                    isFavorite ? "fill-red-500 text-red-500" : "text-[#065A57]"
                  }`} 
                />
              </button>
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && images.some(img => img !== null) && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {images.map((img, index) => (
                  img && (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative overflow-hidden rounded-lg aspect-square ${
                        selectedImage === index ? 'ring-2 ring-[#02BB31]' : ''
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </button>
                  )
                ))}
              </div>
            )}

            {/* Property Title & Info */}
            <div className="mt-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-[#013E43]">{listing.title}</h1>
                  <p className="mt-2 flex items-center text-[#065A57]">
                    <FiMapPin className="mr-2 text-[#02BB31]" />
                    {listing.location}
                  </p>
                </div>
                <p className="text-xl font-bold text-[#02BB31]">
                  {formatPrice(listing.price)}
                  <span className="text-sm text-[#065A57] font-normal ml-1">/month</span>
                </p>
              </div>
            </div>

            {/* Property Features */}
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F0F7F4] px-4 py-2 text-sm text-[#013E43]">
                <FaBuilding className="text-[#02BB31]" />
                {listing.type}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F0F7F4] px-4 py-2 text-sm text-[#013E43]">
                <FaBed className="text-[#02BB31]" />
                {listing.bedrooms} {listing.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F0F7F4] px-4 py-2 text-sm text-[#013E43]">
                <FaBath className="text-[#02BB31]" />
                {listing.bathrooms} {listing.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F0F7F4] px-4 py-2 text-sm text-[#013E43]">
                <FaHomeIcon className="text-[#02BB31]" />
                {listing.kitchen ? "Kitchen Available" : "No Kitchen"}
              </span>
            </div>

            {/* Description */}
            <div className="mt-8 rounded-2xl bg-white p-6 border border-[#A8D8C1]">
              <h2 className="text-xl font-bold text-[#013E43]">About this property</h2>
              <p className="mt-4 leading-relaxed text-[#065A57]">{listing.description}</p>
            </div>

            {/* Amenities */}
            <div className="mt-6 rounded-2xl bg-white p-6 border border-[#A8D8C1]">
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

          {/* Right Column - Contact Form & Details */}
          <div>
            {/* Landlord Info Card */}
            <div className="rounded-2xl bg-white p-6 border border-[#A8D8C1] shadow-lg mb-6">
              <h3 className="text-lg font-bold text-[#013E43] mb-4 flex items-center">
                <FiUser className="mr-2 text-[#02BB31]" />
                Landlord Information
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-[#013E43]">{listing.landlord?.name || "Property Owner"}</p>
                  <p className="text-sm text-[#065A57]">Verified Landlord</p>
                </div>
                <button
                  onClick={() => setShowPhone(!showPhone)}
                  className="px-4 py-2 bg-[#013E43] text-white rounded-lg hover:bg-[#005C57] transition-colors flex items-center gap-2"
                >
                  <FiPhoneCall />
                  <span>{showPhone ? "Hide Phone" : "Show Phone"}</span>
                </button>
              </div>
              
              {showPhone && (
                <div className="mt-4 p-3 bg-[#F0F7F4] rounded-lg border border-[#A8D8C1]">
                  <p className="text-sm text-[#065A57] mb-2">Contact Number:</p>
                  <a 
                    href={`tel:${listing.contactPhone || listing.landlord?.phone}`}
                    className="text-lg font-semibold text-[#02BB31] hover:underline flex items-center gap-2"
                  >
                    <FaPhoneAlt />
                    {listing.contactPhone || listing.landlord?.phone || "Not provided"}
                  </a>
                </div>
              )}
            </div>

            {/* Contact Form */}
            <div className="sticky top-24 rounded-2xl bg-white p-6 border border-[#A8D8C1] shadow-lg">
              <h2 className="text-xl font-bold text-[#013E43]">Contact Landlord</h2>
              <p className="mt-2 text-sm text-[#065A57]">
                Send an inquiry and the landlord will receive your message directly.
              </p>

              <form onSubmit={handleInquiry} className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                    <input
                      type="email"
                      name="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="e.g., 0712345678"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
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
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors resize-none"
                      required
                    />
                  </div>
                </div>

                {success && (
                  <div className="bg-[#02BB31]/10 p-3 rounded-lg text-sm text-[#02BB31] flex items-center gap-2">
                    <FiCheckCircle />
                    {success}
                  </div>
                )}
                {error && (
                  <div className="bg-red-50 p-3 rounded-lg text-sm text-red-600 flex items-center gap-2">
                    <FiAlertCircle />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-[1.02]"
                >
                  Send Inquiry
                </button>
              </form>

              {/* WhatsApp Alternative */}
              <div className="mt-4 pt-4 border-t border-[#A8D8C1]">
                <p className="text-xs text-[#065A57] text-center mb-3">Or contact via WhatsApp</p>
                <button
                  onClick={handleWhatsAppClick}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white rounded-lg text-sm font-medium hover:bg-[#128C7E] transition-colors"
                >
                  <FaWhatsapp className="text-lg" />
                  <span>Send WhatsApp Message</span>
                </button>
                <p className="text-xs text-[#065A57] text-center mt-2">
                  Your name, email, and message will be included in the WhatsApp message
                </p>
              </div>
            </div>

            {/* Quick Details */}
            <div className="mt-6 rounded-2xl bg-white p-6 border border-[#A8D8C1]">
              <h3 className="text-lg font-bold text-[#013E43]">Quick Details</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#065A57]">Location</span>
                  <span className="font-medium text-[#013E43]">{listing.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#065A57]">Property Type</span>
                  <span className="font-medium text-[#013E43]">{listing.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#065A57]">Bedrooms</span>
                  <span className="font-medium text-[#013E43]">{listing.bedrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#065A57]">Bathrooms</span>
                  <span className="font-medium text-[#013E43]">{listing.bathrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#065A57]">Kitchen</span>
                  <span className="font-medium text-[#013E43]">{listing.kitchen ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#A8D8C1]">
                  <span className="text-[#065A57]">Price</span>
                  <span className="font-bold text-[#02BB31]">{formatPrice(listing.price)}/month</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Image Modal */}
      {showFullImage && mainImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-5xl w-full">
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute -top-10 right-0 text-white hover:text-[#02BB31] transition-colors"
            >
              <FiXCircle className="text-3xl" />
            </button>
            <img
              src={mainImage}
              alt={listing.title}
              className="w-full rounded-lg shadow-2xl"
              onError={(e) => {
                e.target.style.display = 'none';
                const parent = e.target.parentElement;
                const errorDiv = document.createElement('div');
                errorDiv.className = 'flex h-full items-center justify-center text-white';
                errorDiv.innerHTML = '<p>Failed to load image</p>';
                parent?.appendChild(errorDiv);
              }}
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              {selectedImage + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetailsPage;