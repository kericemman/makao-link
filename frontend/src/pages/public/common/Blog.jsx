import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublishedBlogs, subscribeToNewsletter } from "../../../services/blog.service";
import { 
  FiSearch, 
  FiCalendar, 
  FiUser, 
  FiClock, 
  FiTag,
  FiTrendingUp,
  FiArrowRight,
  FiMail,
  FiSend,
  FiBookOpen,
  FiStar,
  FiEye,
  FiX,
  FiBell
} from "react-icons/fi";
import { FaBlog, FaWhatsapp, FaTwitter, FaFacebook, FaLinkedin, FaTiktok, FaLinkedinIn, FaInstagram } from "react-icons/fa";
import toast from "react-hot-toast";

const BlogPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [email, setEmail] = useState("");
  const [popupEmail, setPopupEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [popupSubscribing, setPopupSubscribing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupError, setPopupError] = useState("");

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const data = await getPublishedBlogs();
      setBlogs(data.blogs || []);
      
      // Show popup after 2 seconds (only once per session)
      const hasSeenPopup = sessionStorage.getItem("blogPopupSeen");
      if (!hasSeenPopup) {
        setTimeout(() => {
          setShowPopup(true);
          sessionStorage.setItem("blogPopupSeen", "true");
        }, 2000);
      }
    } catch (err) {
      toast.error("Failed to load blog posts", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  useEffect(() => {
    filterBlogs();
  }, [blogs, searchTerm, selectedCategory]);

  const filterBlogs = () => {
    let filtered = [...blogs];

    if (searchTerm) {
      filtered = filtered.filter(blog => 
        blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.content?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(blog => blog.category === selectedCategory);
    }

    setFilteredBlogs(filtered);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    try {
      setSubscribing(true);
      setError("");
      setMessage("");

      const data = await subscribeToNewsletter({ email });
      setMessage(data.message);
      setEmail("");
      
      toast.success("Subscribed successfully!", {
        style: { background: "#02BB31", color: "#fff" }
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to subscribe");
      toast.error("Failed to subscribe", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handlePopupSubscribe = async (e) => {
    e.preventDefault();

    if (!popupEmail) {
      toast.error("Please enter your email address", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    try {
      setPopupSubscribing(true);
      setPopupError("");
      setPopupMessage("");

      const data = await subscribeToNewsletter({ email: popupEmail });
      setPopupMessage(data.message);
      
      toast.success("Subscribed successfully!", {
        style: { background: "#02BB31", color: "#fff" }
      });
      
      // Close popup after successful subscription
      setTimeout(() => {
        setShowPopup(false);
        setPopupEmail("");
      }, 1500);
    } catch (err) {
      setPopupError(err.response?.data?.message || "Failed to subscribe");
      toast.error("Failed to subscribe", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setPopupSubscribing(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateReadingTime = (content) => {
    const wordsPerMinute = 200;
    const wordCount = content?.replace(/<[^>]*>/g, '').split(/\s+/).length || 0;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const categories = [...new Set(blogs.map(blog => blog.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#013E43] to-[#005C57] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://res.cloudinary.com/dhlz0p70t/image/upload/v1776349042/closeup-shot-several-newspapers-stacked-top-each-other_1_wyx1no.jpg"
            alt="Blog Hero"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                <FaBlog className="text-[#02BB31] text-sm" />
                <span className="text-xs font-medium">Insights & Updates</span>
              </div>
              
            </div>

            {/* Search Bar */}
            <div>
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#A8D8C1] text-xl" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-[#A8D8C1] focus:outline-none focus:border-[#02BB31] transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories Filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === "all"
                  ? 'bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white shadow-lg'
                  : 'bg-white text-[#065A57] hover:bg-[#F0F7F4] border border-[#A8D8C1]'
              }`}
            >
              All Posts
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white shadow-lg'
                    : 'bg-white text-[#065A57] hover:bg-[#F0F7F4] border border-[#A8D8C1]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Results Count */}
        <p className="text-sm text-[#065A57] mb-6">
          Showing {filteredBlogs.length} of {blogs.length} articles
        </p>

        {/* Blog Grid */}
        {filteredBlogs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-[#A8D8C1]">
            <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
              <FaBlog className="text-3xl text-[#A8D8C1]" />
            </div>
            <h2 className="text-xl font-bold text-[#013E43] mb-3">No articles found</h2>
            <p className="text-[#065A57] mb-6">
              {searchTerm || selectedCategory !== "all"
                ? "Try adjusting your search or filter"
                : "Check back soon for new articles"}
            </p>
            {(searchTerm || selectedCategory !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="px-6 py-3 bg-[#02BB31] text-white rounded-lg font-semibold hover:bg-[#0D915C] transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBlogs.map((blog) => (
              <Link
                key={blog._id}
                to={`/blog/${blog.slug}`}
                className="group bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                {/* Blog Image */}
                <div className="relative overflow-hidden bg-gradient-to-r from-[#013E43] to-[#005C57]">
                  {/* {blog.coverImage ? (
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaBlog className="text-5xl text-white opacity-50" />
                    </div>
                  )} */}
                  
                  {blog.category && (
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-[#02BB31] text-white text-xs font-medium rounded-full">
                        {blog.category}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  {/* Title */}
                  <h3 className="text-xl font-bold text-[#013E43] mb-2 line-clamp-2 group-hover:text-[#02BB31] transition-colors">
                    {blog.title}
                  </h3>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 mb-3 text-xs text-[#065A57]">
                    <span className="flex items-center gap-1">
                      <FiCalendar className="text-[#02BB31]" />
                      {formatDate(blog.publishedAt || blog.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiClock className="text-[#02BB31]" />
                      {calculateReadingTime(blog.content)} min read
                    </span>
                  </div>

                  {/* Excerpt */}
                  <p className="text-[#065A57] text-sm mb-4 line-clamp-3">
                    {blog.excerpt || blog.content?.replace(/<[^>]*>/g, '').slice(0, 150)}...
                  </p>

                  {/* Read More */}
                  <div className="flex items-center justify-end">
                    <span className="text-[#02BB31] text-sm font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Read More
                      <FiArrowRight className="text-sm" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Newsletter Section - Responsive */}
        <div className="mt-16 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-2xl p-6 sm:p-8 text-white">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="p-3 bg-white/10 rounded-xl flex-shrink-0">
                <FiMail className="text-2xl text-[#02BB31]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-semibold mb-1">Never miss an update</h3>
                <p className="text-xs sm:text-sm text-[#A8D8C1]">
                  Subscribe to our newsletter for the latest property tips and market news
                </p>
              </div>
            </div>
            
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
              <div className="flex-1 sm:min-w-[240px]">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-lg sm:rounded-r-none border-2 border-white/20 bg-white/10 text-white placeholder-[#A8D8C1] focus:outline-none focus:border-[#02BB31] transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={subscribing}
                className="px-6 py-3 bg-[#02BB31] text-white rounded-lg sm:rounded-l-none font-semibold hover:bg-[#0D915C] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FiSend />
                <span>{subscribing ? "Subscribing..." : "Subscribe"}</span>
              </button>
            </form>
          </div>
          
          {message && (
            <p className="mt-4 text-sm text-green-300 text-center">{message}</p>
          )}
          {error && (
            <p className="mt-4 text-sm text-red-300 text-center">{error}</p>
          )}
        </div>

        {/* Follow Us Section */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold text-[#013E43] mb-4">Follow Us</h3>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <a href="https://www.tiktok.com/@rendahomes?_r=1&_t=ZS-95Wr9YOCupj" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#F0F7F4] rounded-full flex items-center justify-center text-[#065A57] hover:bg-[#02BB31] hover:text-white transition-all">
              <FaTiktok />
            </a>
            <a href="https://www.facebook.com/share/1KYNTYg9YZ/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#F0F7F4] rounded-full flex items-center justify-center text-[#065A57] hover:bg-[#02BB31] hover:text-white transition-all">
              <FaFacebook />
            </a>
            <a href="https://www.instagram.com/renda.homes?igsh=MW5hM2s3dHMyeHZlaQ==" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#F0F7F4] rounded-full flex items-center justify-center text-[#065A57] hover:bg-[#02BB31] hover:text-white transition-all">
              <FaInstagram />
            </a>
            <a href="https://www.linkedin.com/company/renda-homes/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#F0F7F4] rounded-full flex items-center justify-center text-[#065A57] hover:bg-[#02BB31] hover:text-white transition-all">
              <FaLinkedinIn />
            </a>
            <a href="https://x.com/RendaHomes" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#F0F7F4] rounded-full flex items-center justify-center text-[#065A57] hover:bg-[#02BB31] hover:text-white transition-all">
              <FaTwitter />
            </a>
          </div>
        </div>
      </div>

      {/* Subscription Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-slide-up">
            {/* Close Button */}
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 p-2 text-[#065A57] hover:text-[#013E43] transition-colors z-10"
            >
              <FiX className="text-xl" />
            </button>

            {/* Content */}
            <div className="p-6 sm:p-8 text-center">
              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-[#02BB31] to-[#0D915C] rounded-full flex items-center justify-center">
                <FiBell className="text-3xl text-white" />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-[#013E43] mb-2">Stay Updated!</h3>
              
              {/* Description */}
              <p className="text-[#065A57] mb-6">
                Subscribe to our newsletter and never miss out on the latest property tips, market news, and exclusive offers.
              </p>

              {/* Benefits */}
              <div className="flex flex-col gap-2 mb-6 text-left">
                <div className="flex items-center gap-2 text-sm text-[#065A57]">
                  <FiStar className="text-[#02BB31] flex-shrink-0" />
                  <span>Weekly property market insights</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#065A57]">
                  <FiStar className="text-[#02BB31] flex-shrink-0" />
                  <span>Exclusive landlord tips</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#065A57]">
                  <FiStar className="text-[#02BB31] flex-shrink-0" />
                  <span>New listing alerts</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#065A57]">
                  <FiStar className="text-[#02BB31] flex-shrink-0" />
                  <span>Special offers and discounts</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handlePopupSubscribe} className="space-y-4">
                <input
                  type="email"
                  value={popupEmail}
                  onChange={(e) => setPopupEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                  required
                />
                
                {popupMessage && (
                  <p className="text-sm text-green-600">{popupMessage}</p>
                )}
                {popupError && (
                  <p className="text-sm text-red-600">{popupError}</p>
                )}
                
                <button
                  type="submit"
                  disabled={popupSubscribing}
                  className="w-full py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {popupSubscribing ? "Subscribing..." : "Subscribe Now"}
                </button>
              </form>

              {/* No thanks link */}
              <button
                onClick={() => setShowPopup(false)}
                className="mt-4 text-sm text-[#065A57] hover:text-[#02BB31] transition-colors"
              >
                No thanks, I'll do it later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Animation */}
      <style jsx>{`
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
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default BlogPage;