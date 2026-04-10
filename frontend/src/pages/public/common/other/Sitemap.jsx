import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  FiHome, 
  FiMapPin, 
  FiBriefcase, 
  FiUsers, 
  FiHelpCircle,
  FiFileText,
  FiShield,
  FiMail,
  FiCreditCard,
  FiUser,
  FiKey,
  FiGrid,
  FiList,
  FiArrowRight,
  FiChevronRight,
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiLinkedin,
  FiYoutube, 
  FiSearch
} from "react-icons/fi";
import { FaBuilding, FaHandshake, FaWhatsapp } from "react-icons/fa";

const Sitemap = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const siteStructure = [
    {
      title: "Main Pages",
      icon: FiHome,
      links: [
        { name: "Home", path: "/", description: "Welcome to RendaHomes" },
        { name: "Properties", path: "/properties", description: "Browse all rental properties" },
        { name: "About Us", path: "/about", description: "Learn about RendaHomes" },
        { name: "Contact Us", path: "/support", description: "Get in touch with our team" },
        { name: "Blog", path: "/articles", description: "Latest news and articles" }
      ]
    },
    {
      title: "Services",
      icon: FiBriefcase,
      links: [
        { name: "Moving Services", path: "/services/movers", description: "Professional movers" },
        { name: "Cleaning Services", path: "/services/cleaning", description: "Move-in/move-out cleaning" },
        { name: "Handyman & Repairs", path: "/services/handyman", description: "Maintenance services" },
        { name: "Furniture & Appliances", path: "/services/furniture", description: "Home furnishings" },
        { name: "Internet & WiFi", path: "/services/internet", description: "Connectivity solutions" }
      ]
    },
    {
      title: "For Landlords",
      icon: FiKey,
      links: [
        { name: "Dashboard", path: "/landlord/dashboard", description: "Manage your properties" },
        { name: "My Listings", path: "/landlord/listings", description: "View your properties" },
        { name: "Add Listing", path: "/landlord/listings/new", description: "List a new property" },
        { name: "Inquiries", path: "/landlord/inquiries", description: "Tenant messages" },
        { name: "Subscription", path: "/landlord/subscription", description: "Manage your plan" },
        { name: "Support Tickets", path: "/landlord/support", description: "Get help" }
      ]
    },
    {
      title: "For Tenants",
      icon: FiUsers,
      links: [
        { name: "Browse Properties", path: "/properties", description: "Find your next home" },
        
        { name: "Rental Guide", path: "/faqs", description: "Tips for renters" }
      ]
    },
    {
      title: "For Partners",
      icon: FaHandshake,
      links: [
        { name: "Apply as Partner", path: "/services/apply", description: "Join our network" },
        
        { name: "Partner Resources", path: "/articles", description: "Tools and guides" }
      ]
    },
    {
      title: "Legal & Policies",
      icon: FiFileText,
      links: [
        { name: "Terms of Service", path: "/terms-of-service", description: "Our terms and conditions" },
        { name: "Privacy Policy", path: "/privacy-policy", description: "How we protect your data" },
        
        { name: "FAQ", path: "/faqs", description: "Frequently asked questions" },
        
      ]
    },
    {
      title: "Property Categories",
      icon: FiGrid,
      links: [
        { name: "Apartments", path: "/listings?type=apartment", description: "Modern apartments" },
        { name: "Bedsitters", path: "/listings?type=bedsitter", description: "Affordable living" },
        { name: "Maisonettes", path: "/listings?type=maisonette", description: "Spacious homes" },
        { name: "Studios", path: "/listings?type=studio", description: "Compact living" },
        { name: "Bungalows", path: "/listings?type=bungalow", description: "Standalone homes" },
        { name: "Townhouses", path: "/listings?type=townhouse", description: "Family homes" }
      ]
    },
    {
      title: "Locations",
      icon: FiMapPin,
      links: [
        { name: "Nairobi Properties", path: "/properties?location=Nairobi", description: "Homes in Nairobi" },
        { name: "Kiambu Properties", path: "/properties?location=Kiambu", description: "Homes in Kiambu" },
        { name: "Kilimani Properties", path: "/properties?location=Kilimani", description: "Lakeside homes" },
        { name: "Rongai Properties", path: "/properties?location=Rongai", description: "Rift Valley homes" },
        { name: "Githurai Properties", path: "/properties?location=Githurai", description: "Highlands properties" },
        { name: "Thika Road", path: "/properties?location=Thika", description: "Industrial town homes" }
      ]
    },
    {
      title: "Support & Help",
      icon: FiHelpCircle,
      links: [
        { name: "Help Center", path: "/faqs", description: "Find answers" },
        { name: "Contact Support", path: "/support", description: "Get assistance" },
        { name: "Report an Issue", path: "/report", description: "Report problems" },
        { name: "Safety Tips", path: "/articles/safety-tips", description: "Stay safe online" }
      ]
    }
  ];


  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#013E43] to-[#005C57] text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/assets/renda.png"
            alt="Sitemap background"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <FiGrid className="text-[#02BB31]" />
            <span className="text-sm font-medium">Site Navigation</span>
          </div>
          
          
          
          
        </div>

        
      </div>

      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        

        {/* Sitemap Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {siteStructure.map((section, index) => {
            const Icon = section.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="bg-gradient-to-r from-[#013E43] to-[#005C57] px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Icon className="text-xl text-[#02BB31]" />
                    </div>
                    <h2 className="text-lg font-bold text-white">{section.title}</h2>
                  </div>
                </div>
                <div className="p-5">
                  <ul className="space-y-3">
                    {section.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <Link
                          to={link.path}
                          className="group flex items-start justify-between hover:bg-[#F0F7F4] p-2 rounded-lg transition-all"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <FiChevronRight className="text-[#02BB31] text-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                              <span className="font-medium text-[#013E43] group-hover:text-[#02BB31] transition-colors">
                                {link.name}
                              </span>
                            </div>
                            {link.description && (
                              <p className="text-xs text-[#065A57] mt-1 ml-5">
                                {link.description}
                              </p>
                            )}
                          </div>
                          <FiArrowRight className="text-[#02BB31] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#013E43] mb-2">Can't find what you're looking for?</h2>
            <p className="text-[#065A57]">Use our search to quickly find the page you need</p>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#065A57] text-xl" />
              <input
                type="text"
                placeholder="Search for pages..."
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-[#A8D8C1] focus:border-[#02BB31] outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Contact & Support */}
        <div className="mt-12 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-2xl p-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <FiHelpCircle className="text-2xl text-[#02BB31]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Need help navigating?</h3>
                <p className="text-sm text-[#A8D8C1]">
                  Our support team is here to assist you
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <a
                href="/faqs"
                className="px-6 py-3 bg-white text-[#013E43] rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Visit FAQ
              </a>
              <a
                href="/support"
                className="px-6 py-3 bg-[#02BB31] text-white rounded-lg font-medium hover:bg-[#0D915C] transition-all"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-[#A8D8C1]">
          <div className="text-center">
            <p className="text-sm text-[#065A57]">
              © {new Date().getFullYear()} RendaHomes. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm">
              <Link to="/terms-of-service" className="text-[#065A57] hover:text-[#02BB31] transition-colors">
                Terms of Service
              </Link>
              <span className="w-1 h-1 bg-[#A8D8C1] rounded-full"></span>
              <Link to="/privacy-policy" className="text-[#065A57] hover:text-[#02BB31] transition-colors">
                Privacy Policy
              </Link>
              <span className="w-1 h-1 bg-[#A8D8C1] rounded-full"></span>
              
              
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sitemap;