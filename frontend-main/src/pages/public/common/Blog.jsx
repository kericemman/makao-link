import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublishedBlogs, subscribeToNewsletter } from "../../../services/blog.service";
import { 
  FiSearch, 
  FiCalendar, 
  FiClock, 
  FiTag,
  FiArrowRight,
  FiMail,
  FiSend,
  FiBookOpen,
} from "react-icons/fi";
import { FaBlog, FaTwitter, FaFacebook, FaLinkedinIn, FaInstagram } from "react-icons/fa";
import toast from "react-hot-toast";
import { useSeo } from "../../../utils/seo";
import { landlordListPropertyUrl } from "../../../config/portals";

const BlogPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useSeo({
    title: "Property Guides & Landlord Resources",
    description: "Practical guides for listing, renting, buying, and managing property in Kenya with RendaHomes.",
    path: "/blog"
  });

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const data = await getPublishedBlogs();
      setBlogs(data.blogs || []);
      
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
      <div className="relative overflow-hidden bg-[#013E43] text-white">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://res.cloudinary.com/dhlz0p70t/image/upload/v1776349042/closeup-shot-several-newspapers-stacked-top-each-other_1_wyx1no.jpg"
            alt="Blog Hero"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                <FaBlog className="text-[#02BB31] text-sm" />
                <span className="text-xs font-semibold">RENDAHOMES GUIDES</span>
              </div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">Learn to list, rent and manage with confidence</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">Clear, practical advice for Kenyan landlords, tenants and home seekers, including step-by-step help using RendaHomes.</p>
              <a href={landlordListPropertyUrl()} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-[#02BB31] underline-offset-4 hover:text-[#a8d8c1]">Ready to list a property? <FiArrowRight /></a>
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
                  className="w-full rounded-lg border border-white/20 bg-white/10 py-3 pl-11 pr-4 text-white placeholder-[#A8D8C1] outline-none focus:border-[#02BB31]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
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
                className="group flex h-full flex-col overflow-hidden rounded-lg border border-[#D7E8DF] bg-white transition-colors hover:border-[#0D915C]"
              >
                {/* Blog Image */}
                <div className="relative aspect-[16/10] overflow-hidden bg-[#DDEAE3]">
                  {blog.coverImage ? (
                    <img
                      src={blog.coverImage}
                      alt={blog.coverImageAlt || blog.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[#013E43]">
                      <FiBookOpen className="text-4xl text-white/60" />
                    </div>
                  )}
                  
                  {blog.category && (
                    <div className="absolute left-3 top-3">
                      <span className="rounded bg-[#013E43] px-2.5 py-1 text-xs font-semibold text-white">
                        {blog.category}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  {/* Title */}
                  <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-snug text-[#013E43] group-hover:text-[#0D915C]">
                    {blog.title}
                  </h3>

                  {/* Meta Info */}
                  <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#065A57]">
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
                  <p className="mb-5 line-clamp-3 text-sm leading-6 text-[#065A57]">
                    {blog.excerpt || blog.content?.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim().slice(0, 150)}
                  </p>

                  {/* Read More */}
                  <div className="mt-auto flex items-center justify-end border-t border-[#E4EEE8] pt-3">
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

    </div>
  );
};

export default BlogPage;
