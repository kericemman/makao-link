import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getAdminBlogs, deleteBlog, updateBlogStatus } from "../../../services/blog.service"
import { 
  FiFileText, 
  FiEdit2, 
  FiTrash2, 
  FiEye,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiFilter,
  FiPlus,
  FiRefreshCw,
  FiCalendar,
  FiUser,
  FiTag,
  FiMoreVertical,
  FiArchive,
  FiCopy,
  FiStar
} from "react-icons/fi"
import { FaBlog, FaWordpress, FaMedium } from "react-icons/fa"
import toast from "react-hot-toast"

function AdminBlogs() {
  const [blogs, setBlogs] = useState([])
  const [filteredBlogs, setFilteredBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedBlog, setSelectedBlog] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const res = await getAdminBlogs()
      setBlogs(res.data || [])
    } catch (error) {
      toast.error("Failed to load blogs", {
        style: { background: "#013E43", color: "#fff" }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBlogs()
  }, [])

  useEffect(() => {
    filterBlogs()
  }, [blogs, searchTerm, statusFilter, categoryFilter])

  const filterBlogs = () => {
    let filtered = [...blogs]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(b => 
        b.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.author?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(b => b.status === statusFilter)
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(b => b.category === categoryFilter)
    }

    setFilteredBlogs(filtered)
  }

  const handleDelete = async () => {
    try {
      await deleteBlog(selectedBlog._id)
      toast.success("Blog deleted successfully", {
        style: { background: "#02BB31", color: "#fff" }
      })
      setShowDeleteModal(false)
      setSelectedBlog(null)
      fetchBlogs()
    } catch (error) {
      toast.error("Failed to delete blog", {
        style: { background: "#013E43", color: "#fff" }
      })
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await updateBlogStatus(id, status)
      toast.success(`Blog ${status} successfully`, {
        style: { background: "#02BB31", color: "#fff" }
      })
      fetchBlogs()
    } catch (error) {
      toast.error("Failed to update status", {
        style: { background: "#013E43", color: "#fff" }
      })
    }
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case "published":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#02BB31]/10 text-[#02BB31]">
            <FiCheckCircle className="mr-1" />
            Published
          </span>
        )
      case "draft":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
            <FiClock className="mr-1" />
            Draft
          </span>
        )
      case "archived":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <FiArchive className="mr-1" />
            Archived
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {status}
          </span>
        )
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const stats = {
    total: blogs.length,
    published: blogs.filter(b => b.status === "published").length,
    draft: blogs.filter(b => b.status === "draft").length,
    archived: blogs.filter(b => b.status === "archived").length
  }

  const categories = [...new Set(blogs.map(b => b.category).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading blogs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl">
              <FaBlog className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">Blog Management</h1>
              <p className="text-sm text-[#065A57]">Create and manage blog posts</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchBlogs}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/admin/blog/create"
              className="px-4 py-2 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center"
            >
              <FiPlus className="mr-2" />
              Create Blog
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#013E43]">
          <p className="text-sm text-[#065A57]">Total Blogs</p>
          <p className="text-2xl font-bold text-[#013E43]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#02BB31]">
          <p className="text-sm text-[#065A57]">Published</p>
          <p className="text-2xl font-bold text-[#02BB31]">{stats.published}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-yellow-400">
          <p className="text-sm text-[#065A57]">Drafts</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-gray-400">
          <p className="text-sm text-[#065A57]">Archived</p>
          <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-4 border border-[#A8D8C1]">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#065A57]" />
            <input
              type="text"
              placeholder="Search by title, content, or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <FiFilter className="text-[#065A57]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-[#065A57]">
          Showing {filteredBlogs.length} of {blogs.length} blog posts
        </div>
      </div>

      {/* Blogs Grid */}
      {filteredBlogs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
          <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
            <FaBlog className="text-3xl text-[#A8D8C1]" />
          </div>
          <h3 className="text-lg font-semibold text-[#013E43] mb-2">No blog posts found</h3>
          <p className="text-sm text-[#065A57] mb-4">
            {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
              ? "Try adjusting your filters"
              : "You haven't created any blog posts yet"}
          </p>
          <Link
            to="/admin/blog/create"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            <FiPlus className="mr-2" />
            Create Your First Blog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => (
            <div
              key={blog._id}
              className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              {/* Blog Image */}
              {blog.coverImage && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={blog.coverImage}
                    alt={blog.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(blog.status)}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-5">
                {/* Title */}
                <h3 className="text-xl font-bold text-[#013E43] mb-2 line-clamp-2">
                  {blog.title}
                </h3>

                {/* Meta Info */}
                <div className="flex items-center space-x-3 mb-3 text-sm text-[#065A57]">
                  <span className="flex items-center">
                    <FiUser className="mr-1 text-[#02BB31]" />
                    {blog.author?.name || 'Admin'}
                  </span>
                  <span className="flex items-center">
                    <FiCalendar className="mr-1 text-[#02BB31]" />
                    {formatDate(blog.createdAt)}
                  </span>
                </div>

                {/* Category */}
                {blog.category && (
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2 py-1 bg-[#F0F7F4] text-[#065A57] text-xs rounded-full">
                      <FiTag className="mr-1" />
                      {blog.category}
                    </span>
                  </div>
                )}

                {/* Excerpt */}
                <p className="text-[#065A57] text-sm mb-4 line-clamp-3">
                  {blog.excerpt || blog.content?.replace(/<[^>]*>/g, '').slice(0, 150)}...
                </p>

                {/* Stats */}
                <div className="flex items-center space-x-4 mb-4 text-xs text-[#065A57]">
                  <span className="flex items-center">
                    <FiEye className="mr-1 text-[#02BB31]" />
                    {blog.views || 0} views
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-[#A8D8C1]">
                  <Link
                    to={`/admin/blog/edit/${blog._id}`}
                    className="text-sm text-[#02BB31] hover:text-[#0D915C] flex items-center"
                  >
                    <FiEdit2 className="mr-1" />
                    Edit
                  </Link>

                  <div className="flex items-center space-x-2">
                    {blog.status === "draft" && (
                      <button
                        onClick={() => handleStatusChange(blog._id, "published")}
                        className="p-2 text-[#02BB31] hover:bg-[#F0F7F4] rounded-lg transition-colors"
                        title="Publish"
                      >
                        <FiCheckCircle />
                      </button>
                    )}
                    {blog.status === "published" && (
                      <button
                        onClick={() => handleStatusChange(blog._id, "archived")}
                        className="p-2 text-gray-500 hover:bg-[#F0F7F4] rounded-lg transition-colors"
                        title="Archive"
                      >
                        <FiArchive />
                      </button>
                    )}
                    {blog.status === "archived" && (
                      <button
                        onClick={() => handleStatusChange(blog._id, "draft")}
                        className="p-2 text-yellow-500 hover:bg-[#F0F7F4] rounded-lg transition-colors"
                        title="Move to Draft"
                      >
                        <FiClock />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedBlog(blog)
                        setShowDeleteModal(true)
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBlog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <FiTrash2 className="text-3xl text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-[#013E43] mb-2">Delete Blog Post</h3>
              <p className="text-sm text-[#065A57]">
                Are you sure you want to delete "{selectedBlog.title}"? This action cannot be undone.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedBlog(null)
                }}
                className="flex-1 px-4 py-2 border border-[#A8D8C1] text-[#065A57] rounded-lg hover:bg-[#F0F7F4] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminBlogs