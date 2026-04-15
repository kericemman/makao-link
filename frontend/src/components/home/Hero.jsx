import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  FiSearch, 
  FiTrendingUp, 
  FiShield, 
  FiUsers, 
  FiClock,
  FiArrowRight,
  FiCheckCircle,
  FiMapPin,
  FiDollarSign,
  FiHome,
  FiEye,
  FiHeart,
  FiCamera,
  FiStar
} from "react-icons/fi";
import { FaBuilding, FaHandshake, FaKey, FaBed, FaBath } from "react-icons/fa";
import { getPublicListings } from "../../services/listings.service";
import toast from "react-hot-toast";

// Helper function to get image URL
const getImageUrl = (image) => {
  if (!image) return null;
  if (typeof image === 'object' && image.url) return image.url;
  if (typeof image === 'string') return image;
  return null;
};

const Hero = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState({});

  // Background images for slideshow
  const backgroundImages = [
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
  ];

  useEffect(() => {
    fetchLatestListings();
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchLatestListings = async () => {
    try {
      setLoading(true);
      const response = await getPublicListings({ limit: 4, sort: "-createdAt" });
      setListings(response.listings || []);
    } catch (error) {
      toast.error("Failed to load latest listings", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleHover = (id, isHovering) => {
    setIsHovered(prev => ({ ...prev, [id]: isHovering }));
  };

  const ListingCard = ({ listing }) => {
    const firstImage = listing.images?.[0] ? getImageUrl(listing.images[0]) : null;
    const isListingHovered = isHovered[listing._id] || false;

    return (
      <Link
        to={`/properties/${listing._id}`}
        className="group block bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl overflow-hidden transition-all border border-white/10 hover:border-white/20 hover:shadow-xl"
        onMouseEnter={() => handleHover(listing._id, true)}
        onMouseLeave={() => handleHover(listing._id, false)}
      >
        {/* Property Image */}
        <div className="relative h-32 sm:h-36 md:h-40 overflow-hidden bg-gradient-to-r from-[#013E43] to-[#005C57]">
          {firstImage ? (
            <img
              src={firstImage}
              alt={listing.title}
              className={`w-full h-full object-cover transition-transform duration-500 ${
                isListingHovered ? "scale-110" : "scale-100"
              }`}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <FiHome className="text-white text-2xl sm:text-3xl opacity-50" />
            </div>
          )}
          
          {/* Featured Badge */}
          {listing.isFeatured && (
            <div className="absolute top-2 left-2">
              <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 px-2 py-0.5 text-xs font-medium text-white shadow-lg">
                <FiStar className="text-xs" />
                Featured
              </span>
            </div>
          )}
          
          {/* Price Tag */}
          <div className="absolute bottom-2 left-2">
            <div className="rounded-lg bg-[#013E43]/90 px-2 py-0.5 backdrop-blur-sm">
              <p className="text-xs sm:text-sm font-bold text-white">{formatPrice(listing.price)}</p>
            </div>
          </div>
          
          {/* Image Count Badge */}
          {listing.images?.length > 0 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
              <FiCamera className="text-[10px]" />
              <span>{listing.images.length}</span>
            </div>
          )}
        </div>

        {/* Property Details */}
        <div className="p-2 sm:p-3">
          <h3 className="font-semibold text-white text-xs sm:text-sm truncate group-hover:text-[#02BB31] transition-colors">
            {listing.title}
          </h3>
          <p className="text-[10px] sm:text-xs text-[#A8D8C1] flex items-center mt-0.5">
            <FiMapPin className="mr-0.5 text-[8px] flex-shrink-0" />
            <span className="truncate">{listing.location}</span>
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[#02BB31] font-bold text-xs sm:text-sm">
              {formatPrice(listing.price)}
            </span>
            <span className="text-[#A8D8C1] text-[8px] sm:text-xs">/month</span>
          </div>
          
        </div>
      </Link>
    );
  };

  const features = [
    "Direct landlord contact",
    "Verified properties",
    "No middlemen fees",
    "Fast response times"
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image Slideshow */}
      <div className="absolute inset-0">
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image}
              alt={`Property ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        
        {/* Multi-layer Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#013E43] via-[#013E43]/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#013E43]/80"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#013E43]/60 via-transparent to-[#013E43]/60"></div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#02BB31] rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#A8D8C1] rounded-full opacity-20 blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-7 lg:py-10 z-10">
        {/* Mobile: Latest Listings first, then Content */}
        <div className="flex flex-col-reverse lg:flex-row gap-8 lg:gap-12 xl:gap-16">
          
          {/* LEFT SIDE - Latest Listings (Shows first on mobile) */}
          <div className="w-full lg:w-1/2 space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
                <FiHome className="mr-2 text-[#02BB31] text-sm sm:text-base" />
                Latest Listings
              </h3>
              <Link
                to="/listings"
                className="text-xs sm:text-sm text-[#A8D8C1] hover:text-white transition-colors flex items-center"
              >
                View all
                <FiArrowRight className="ml-1 text-xs" />
              </Link>
            </div>

            {/* Loading State - 2 column grid */}
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden animate-pulse">
                    <div className="h-32 sm:h-36 md:h-40 bg-white/10"></div>
                    <div className="p-2 sm:p-3 space-y-2">
                      <div className="h-3 bg-white/10 rounded w-3/4"></div>
                      <div className="h-2 bg-white/10 rounded w-1/2"></div>
                      <div className="h-2 bg-white/10 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 sm:p-8 text-center border border-white/10">
                <FiHome className="text-2xl sm:text-3xl text-[#A8D8C1] mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-[#A8D8C1]">No properties available</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {listings.map((listing) => (
                  <ListingCard key={listing._id} listing={listing} />
                ))}
              </div>
            )}

            
          </div>

          {/* RIGHT SIDE - Main Content */}
          <div className="w-full lg:w-1/2 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Floating Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full">
              <FiTrendingUp className="text-[#02BB31] text-sm sm:text-base" />
              <span className="text-xs sm:text-sm font-medium">Kenya's #1 Property Platform</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-4xl xl:text-5xl font-bold leading-tight">
              <span className="text-white">Find Your Next Home</span>
              <span className="block text-[#02BB31] mt-1 sm:mt-2">Without Hustle</span>
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base md:text-lg text-[#A8D8C1] leading-relaxed">
              RendaHomes connects tenants directly with landlords. 
              Browse verified homes, schedule viewings and move 
              into your next home faster. No middlemen, no hidden fees, just a seamless renting experience.
            </p>

            {/* Features List */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 text-white">
                  <FiCheckCircle className="text-[#02BB31] text-xs sm:text-sm flex-shrink-0" />
                  <span className="text-xs sm:text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                to="/listings"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 text-sm sm:text-base"
              >
                <FiSearch className="text-sm sm:text-base" />
                <span>Browse Homes</span>
              </Link>
              
              <Link
                to="/plans"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20 text-sm sm:text-base"
              >
                <FaKey className="text-sm sm:text-base" />
                <span>List Your Property</span>
              </Link>
            </div>
            {/* Trust Badges */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <p className="text-xs text-[#A8D8C1] mb-2 sm:mb-3 flex items-center">
                <FiShield className="mr-1 text-[#02BB31] text-xs" />
                Why choose RendaHomes?
              </p>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <FaHandshake className="text-[#02BB31] text-xs sm:text-sm" />
                  <span className="text-[10px] sm:text-xs text-white">Direct contact</span>
                </div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <FaBuilding className="text-[#02BB31] text-xs sm:text-sm" />
                  <span className="text-[10px] sm:text-xs text-white">Verified listings</span>
                </div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <FiClock className="text-[#02BB31] text-xs sm:text-sm" />
                  <span className="text-[10px] sm:text-xs text-white">Quick response</span>
                </div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <FiDollarSign className="text-[#02BB31] text-xs sm:text-sm" />
                  <span className="text-[10px] sm:text-xs text-white">No hidden fees</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 8s ease-in-out infinite;
          animation-delay: 2s;
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .delay-100 {
          animation-delay: 0.1s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
        .delay-300 {
          animation-delay: 0.3s;
        }
        .delay-400 {
          animation-delay: 0.4s;
        }
        .delay-500 {
          animation-delay: 0.5s;
        }
      `}</style>
    </section>
  );
};

export default Hero;