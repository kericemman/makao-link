import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPartnersByCategory } from "../../../services/service.service";
import { 
  FiTruck, 
  FiMapPin, 
  FiUser, 
  FiPhone, 
  FiMail,
  FiGlobe,
  FiArrowLeft,
  FiStar,
  FiCheckCircle,
  FiClock,
  FiShield,
  FiMessageSquare,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiEye
} from "react-icons/fi";
import { FaWhatsapp, FaBuilding, FaHandshake, FaToolbox, FaChair, FaIntercom, FaSquarespace } from "react-icons/fa";
import { MdCleaningServices } from "react-icons/md";
import toast from "react-hot-toast";

const categoryTitles = {
  movers: "Moving Services",
  cleaning: "Cleaning Companies",
  handyman: "Handyman & Repair Services",
  furniture: "Furniture & Appliances",
  internet: "Internet & WiFi Providers", 
 
};

const categoryIcons = {
  movers: FiTruck,
  cleaning: MdCleaningServices,
  handyman: FaToolbox,
  furniture: FaChair,
  internet: FaIntercom,
 
};

const categoryImages = {
  movers: "/assets/moving.jpg",
  cleaning: "https://res.cloudinary.com/dhlz0p70t/image/upload/v1775806311/hands-holding-cleaning-tools-solutions_1_xw0sgd.jpg",
  handyman: "https://res.cloudinary.com/dhlz0p70t/image/upload/v1775806028/37691_ugndsp.jpg",
  furniture: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  internet: "https://res.cloudinary.com/dhlz0p70t/image/upload/v1775805841/wifi-internet-wireless-connection-communication-technology-graphic_r2njne.jpg",
  office: ""
};

const categoryColors = {
  movers: "from-[#013E43] to-[#005C57]",
  cleaning: "from-[#02BB31] to-[#0D915C]",
  handyman: "from-purple-400 to-purple-500",
  furniture: "from-blue-400 to-blue-500",
  internet: "from-orange-400 to-orange-500"
};

const ServiceCategoryPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const { category } = useParams();
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [error, setError] = useState("");

  const categoryTitle = useMemo(() => {
    return categoryTitles[category] || "Service Partners";
  }, [category]);

  const CategoryIcon = categoryIcons[category] || FaBuilding;
  const colorClass = categoryColors[category] || "from-gray-400 to-gray-500";
  const categoryBgImage = categoryImages[category] || categoryImages.movers;

  const fetchPartners = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getPartnersByCategory(category);
      setPartners(data.partners || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load partners");
      toast.error("Failed to load service partners", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [category]);

  useEffect(() => {
    filterPartners();
  }, [partners, searchTerm, locationFilter]);

  const filterPartners = () => {
    let filtered = [...partners];

    if (searchTerm) {
      filtered = filtered.filter(partner => 
        partner.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter(partner => partner.location === locationFilter);
    }

    setFilteredPartners(filtered);
  };

  const getUniqueLocations = () => {
    const locations = partners.map(p => p.location).filter(Boolean);
    return [...new Set(locations)];
  };

  const formatPhoneForWhatsApp = (phone) => {
    return phone?.replace(/^0/, "254");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading service partners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      {/* Hero Section with Background Image */}
      <div className="relative bg-gradient-to-r from-[#013E43] to-[#005C57] text-white overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={categoryBgImage}
            alt={categoryTitle}
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#013E43]/95 to-[#005C57]/95"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-4 mb-6">
            <Link
              to="/services"
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
            >
              <FiArrowLeft className="text-xl" />
            </Link>
            {/* <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <CategoryIcon className="text-xl text-[#02BB31]" />
            </div> */}
            <div>
              <h1 className="text-xl md:text-4xl font-bold">{categoryTitle}</h1>
              <p className="text-sm text-[#A8D8C1] mt-1">
                Browse approved service partners and contact the one that fits your needs
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-4 border border-[#A8D8C1] mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#065A57]" />
              <input
                type="text"
                placeholder="Search by company name, description, or contact person..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] focus:border-transparent"
              />
            </div>

            {getUniqueLocations().length > 0 && (
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
              >
                <option value="all">All Locations</option>
                {getUniqueLocations().map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            )}
          </div>

          <div className="mt-4 text-sm text-[#065A57]">
            Showing {filteredPartners.length} of {partners.length} partners
          </div>
        </div>

        {error && (
          <div className="bg-red-50 rounded-xl p-4 mb-6 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        {filteredPartners.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
            <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
              <CategoryIcon className="text-3xl text-[#A8D8C1]" />
            </div>
            <h2 className="text-lg font-semibold text-[#013E43] mb-2">No partners available</h2>
            <p className="text-sm text-[#065A57] mb-4">
              {searchTerm || locationFilter !== "all"
                ? "Try adjusting your search or filters"
                : "We do not have any approved partners in this category yet."}
            </p>
            {(searchTerm || locationFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setLocationFilter("all");
                }}
                className="px-4 py-2 bg-[#02BB31] text-white rounded-lg hover:bg-[#0D915C] transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPartners.map((partner) => (
              <div
                key={partner._id}
                className="group bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                {/* <div className={`h-1.5 bg-gradient-to-r ${colorClass}`}></div> */}
                
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-[#013E43] group-hover:text-[#02BB31] transition-colors">
                        {partner.companyName}
                      </h2>
                      <p className="text-sm text-[#065A57] flex items-center mt-1">
                        <FiMapPin className="mr-1 text-[#02BB31] text-xs" />
                        {partner.location || "Location not specified"}
                      </p>
                    </div>
                    {partner.logo ? (
                      <img
                        src={partner.logo}
                        alt={partner.companyName}
                        className="h-16 w-16 rounded-xl border border-[#A8D8C1] object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-gradient-to-r from-[#013E43] to-[#005C57] flex items-center justify-center">
                        <FaBuilding className="text-white text-2xl" />
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-[#065A57] leading-relaxed mb-4 line-clamp-3">
                    {partner.description}
                  </p>

                  <div className="space-y-2 text-sm mb-4">
                    <p className="flex items-center text-[#065A57]">
                      <FiUser className="mr-2 text-[#02BB31] text-xs w-4" />
                      <span className="font-medium">Contact:</span>
                      <span className="ml-2">{partner.contactPerson}</span>
                    </p>
                    <p className="flex items-center text-[#065A57]">
                      <FiPhone className="mr-2 text-[#02BB31] text-xs w-4" />
                      <span className="font-medium">Phone:</span>
                      <span className="ml-2">{partner.phone}</span>
                    </p>
                    <p className="flex items-center text-[#065A57]">
                      <FiMail className="mr-2 text-[#02BB31] text-xs w-4" />
                      <span className="font-medium">Email:</span>
                      <span className="ml-2 break-all">{partner.email}</span>
                    </p>
                    {partner.website && (
                      <p className="flex items-center text-[#065A57]">
                        <FiGlobe className="mr-2 text-[#02BB31] text-xs w-4" />
                        <span className="font-medium">Website:</span>
                        <a
                          href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-[#02BB31] hover:underline break-all"
                        >
                          {partner.website.replace(/^https?:\/\//, '')}
                        </a>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#A8D8C1]">
                    <a
                      href={`tel:${partner.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#013E43] text-white rounded-lg text-sm font-medium hover:bg-[#005C57] transition-colors"
                    >
                      <FiPhone className="text-xs" />
                      Call
                    </a>
                    {partner.phone && (
                      <a
                        href={`https://wa.me/${formatPhoneForWhatsApp(partner.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#25D366] text-white rounded-lg text-sm font-medium hover:bg-[#128C7E] transition-colors"
                      >
                        <FaWhatsapp />
                        WhatsApp
                      </a>
                    )}
                    <a
                      href={`mailto:${partner.email}`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-[#A8D8C1] text-[#013E43] rounded-lg text-sm font-medium hover:bg-[#F0F7F4] transition-colors"
                    >
                      <FiMail className="text-xs" />
                      Email
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Apply CTA */}
        <div className="mt-12 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-2xl p-6 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <FaHandshake className="text-2xl text-[#02BB31]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Are you a service provider?</h3>
                <p className="text-sm text-[#A8D8C1]">
                  Join our network of trusted partners in this category
                </p>
              </div>
            </div>
            <Link
              to="/services/apply"
              className="px-6 py-2 bg-white text-[#013E43] rounded-lg font-light hover:shadow-lg transition-all transform hover:scale-105"
            >
              Apply as a Partner
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCategoryPage;