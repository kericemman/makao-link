import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { createBlog } from "../../../services/blog.service"
import BlogEditor from "../../../components/editor/RichTextEditor"
import { 
  FiFileText, 
  FiType, 
  FiAlignLeft, 
  FiImage,
  FiTag,
  FiEye,
  FiSave,
  FiX,
  FiClock,
  FiGlobe,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertCircle,
  FiUpload,
  FiTrash2,
  FiCalendar,
  FiUser
} from "react-icons/fi"
import { FaBlog, FaWordpress } from "react-icons/fa"
import toast from "react-hot-toast"

function CreateBlog() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [coverImageFile, setCoverImageFile] = useState(null)
  const [coverImagePreview, setCoverImagePreview] = useState("")
  const [publishDate, setPublishDate] = useState("")

  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    status: "draft",
    category: "",
    tags: "",
    coverImage: "",
    metaTitle: "",
    metaDescription: "",
    slug: "",
    publishedAt: null
  })

  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({
      ...form,
      [name]: value
    })
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }

    // Auto-generate slug from title
    if (name === "title") {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      
      setForm(prev => ({
        ...prev,
        title: value,
        slug: generatedSlug
      }))
    }
  }

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file", {
          style: { background: "#013E43", color: "#fff" }
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB", {
          style: { background: "#013E43", color: "#fff" }
        })
        return
      }

      setCoverImageFile(file)
      const previewUrl = URL.createObjectURL(file)
      setCoverImagePreview(previewUrl)
      
      // Clear any URL input
      setForm(prev => ({ ...prev, coverImage: "" }))
    }
  }

  const removeCoverImage = () => {
    setCoverImageFile(null)
    setCoverImagePreview("")
    if (coverImagePreview) {
      URL.revokeObjectURL(coverImagePreview)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!form.title.trim()) newErrors.title = "Title is required"
    if (!form.content.trim()) newErrors.content = "Content is required"
    if (!form.slug.trim()) newErrors.slug = "Slug is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fill in all required fields", {
        style: { background: "#013E43", color: "#fff" }
      })
      return
    }

    try {
      setLoading(true)

      const formData = new FormData()

      // Parse tags from comma-separated string
      const tagsArray = form.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      
      // Append all form fields
      Object.keys(form).forEach(key => {
        if (key === 'tags') {
          formData.append('tags', JSON.stringify(tagsArray))
        } else if (key === 'publishedAt') {
          // Handle published date
          if (form.status === 'published') {
            formData.append('publishedAt', publishDate || new Date().toISOString())
          }
        } else {
          formData.append(key, form[key])
        }
      })

      // Append cover image if uploaded
      if (coverImageFile) {
        formData.append("coverImage", coverImageFile)
      }

      await createBlog(formData)

      toast.success("Blog created successfully!", {
        style: {
          background: "#02BB31",
          color: "#fff",
        },
        duration: 3000
      })

      // Clean up object URLs
      if (coverImagePreview) {
        URL.revokeObjectURL(coverImagePreview)
      }

      // Redirect to blogs list
      setTimeout(() => {
        navigate("/admin/blogs")
      }, 2000)

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create blog",
        {
          style: {
            background: "#013E43",
            color: "#fff",
          }
        }
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link
              to="/admin/blogs"
              className="p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
            >
              <FiArrowLeft className="text-xl text-[#065A57]" />
            </Link>
            <div className="p-3 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl">
              <FaBlog className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">Create Blog Post</h1>
              <p className="text-sm text-[#065A57]">Write and publish a new blog article</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className="px-4 py-2 text-[#065A57] border border-[#A8D8C1] rounded-lg hover:bg-[#F0F7F4] transition-colors flex items-center"
            >
              <FiEye className="mr-2" />
              {previewMode ? "Edit" : "Preview"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
              <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
                <FiType className="mr-2 text-[#02BB31]" />
                Article Title
              </h2>
              <div className="space-y-4">
                <div>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Enter blog title"
                    className={`w-full px-4 py-3 text-xl border-2 rounded-lg outline-none transition-colors ${
                      errors.title
                        ? 'border-red-400 focus:border-red-500 bg-red-50'
                        : 'border-[#A8D8C1] focus:border-[#02BB31]'
                    }`}
                  />
                  {errors.title && (
                    <p className="text-xs text-red-500 mt-1">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    placeholder="url-friendly-version-of-title"
                    className={`w-full px-4 py-2 border-2 rounded-lg outline-none transition-colors ${
                      errors.slug
                        ? 'border-red-400 focus:border-red-500 bg-red-50'
                        : 'border-[#A8D8C1] focus:border-[#02BB31]'
                    }`}
                  />
                  {errors.slug && (
                    <p className="text-xs text-red-500 mt-1">{errors.slug}</p>
                  )}
                  <p className="text-xs text-[#065A57] mt-1">URL-friendly version of the title (auto-generated)</p>
                </div>
              </div>
            </div>

            {/* Excerpt Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
              <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
                <FiAlignLeft className="mr-2 text-[#02BB31]" />
                Excerpt
              </h2>
              <textarea
                name="excerpt"
                value={form.excerpt}
                onChange={handleChange}
                rows="3"
                placeholder="Short description of the blog post (optional)"
                className="w-full px-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors resize-none"
              />
              <p className="text-xs text-[#065A57] mt-1">
                A brief summary that will appear in blog listings
              </p>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
              <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
                <FiFileText className="mr-2 text-[#02BB31]" />
                Content
              </h2>
              <BlogEditor
                value={form.content}
                onChange={(content) =>
                  setForm({ ...form, content })
                }
              />
              {errors.content && (
                <p className="text-xs text-red-500 mt-2">{errors.content}</p>
              )}
            </div>
          </div>

          {/* Right Column - Settings */}
          <div className="space-y-6">
            {/* Publish Settings Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
              <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
                <FiGlobe className="mr-2 text-[#02BB31]" />
                Publish Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-2">
                    Status
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setForm({ ...form, status: "draft", publishedAt: null })
                        setPublishDate("")
                      }}
                      className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 ${
                        form.status === "draft"
                          ? 'border-[#02BB31] bg-[#02BB31]/10 text-[#02BB31]'
                          : 'border-[#A8D8C1] text-[#065A57] hover:border-[#02BB31]'
                      }`}
                    >
                      <FiClock />
                      <span>Draft</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm({ ...form, status: "published" })
                        if (!publishDate) {
                          setPublishDate(new Date().toISOString().split('T')[0])
                        }
                      }}
                      className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 ${
                        form.status === "published"
                          ? 'border-[#02BB31] bg-[#02BB31]/10 text-[#02BB31]'
                          : 'border-[#A8D8C1] text-[#065A57] hover:border-[#02BB31]'
                      }`}
                    >
                      <FiGlobe />
                      <span>Publish</span>
                    </button>
                  </div>
                </div>

                {form.status === "published" && (
                  <div>
                    <label className="block text-sm font-medium text-[#013E43] mb-1">
                      Publish Date
                    </label>
                    <div className="relative">
                      <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#02BB31]" />
                      <input
                        type="date"
                        value={publishDate}
                        onChange={(e) => setPublishDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                      />
                    </div>
                    <p className="text-xs text-[#065A57] mt-1">
                      Set a future date to schedule publication
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Category & Tags Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
              <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
                <FiTag className="mr-2 text-[#02BB31]" />
                Categorization
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                  >
                    <option value="">Select a category</option>
                    <option value="Property Tips">Property Tips</option>
                    <option value="Market News">Market News</option>
                    <option value="Tenant Guide">Tenant Guide</option>
                    <option value="Landlord Guide">Landlord Guide</option>
                    <option value="Relocation">Relocation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
                    Tags
                  </label>
                  <input
                    name="tags"
                    value={form.tags}
                    onChange={handleChange}
                    placeholder="property, rental, tips (comma separated)"
                    className="w-full px-4 py-2 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                  />
                  <p className="text-xs text-[#065A57] mt-1">
                    Separate tags with commas
                  </p>
                </div>
              </div>
            </div>

            {/* Cover Image Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
              <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
                <FiImage className="mr-2 text-[#02BB31]" />
                Cover Image
              </h2>
              
              <div className="space-y-4">
                {/* Local Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-2">
                    Upload from Computer
                  </label>
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                    coverImagePreview ? 'border-[#02BB31] bg-[#02BB31]/5' : 'border-[#A8D8C1] hover:border-[#02BB31]'
                  }`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageChange}
                      className="hidden"
                      id="cover-image-upload"
                    />
                    <label
                      htmlFor="cover-image-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <FiUpload className="text-2xl text-[#065A57] mb-2" />
                      <span className="text-sm text-[#065A57]">
                        Click to upload cover image
                      </span>
                      <span className="text-xs text-[#065A57] mt-1">
                        PNG, JPG, GIF up to 5MB
                      </span>
                    </label>
                  </div>
                </div>

                {/* Image Preview */}
                {coverImagePreview && (
                  <div className="relative">
                    <img
                      src={coverImagePreview}
                      alt="Cover preview"
                      className="w-full h-32 object-cover rounded-lg border-2 border-[#A8D8C1]"
                    />
                    <button
                      type="button"
                      onClick={removeCoverImage}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                )}

                {/* OR Separator */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#A8D8C1]"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-[#065A57]">OR</span>
                  </div>
                </div>

                {/* Image URL Input */}
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
                    Image URL
                  </label>
                  <input
                    name="coverImage"
                    value={form.coverImage}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                    disabled={!!coverImageFile}
                  />
                  <p className="text-xs text-[#065A57] mt-1">
                    Enter a URL or upload from your computer
                  </p>
                </div>
              </div>
            </div>

            {/* SEO Settings Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
              <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
                <FiEye className="mr-2 text-[#02BB31]" />
                SEO Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
                    Meta Title
                  </label>
                  <input
                    name="metaTitle"
                    value={form.metaTitle}
                    onChange={handleChange}
                    placeholder="SEO title (optional)"
                    className="w-full px-4 py-2 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
                    Meta Description
                  </label>
                  <textarea
                    name="metaDescription"
                    value={form.metaDescription}
                    onChange={handleChange}
                    rows="3"
                    placeholder="SEO description (optional)"
                    className="w-full px-4 py-2 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Author Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
              <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
                <FiUser className="mr-2 text-[#02BB31]" />
                Author Information
              </h2>
              
              <div className="p-4 bg-[#F0F7F4] rounded-lg">
                <p className="text-sm text-[#065A57]">
                  The currently logged-in user will be set as the author automatically.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <div className="flex justify-end space-x-3">
            <Link
              to="/admin/blogs"
              className="px-6 py-3 text-[#065A57] border border-[#A8D8C1] rounded-lg hover:bg-[#F0F7F4] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  {form.status === "published" ? "Publish Blog" : "Save Draft"}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Preview Modal */}
      {previewMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#A8D8C1] p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#013E43]">Blog Preview</h2>
              <button
                onClick={() => setPreviewMode(false)}
                className="p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
              >
                <FiX className="text-xl text-[#065A57]" />
              </button>
            </div>
            <div className="p-6">
              {/* Preview Cover Image */}
              {(coverImagePreview || form.coverImage) && (
                <img
                  src={coverImagePreview || form.coverImage}
                  alt={form.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}
              <h1 className="text-3xl font-bold text-[#013E43] mb-4">{form.title || "Blog Title"}</h1>
              
              {/* Meta Info */}
              <div className="flex items-center space-x-4 mb-4 text-sm text-[#065A57]">
                <span className="flex items-center">
                  <FiCalendar className="mr-1 text-[#02BB31]" />
                  {publishDate || new Date().toLocaleDateString()}
                </span>
                <span className="flex items-center">
                  <FiUser className="mr-1 text-[#02BB31]" />
                  Current User
                </span>
                {form.category && (
                  <span className="px-2 py-1 bg-[#02BB31]/10 text-[#02BB31] rounded-full text-xs">
                    {form.category}
                  </span>
                )}
              </div>

              {form.excerpt && (
                <p className="text-lg text-[#065A57] mb-6 italic border-l-4 border-[#02BB31] pl-4">
                  {form.excerpt}
                </p>
              )}
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: form.content || "<p>No content yet...</p>" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateBlog