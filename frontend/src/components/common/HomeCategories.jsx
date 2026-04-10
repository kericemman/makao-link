import { Link } from "react-router-dom";
import { 
  FiHome, 
  FiArrowRight, 
  FiMapPin,
  FiUsers,
  FiBriefcase,
  FiSun,
  FiGrid
} from "react-icons/fi";
import { FaBuilding, FaHome, FaCity } from "react-icons/fa";

const categories = [
  {
    title: "Apartment",
    description: "Modern apartments for individuals, couples, and families.",
    type: "apartment",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    icon: FaBuilding,
    color: "from-[#013E43] to-[#005C57]",
    bgColor: "bg-[#013E43]/10",
    textColor: "text-[#013E43]",
    badgeColor: "bg-[#013E43]"
  },
  {
    title: "Bedsitter",
    description: "Affordable and practical spaces for simple living.",
    type: "bedsitter",
    image: "/assets/bed.jpeg",
    icon: FiHome,
    color: "from-[#02BB31] to-[#0D915C]",
    bgColor: "bg-[#02BB31]/10",
    textColor: "text-[#02BB31]",
    badgeColor: "bg-[#02BB31]"
  },
  {
    title: "Maisonette",
    description: "Spacious multi-level homes for bigger households.",
    type: "maisonette",
    image: "https://res.cloudinary.com/dhlz0p70t/image/upload/v1775840824/362532576235765327652_v8n1cc.webp",
    icon: FaCity,
    color: "from-purple-400 to-purple-500",
    bgColor: "bg-purple-100",
    textColor: "text-purple-600",
    badgeColor: "bg-purple-600"
  },
  {
    title: "Studio",
    description: "Compact, stylish living for students and young professionals.",
    type: "studio",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    icon: FiBriefcase,
    color: "from-blue-400 to-blue-500",
    bgColor: "bg-blue-100",
    textColor: "text-blue-600",
    badgeColor: "bg-blue-600"
  },
  {
    title: "Bungalow",
    description: "Comfortable standalone homes with a calm residential feel.",
    type: "bungalow",
    image: "https://res.cloudinary.com/dhlz0p70t/image/upload/v1775840529/house-isolated-field_1_chax9x.jpg",
    icon: FiSun,
    color: "from-orange-400 to-orange-500",
    bgColor: "bg-orange-100",
    textColor: "text-orange-600",
    badgeColor: "bg-orange-600"
  },
  {
    title: "Townhouse",
    description: "Structured family homes in organized neighborhoods.",
    type: "townhouse",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    icon: FiGrid,
    color: "from-teal-400 to-teal-500",
    bgColor: "bg-teal-100",
    textColor: "text-teal-600",
    badgeColor: "bg-teal-600"
  }
];

const HomeCategories = () => {
  return (
    <section className="py-8 bg-gradient-to-b from-white to-[#F0F7F4]">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#02BB31]/10 text-[#02BB31] px-4 py-2 rounded-full mb-4">
            <FiHome className="text-sm" />
            <span className="text-xs font-medium">Property Categories</span>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#013E43] mb-3">
            Browse by Category
          </h2>
          <p className="text-lg text-[#065A57] max-w-2xl mx-auto">
            Start with the kind of property you want and move faster through the search process.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.type}
                to={`/listings?type=${encodeURIComponent(category.type)}`}
                className="group relative bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                {/* Category Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 right-4">
                    <div className={`w-12 h-12 ${category.bgColor} rounded-xl flex items-center justify-center backdrop-blur-sm shadow-lg`}>
                      <Icon className={`text-xl ${category.textColor}`} />
                    </div>
                  </div>
                  
                  {/* Category Title Overlay */}
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                      {category.title}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <p className="text-[#065A57] text-sm mb-4 leading-relaxed">
                    {category.description}
                  </p>
                  
                  {/* View Link */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#02BB31] group-hover:text-[#0D915C] transition-colors">
                      View {category.title} listings
                    </span>
                    <FiArrowRight className="text-[#02BB31] group-hover:translate-x-1 transition-transform" />
                  </div>

                  {/* Property Count Placeholder (optional - would need API integration) */}
                  <div className="mt-3 pt-3 border-t border-[#A8D8C1]">
                    <div className="flex items-center gap-2 text-xs text-[#065A57]">
                      <FiMapPin className="text-[#02BB31]" />
                      <span>Available across Nairobi</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* View All CTA */}
        <div className="text-center mt-12">
          <Link
            to="/listings"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 group"
          >
            <span>Browse All Properties</span>
            <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeCategories;