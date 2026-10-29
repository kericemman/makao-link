import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteBlog, getAdminBlogs, updateBlogStatus } from "../../../services/blog.service";
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiEye,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiCalendar,
  FiUser,
  FiTag,
  FiArchive,
  FiCopy,
  FiStar,
  FiTrendingUp
} from "react-icons/fi";
import { FaBlog, FaWordpress, FaMedium } from "react-icons/fa";
import toast from "react-hot-toast";

const statusClasses = {
  draft: "bg-yellow-100 text-yellow-600",
  published: "bg-[#0D915C]/10 text-[#0D915C]",
  archived: "bg-gray-100 text-gray-600"
};

const statusIcons = {
  draft: <FiClock className="text-yellow-500" />,
  published: <FiCheckCircle className="text-[#0D915C]" />,
  archived: <FiArchive className="text-gray-500" />
};

const AdminBlogsPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminBlogs();
      setBlogs(data.blogs || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load blogs");
      toast.error("Failed to load blogs", {
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
  }, [blogs, searchTerm, statusFilter, dateRange]);

  const filterBlogs = () => {
    let filtered = [...blogs];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(blog => 
        blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.author?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(blog => blog.status === statusFilter);
    }

    // Date range filter
    if (dateRange !== "all") {
      const filterDate = new Date();
      
      switch(dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(blog => new Date(blog.createdAt) >= filterDate);
          break;
        case "week":
          filterDate.setDate(filterDate.getDate() - 7);
          filtered = filtered.filter(blog => new Date(blog.createdAt) >= filterDate);
          break;
        case "month":
          filterDate.setMonth(filterDate.getMonth() - 1);
          filtered = filtered.filter(blog => new Date(blog.createdAt) >= filterDate);
          break;
      }
    }

    setFilteredBlogs(filtered);
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateBlogStatus(id, status);
      toast.success(`Blog marked as ${status}`, {
        style: { background: "#0D915C", color: "#fff" }
      });
      fetchBlogs();
    } catch {
      toast.error("Failed to update status", {
        style: { background: "#013E43", color: "#fff" }
      });
    }
  };

  const handleDelete = async () => {
    try {
      setDeletingId(selectedBlog._id);
      await deleteBlog(selectedBlog._id);
      toast.success("Blog deleted successfully", {
        style: { background: "#0D915C", color: "#fff" }
      });
      setShowDeleteModal(false);
      setSelectedBlog(null);
      fetchBlogs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete blog", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setDeletingId("");
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const stats = {
    total: blogs.length,
    published: blogs.filter(b => b.status === "published").length,
    draft: blogs.filter(b => b.status === "draft").length,
    archived: blogs.filter(b => b.status === "archived").length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#DDEAE3] border-t-[#0D915C] mx-auto mb-4"></div>
          <p className="text-[#41635A]">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  if (error && blogs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-none p-8 text-center border border-[#DDEAE3]">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="text-3xl text-red-500" />
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchBlogs}
          className="px-4 py-2 bg-[#0D915C] text-white rounded-lg hover:bg-[#08764C] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="border-b border-[#DDEAE3] pb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-[#013E43] rounded-md">
              <FaBlog className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#013E43]">Blog Management</h1>
              <p className="text-sm text-[#41635A]">Create, publish, and manage blog posts</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchBlogs}
              className="p-2 text-[#41635A] hover:bg-[#F1F7F3] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/admin/blog/new"
              className="px-4 py-2 bg-[#0D915C] text-white rounded-lg font-light  transition-all flex items-center"
            >
              <FiPlus className="mr-2" />
              New Blog Post
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border-b border-[#DDEAE3] py-4 ">
          <p className="text-sm text-[#41635A]">Total Posts</p>
          <p className="text-2xl font-bold text-[#013E43]">{stats.total}</p>
        </div>
        <div className="border-b border-[#DDEAE3] py-4">
          <p className="text-sm text-[#41635A]">Published</p>
          <p className="text-2xl font-bold text-[#0D915C]">{stats.published}</p>
        </div>
        <div className="border-b border-[#DDEAE3] py-4">
          <p className="text-sm text-[#41635A]">Drafts</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
        </div>
        <div className="border-b border-[#DDEAE3] py-4 ">
          <p className="text-sm text-[#41635A]">Archived</p>
          <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-none p-4 ">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#41635A]" />
            <input
              type="text"
              placeholder="Search by title, excerpt, or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#DDEAE3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D915C] focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-[#DDEAE3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D915C] text-[#41635A]"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-[#DDEAE3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D915C] text-[#41635A]"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-[#41635A]">
          Showing {filteredBlogs.length} of {blogs.length} blog posts
        </div>
      </div>

      {/* Blogs Grid */}
      {filteredBlogs.length === 0 ? (
        <div className="border-y border-[#DDEAE3] px-6 py-12 text-center">
          <div className="w-20 h-20 bg-[#F1F7F3] rounded-full flex items-center justify-center mx-auto mb-4">
            <FaBlog className="text-3xl text-[#BBD2C6]" />
          </div>
          <h3 className="text-lg font-semibold text-[#013E43] mb-2">No blog posts found</h3>
          <p className="text-sm text-[#41635A] mb-4">
            {searchTerm || statusFilter !== "all" || dateRange !== "all"
              ? "Try adjusting your filters"
              : "You haven't created any blog posts yet"}
          </p>
          <Link
            to="/admin/blog/new"
            className="inline-flex items-center px-6 py-3 bg-[#0D915C] text-white rounded-lg font-light  transition-all"
          >
            <FiPlus className="mr-2" />
            Create Your First Blog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredBlogs.map((blog) => (
            <div
              key={blog._id}
              className="bg-white rounded-lg shadow-none border border-[#DDEAE3] overflow-hidden transition-all"
            >
              <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold text-[#013E43]">
                        {blog.title}
                      </h2>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[blog.status]}`}>
                        {statusIcons[blog.status]}
                        <span className="ml-1 capitalize">{blog.status}</span>
                      </span>
                    </div>
                    
                    <p className="text-sm text-[#41635A] mb-3 line-clamp-2">
                      {blog.excerpt}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#41635A]">
                      <span className="flex items-center">
                        <FiUser className="mr-1 text-[#0D915C]" />
                        {blog.author?.name || 'Admin'}
                      </span>
                      <span className="flex items-center">
                        <FiCalendar className="mr-1 text-[#0D915C]" />
                        {formatDate(blog.createdAt)}
                      </span>
                      {blog.category && (
                        <span className="flex items-center">
                          <FiTag className="mr-1 text-[#0D915C]" />
                          {blog.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {blog.status === "draft" && (
                      <button
                        onClick={() => handleStatusChange(blog._id, "published")}
                        className="px-3 py-2 text-sm bg-[#0D915C] text-white rounded-lg hover:bg-[#08764C] transition-colors flex items-center"
                      >
                        <FiCheckCircle className="mr-1" />
                        Publish
                      </button>
                    )}
                    {blog.status === "published" && (
                      <button
                        onClick={() => handleStatusChange(blog._id, "archived")}
                        className="px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center"
                      >
                        <FiArchive className="mr-1" />
                        Archive
                      </button>
                    )}
                    {blog.status === "archived" && (
                      <button
                        onClick={() => handleStatusChange(blog._id, "draft")}
                        className="px-3 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center"
                      >
                        <FiClock className="mr-1" />
                        Move to Draft
                      </button>
                    )}
                    <Link
                      to={`/admin/blog/${blog._id}`}
                      className="px-3 py-2 text-sm border border-[#DDEAE3] text-[#41635A] rounded-lg hover:bg-[#F1F7F3] transition-colors flex items-center"
                    >
                      <FiEdit2 className="mr-1" />
                      Edit
                    </Link>
                    <button
                      onClick={() => {
                        setSelectedBlog(blog);
                        setShowDeleteModal(true);
                      }}
                      className="px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
                    >
                      <FiTrash2 className="mr-1" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Preview Link */}
                {blog.status === "published" && (
                  <div className="mt-4 pt-3 border-t border-[#DDEAE3]">
                    <Link
                      to={`/blog/${blog.slug}`}
                      target="_blank"
                      className="text-sm text-[#0D915C] hover:text-[#075B53] flex items-center"
                    >
                      <FiEye className="mr-1" />
                      View Live Post
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBlog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-none max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <FiTrash2 className="text-3xl text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-[#013E43] mb-2">Delete Blog Post</h3>
              <p className="text-sm text-[#41635A]">
                Are you sure you want to delete "{selectedBlog.title}"? This action cannot be undone.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedBlog(null);
                }}
                className="flex-1 px-4 py-2 border border-[#DDEAE3] text-[#41635A] rounded-lg hover:bg-[#F1F7F3] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deletingId === selectedBlog._id}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deletingId === selectedBlog._id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlogsPage;
