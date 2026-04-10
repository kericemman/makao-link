import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getBlogs } from "../../../services/blog.service"
import { 
  FiCalendar, 
  FiUser, 
  FiClock, 
  FiEye,
  FiTag,
  FiArrowRight,
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiMail,
  FiSend
} from "react-icons/fi"
import { FaBlog, FaFacebook, FaTwitter, FaLinkedin } from "react-icons/fa"
import toast from "react-hot-toast"

function BlogPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [blogs, setBlogs] = useState([])
  const [filteredBlogs, setFilteredBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const blogsPerPage = 6

  useEffect(() => {
    fetchBlogs()
  }, [])

  useEffect(() => {
    filterBlogs()
  }, [blogs, searchTerm, selectedCategory])

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const res = await getBlogs()
      // Filter only published blogs
      const publishedBlogs = res.data.filter(blog => blog.status === "published")
      setBlogs(publishedBlogs)
    } catch (error) {
      toast.error("Failed to load blogs", {
        style: { background: "#013E43", color: "#fff" }
      })
    } finally {
      setLoading(false)
    }
  }

  const filterBlogs = () => {
    let filtered = [...blogs]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(blog => 
        blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.content?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(blog => blog.category === selectedCategory)
    }

    setFilteredBlogs(filtered)
    setCurrentPage(1)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateReadingTime = (content) => {
    const wordsPerMinute = 200
    const wordCount = content?.replace(/<[^>]*>/g, '').split(/\s+/).length || 0
    const readingTime = Math.ceil(wordCount / wordsPerMinute)
    return readingTime || 1
  }

  // Get unique categories
  const categories = ["all", ...new Set(blogs.map(blog => blog.category).filter(Boolean))]

  // Pagination
  const indexOfLastBlog = currentPage * blogsPerPage
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage
  const currentBlogs = filteredBlogs.slice(indexOfFirstBlog, indexOfLastBlog)
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57] text-lg">Loading articles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      {/* Hero Section with Background Image */}
      <div className="relative h-[300px] md:h-[500px] lg:h-[400px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="Blog background"
            className="w-full h-full object-cover"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#013E43]/95 to-[#005C57]/90"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        </div>

        {/* Centered Hero Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center text-white px-4 sm:px-6 lg:px-8">
          {/* Blog Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-6">
            <FaBlog className="text-[#02BB31] text-sm sm:text-base" />
            <span className="text-xs sm:text-sm font-medium">Renda Insights</span>
          </div>

         

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-[#A8D8C1] max-w-2xl mb-6 sm:mb-8 px-4">
            Expert advice, market trends, and tips for landlords and tenants
          </p>

          {/* Search Bar - Responsive Width */}
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-2xl px-4">
            <div className="relative">
              <FiSearch className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-[#065A57] text-base sm:text-xl" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-[#A8D8C1] focus:outline-none focus:border-[#02BB31] transition-colors text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Stats Row - Hidden on mobile, visible on tablet and up */}
          <div className="hidden sm:flex items-center space-x-6 mt-6 sm:mt-8 text-sm text-[#A8D8C1]">
            <span className="flex items-center">
              <FiCalendar className="mr-2" />
              {blogs.length} Articles
            </span>
            <span className="flex items-center">
              <FiUser className="mr-2" />
              Expert Authors
            </span>
            <span className="flex items-center">
              <FiClock className="mr-2" />
              Weekly Updates
            </span>
          </div>
        </div>

        
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Categories Filter - Scrollable on mobile */}
        {categories.length > 1 && (
          <div className="overflow-x-auto pb-2 mb-6 sm:mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex flex-nowrap sm:flex-wrap gap-2 sm:gap-3 min-w-max sm:min-w-0">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'bg-[#02BB31] text-white shadow-lg'
                      : 'bg-white text-[#065A57] hover:bg-[#F0F7F4] border border-[#A8D8C1]'
                  }`}
                >
                  {category === "all" ? "All Posts" : category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Count */}
        <p className="text-sm sm:text-base text-[#065A57] mb-4 sm:mb-6">
          Showing {currentBlogs.length} of {filteredBlogs.length} articles
        </p>

        {/* Blog Grid */}
        {currentBlogs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-16 text-center border border-[#A8D8C1]">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <FaBlog className="text-2xl sm:text-4xl text-[#A8D8C1]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#013E43] mb-2 sm:mb-3">No articles found</h2>
            <p className="text-sm sm:text-base text-[#065A57] mb-4 sm:mb-6 px-4">
              {searchTerm || selectedCategory !== "all"
                ? "Try adjusting your search or filter"
                : "Check back soon for new articles"}
            </p>
            {(searchTerm || selectedCategory !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory("all")
                }}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-[#02BB31] text-white rounded-lg font-semibold text-sm sm:text-base hover:bg-[#0D915C] transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {currentBlogs.map((blog) => (
                <Link
                  key={blog._id}
                  to={`/blogs/${blog.slug}`}
                  className="group bg-white rounded-xl sm:rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  {/* Blog Image */}
                  {blog.coverImage?.url && (
                    <div className="relative h-40 sm:h-48 overflow-hidden">
                      <img
                        src={blog.coverImage.url}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {blog.category && (
                        <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                          <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-[#02BB31] text-white text-xs font-medium rounded-full">
                            {blog.category}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-4 sm:p-6">
                    {/* Title */}
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#013E43] mb-2 sm:mb-3 line-clamp-2 group-hover:text-[#02BB31] transition-colors">
                      {blog.title}
                    </h3>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm text-[#065A57]">
                      <span className="flex items-center">
                        <FiCalendar className="mr-1 text-[#02BB31] text-xs sm:text-sm" />
                        <span className="hidden xs:inline">{formatDate(blog.createdAt)}</span>
                        <span className="xs:hidden">{new Date(blog.createdAt).toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center">
                        <FiClock className="mr-1 text-[#02BB31] text-xs sm:text-sm" />
                        {calculateReadingTime(blog.content)} min
                      </span>
                    </div>

                    {/* Excerpt */}
                    <p className="text-xs sm:text-sm text-[#065A57] mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
                      {blog.excerpt || blog.content?.replace(/<[^>]*>/g, '').slice(0, 120)}...
                    </p>

                    {/* Author and Read More */}
                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-[#A8D8C1]">
                      <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                        <img src="/assets/logo.png"/>
                        </div>
                        
                      </div>
                      <span className="text-xs sm:text-sm text-[#02BB31] font-medium flex items-center group-hover:translate-x-1 transition-transform">
                        Read
                        <FiArrowRight className="ml-1 sm:ml-2 text-xs sm:text-sm" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 sm:mt-12 flex items-center justify-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 sm:p-2 rounded-lg border border-[#A8D8C1] text-[#065A57] hover:bg-[#F0F7F4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronLeft className="text-sm sm:text-base" />
                </button>
                
                <div className="flex space-x-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-base font-medium transition-colors ${
                        currentPage === i + 1
                          ? 'bg-[#02BB31] text-white'
                          : 'border border-[#A8D8C1] text-[#065A57] hover:bg-[#F0F7F4]'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 sm:p-2 rounded-lg border border-[#A8D8C1] text-[#065A57] hover:bg-[#F0F7F4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronRight className="text-sm sm:text-base" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Newsletter Section */}
        <div className="mt-12 sm:mt-16 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="text-center sm:text-left">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">Never miss an update</h3>
              <p className="text-xs sm:text-sm text-[#A8D8C1]">
                Subscribe for the latest property tips and market news
              </p>
            </div>
            <div className="flex w-full sm:w-auto">
              <input
                type="email"
                placeholder="Enter email"
                className="flex-1 sm:w-64 px-3 sm:px-4 py-2 sm:py-3 rounded-l-lg border-2 border-white/20 bg-white/10 text-white placeholder-[#A8D8C1] text-sm sm:text-base focus:outline-none focus:border-[#02BB31]"
              />
              <button className="px-4 sm:px-6 py-2 sm:py-3 bg-[#02BB31] text-white rounded-r-lg font-semibold text-sm sm:text-base hover:bg-[#0D915C] transition-colors flex items-center">
                <FiSend className="block sm:hidden" />
                <span className="hidden sm:block">Subscribe</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlogPage