import { Link } from "react-router-dom";
import { 
  FiHome, 
  FiPhone, 
  FiMail, 
  FiMapPin, 
  FiFacebook, 
  FiTwitter, 
  FiInstagram, 
  FiLinkedin,
  FiChevronRight,
  FiHeart,
  FiAlertCircle
} from "react-icons/fi";
import { FaWhatsapp, FaTiktok, FaApple, FaGooglePlay } from "react-icons/fa";
import toast from "react-hot-toast";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "Properties", path: "/properties" },
    { name: "About Us", path: "/about" },
    { name: "Partner with Us", path: "/services/apply" },
    { name: "Contact", path: "/support" },
  ];

  const landlordLinks = [
    { name: "List Property", path: "/pricing" },
    { name: "Landlord Login", path: "/login" },
    { name: "Pricing", path: "/pricing" },
    { name: "Resources", path: "/blog" },
    { name: "Support", path: "/support" },
  ];

  const tenantLinks = [
    { name: "Find Homes", path: "/properties" },
    { name: "FAQs", path: "/faqs" },
    { name: "Articles", path: "/blog"}
  ];

  const legalLinks = [
    { name: "Terms of Service", path: "/terms-of-service" },
    { name: "Privacy Policy", path: "/privacy-policy" },
  ];

  const socialLinks = [
    { icon: FiFacebook, href: "https://www.facebook.com/share/1CYY4uVPTy/", label: "Facebook", color: "hover:text-[#1877F2]" },
    { icon: FiInstagram, href: "https://www.instagram.com/renda.homes?igsh=MW5hM2s3dHMyeHZlaQ==", label: "Instagram", color: "hover:text-[#E4405F]" },
    { icon: FiLinkedin, href: "https://www.linkedin.com/company/renda-homes/", label: "LinkedIn", color: "hover:text-[#0A66C2]" },
    { icon: FaWhatsapp, href: "https://wa.me/254729353537", label: "WhatsApp", color: "hover:text-[#25D366]" },
    { icon: FaTiktok, href: "https://www.tiktok.com/@rendahomes", label: "TikTok", color: "hover:text-[#000000]" },
  ];

  const handleAppDownload = (platform) => {
    toast.success(`${platform} app coming soon! We'll notify you when it's ready.`, {
      style: {
        background: "#02BB31",
        color: "#fff",
      },
      duration: 4000,
      icon: '📱',
    });
  };

  return (
    <footer className="bg-gradient-to-b from-[#013E43] to-[#001A1C] text-white mt-20 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#02BB31] opacity-5 rounded-full -translate-x-32 -translate-y-32"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#02BB31] opacity-5 rounded-full translate-x-48 translate-y-48"></div>
      
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Brand Column */}
          <div className="lg:col-span-1 space-y-4">
            <Link to="/" className="flex items-center space-x-2 group">
              
              <span className="text-2xl font-bold text-white group-hover:text-[#02BB31] transition-colors">
                RendaHomes
              </span>
            </Link>
            
            <p className="text-sm text-[#A8D8C1] leading-relaxed">
              Connecting landlords with quality tenants across Kenya. Find your perfect rental property or list your property with ease.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 pt-4">
              <div className="flex items-center space-x-3 text-sm">
                <FiMapPin className="text-[#02BB31] flex-shrink-0" />
                <span className="text-[#A8D8C1]">Nairobi, Kenya</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <FiPhone className="text-[#02BB31] flex-shrink-0" />
                <a href="tel:+254729353537" className="text-[#A8D8C1] hover:text-white transition-colors">
                  +254 729 353 537
                </a>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <FiMail className="text-[#02BB31] flex-shrink-0" />
                <a href="mailto:info@rendahomes.com" className="text-[#A8D8C1] hover:text-white transition-colors">
                  info@rendahomes.com
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white relative inline-block">
              Quick Links
              <span className="absolute -bottom-1 left-0 w-12 h-0.5 bg-gradient-to-r from-[#02BB31] to-[#0D915C] rounded-full"></span>
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-[#A8D8C1] hover:text-white transition-colors flex items-center group"
                  >
                    <FiChevronRight className="text-[#02BB31] mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Landlords */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white relative inline-block">
              For Landlords
              <span className="absolute -bottom-1 left-0 w-12 h-0.5 bg-gradient-to-r from-[#02BB31] to-[#0D915C] rounded-full"></span>
            </h3>
            <ul className="space-y-2">
              {landlordLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-[#A8D8C1] hover:text-white transition-colors flex items-center group"
                  >
                    <FiChevronRight className="text-[#02BB31] mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Tenants */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white relative inline-block">
              For Tenants
              <span className="absolute -bottom-1 left-0 w-12 h-0.5 bg-gradient-to-r from-[#02BB31] to-[#0D915C] rounded-full"></span>
            </h3>
            <ul className="space-y-2">
              {tenantLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-[#A8D8C1] hover:text-white transition-colors flex items-center group"
                  >
                    <FiChevronRight className="text-[#02BB31] mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white relative inline-block">
              Legal
              <span className="absolute -bottom-1 left-0 w-12 h-0.5 bg-gradient-to-r from-[#02BB31] to-[#0D915C] rounded-full"></span>
            </h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-[#A8D8C1] hover:text-white transition-colors flex items-center group"
                  >
                    <FiChevronRight className="text-[#02BB31] mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Media & Newsletter */}
        <div className="mt-12 pt-8 border-t border-[#065A57]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-[#A8D8C1]">Follow us:</span>
              <div className="flex items-center space-x-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-[#A8D8C1] ${social.color} hover:bg-white/20 transition-all transform hover:scale-110`}
                      aria-label={social.label}
                    >
                      <Icon className="text-lg" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Newsletter */}
            <div className="flex-1 max-w-md">
              <form className="flex items-center" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Enter your email for updates"
                  className="flex-1 px-4 py-2 bg-white/10 border border-[#065A57] rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-white placeholder-[#A8D8C1]"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-r-lg font-medium hover:shadow-lg transition-all hover:scale-105"
                >
                  Subscribe
                </button>
              </form>
            </div>

            {/* Download App */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-[#A8D8C1]">Download app:</span>
              <div className="flex items-center space-x-2">
                {/* iOS App Store Button */}
                <button
                  onClick={() => handleAppDownload("iOS App")}
                  className="flex items-center gap-2 px-3 py-1.5 bg-black rounded-lg text-white hover:bg-gray-800 transition-all transform hover:scale-105 group"
                >
                  <FaApple className="text-lg group-hover:text-[#02BB31] transition-colors" />
                  <div className="text-left">
                    <p className="text-[8px] text-gray-400">Download on the</p>
                    <p className="text-xs font-semibold">App Store</p>
                  </div>
                </button>
                
                {/* Google Play Button */}
                <button
                  onClick={() => handleAppDownload("Android App")}
                  className="flex items-center gap-2 px-3 py-1.5 bg-black rounded-lg text-white hover:bg-gray-800 transition-all transform hover:scale-105 group"
                >
                  <FaGooglePlay className="text-lg group-hover:text-[#02BB31] transition-colors" />
                  <div className="text-left">
                    <p className="text-[8px] text-gray-400">GET IT ON</p>
                    <p className="text-xs font-semibold">Google Play</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-[#065A57] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#A8D8C1] flex items-center">
            © {currentYear} RendaHomes. All rights reserved.
            
            <span className="flex items-center ml-2">
              Made with <FiHeart className="text-red-500 mx-1" /> by 
              <a href="https://thedigitalagame.com" target="_blank" rel="noopener noreferrer" className="text-[#A8D8C1] hover:text-white underline transition-colors ml-2">
                The Digital A-Game
              </a>
            </span>
          </p>
          
          <div className="flex items-center space-x-6">
            <Link to="/privacy-policy" className="text-xs text-[#A8D8C1] hover:text-white transition-colors">
              Privacy
            </Link>
            <Link to="/terms-of-service" className="text-xs text-[#A8D8C1] hover:text-white transition-colors">
              Terms
            </Link>
            <Link to="/sitemap" className="text-xs text-[#A8D8C1] hover:text-white transition-colors">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;