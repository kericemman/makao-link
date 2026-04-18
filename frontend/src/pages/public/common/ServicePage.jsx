import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getServiceCategories } from "../../../services/service.service";
import { 
  FiTruck, 
  FiHome, 
  FiTool, 
  FiWifi, 
  FiShield, 
  FiUsers,
  FiArrowRight,
  FiSearch,
  FiTrendingUp,
  FiStar,
  FiClock,
  FiCheckCircle,
} from "react-icons/fi";
import { FaBuilding, FaBus, FaHandshake, FaKey, FaWhatsapp } from "react-icons/fa";
import { MdCleaningServices } from "react-icons/md";
import toast from "react-hot-toast";

// Category icons mapping
const categoryIcons = {
  moving: FaBus,
  cleaning: MdCleaningServices,
  repairs: FiTool,
  furniture: FiTool,
  internet: FiWifi,
  other: FiHome
};

const categoryColors = {
  moving: "from-[#013E43] to-[#005C57]",
  cleaning: "from-[#02BB31] to-[#0D915C]",
  repairs: "from-purple-400 to-purple-500",
  furniture: "from-blue-400 to-blue-500",
  internet: "from-orange-400 to-orange-500",
  other: "from-gray-400 to-gray-500"
};

// Helper function to get image URL
const getImageUrl = (image) => {
  if (!image) return null;
  if (typeof image === 'object' && image.url) return image.url;
  if (typeof image === 'string') return image;
  return null;
};

const ServicesPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    partners: 0,
    services: 0,
    customers: 0
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getServiceCategories();
      // The categories should now include image URLs from the backend
      setCategories(data.categories || []);
      setStats({
        partners: data.totalPartners || 45,
        services: data.categories?.length || 6,
        customers: 1250
      });
    } catch (error) {
      toast.error("Failed to load service categories", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fallback image in case backend image is missing
  const fallbackImage = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      {/* Hero Section with Gradient */}
      <section className="relative bg-gradient-to-br from-[#013E43] via-[#005C57] to-[#013E43] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#02BB31] rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#A8D8C1] rounded-full blur-3xl"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80")`,
            // backgroundSize: '60px 60px',
          }}></div>
        </div>

        <div className="relative max-w-9xl mx-auto px-4 sm:px-6 lg:px-12 py-8 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <FiTrendingUp className="text-[#02BB31]" />
              <span className="text-xs font-medium">Trusted Service Providers</span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold leading-tight mb-6">
              Everything you need 
              <span className="block text-[#02BB31] mt-2">after finding a home</span>
            </h1>

            <p className="text-lg text-[#A8D8C1] leading-relaxed mb-8 max-w-2xl mx-auto">
              Get trusted movers, cleaners, repair experts,
              furniture suppliers, and internet providers so settling in becomes easier.
            </p>

            {/* <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/services/apply"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
              >
                Apply as a Partner
                <FiArrowRight />
              </Link>
            </div> */}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="mx-auto max-w-9xl px-4 sm:px-6 lg:px-12 md:py-10 py-8">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-[#02BB31]/10 text-[#02BB31] px-4 py-2 rounded-full mb-4">
            <FiHome className="text-sm" />
            <span className="text-sm font-medium">Service Categories</span>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#013E43] mb-3">
            Explore Services
          </h2>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-2xl"></div>
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
            <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
              <FiHome className="text-3xl text-[#A8D8C1]" />
            </div>
            <h3 className="text-lg font-semibold text-[#013E43] mb-2">No categories available</h3>
            <p className="text-sm text-[#065A57]">Check back soon for service categories.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const Icon = categoryIcons[category.key] || FiHome;
              const colorClass = categoryColors[category.key] || "from-gray-400 to-gray-500";
              // Get image URL from backend data
              const categoryImage = getImageUrl(category.image) || fallbackImage;
              
              return (
                <Link
                  key={category.key}
                  to={`/services/${category.key}`}
                  className="group relative bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  {/* Category Image - Fetched from backend */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={categoryImage}
                      alt={category.label}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.target.src = fallbackImage;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    
                    {/* Category Icon Overlay */}
                    {/* <div className="absolute top-4 right-4">
                      <div className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg">
                        <Icon className="text-xl text-[#02BB31]" />
                      </div>
                    </div> */}
                    
                    {/* Category Title Overlay */}
                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-xl font-bold text-white drop-shadow-lg">
                        {category.label}
                      </h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <p className="text-sm text-[#065A57] leading-relaxed mb-4">
                      {category.description}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-[#A8D8C1]">
                      <span className="text-sm font-medium text-[#02BB31] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Explore
                        <FiArrowRight className="text-sm" />
                      </span>
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${colorClass}`}></div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#013E43] to-[#005C57]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
            Are you a service provider?
          </h2>
          <p className="text-sm md:text-lg text-[#A8D8C1] mb-8 max-w-2xl mx-auto">
            Join our network of trusted partners and connect with thousands of potential customers.
          </p>
          <div className="flex gap-2 justify-center">
            <Link
              to="/services/apply"
              className="px-8 py-3 bg-white text-[#013E43] rounded-xl font-light hover:shadow-lg transition-all transform hover:scale-105"
            >
              Partner with Us
            </Link>
            <Link
              to="/support"
              className="px-8 py-3 text-sm bg-[#02BB31] text-white rounded-xl font-light hover:bg-[#0D915C] transition-all transform hover:scale-105"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;