import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  createBlog,
  getAdminBlogById,
  updateBlog
} from "../../../services/blog.service";
import { 
  FiBold, 
  FiItalic, 
  FiList, 
  FiAlignLeft, 
  FiAlignCenter, 
  FiAlignRight,
  FiAlignJustify,
  FiType,
  FiCode,
  FiMinus,
  FiClock,
  FiGlobe,
  FiTag,
  FiChevronDown,
  FiEye,
  FiSave,
  FiArrowLeft,
  FiImage,
  FiLink,
  FiRotateCcw,
  FiRotateCw
} from "react-icons/fi";
import { FaHeading, FaQuoteRight, FaListUl, FaListOl } from "react-icons/fa";
import { MdCode } from "react-icons/md";
import toast from "react-hot-toast";

const AdminBlogEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    status: "draft",
    category: "",
    tags: "",
    metaTitle: "",
    metaDescription: ""
  });
  const [coverImage, setCoverImage] = useState(null);
  const [existingCover, setExistingCover] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit.configure({
      heading: { levels: [1, 2, 3] }
    })],
    content: formData.content || "",
    onUpdate: ({ editor }) => {
      setFormData(prev => ({ ...prev, content: editor.getHTML() }));
    }
  });

  const preview = useMemo(() => {
    if (coverImage) return URL.createObjectURL(coverImage);
    return existingCover;
  }, [coverImage, existingCover]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const data = await getAdminBlogById(id);
      const blog = data.blog;

      setFormData({
        title: blog?.title || "",
        excerpt: blog?.excerpt || "",
        content: blog?.content || "",
        status: blog?.status || "draft",
        category: blog?.category || "",
        tags: blog?.tags?.join(", ") || "",
        metaTitle: blog?.metaTitle || "",
        metaDescription: blog?.metaDescription || ""
      });
      setExistingCover(blog?.coverImage || "");
      
      if (editor && blog?.content) {
        editor.commands.setContent(blog.content);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load blog");
      toast.error("Failed to load blog", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEdit) {
      fetchBlog();
    }
  }, [id]);

  useEffect(() => {
    return () => {
      if (preview && coverImage) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCover = (e) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be less than 2MB", {
          style: { background: "#013E43", color: "#fff" }
        });
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file", {
          style: { background: "#013E43", color: "#fff" }
        });
        return;
      }
      setCoverImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a title", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    if (!formData.content.trim()) {
      toast.error("Please enter content", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("excerpt", formData.excerpt);
      payload.append("content", formData.content);
      payload.append("status", formData.status);
      payload.append("category", formData.category);
      payload.append("tags", formData.tags);
      payload.append("metaTitle", formData.metaTitle);
      payload.append("metaDescription", formData.metaDescription);

      if (coverImage) {
        payload.append("coverImage", coverImage);
      }

      if (isEdit) {
        await updateBlog(id, payload);
        toast.success("Blog updated successfully", {
          style: { background: "#02BB31", color: "#fff" }
        });
      } else {
        await createBlog(payload);
        toast.success("Blog created successfully", {
          style: { background: "#02BB31", color: "#fff" }
        });
      }

      navigate("/admin/blog");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save blog");
      toast.error("Failed to save blog", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setSaving(false);
    }
  };

  const ToolbarButton = ({ onClick, isActive, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-all ${
        isActive 
          ? 'bg-[#02BB31] text-white shadow-md' 
          : 'text-[#065A57] hover:bg-[#F0F7F4] hover:text-[#013E43]'
      }`}
    >
      {children}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading blog editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/admin/blog")}
              className="p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
            >
              <FiArrowLeft className="text-xl text-[#065A57]" />
            </button>
            
            <div>
              <h1 className="text-xl font-bold text-[#013E43]">
                {isEdit ? "Edit Blog Post" : "Create Blog Post"}
              </h1>
              <p className="text-sm text-[#065A57]">
                {isEdit ? "Edit your existing blog post" : "Write and publish a new blog article"}
              </p>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
              <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
                <FiType className="mr-2 text-[#02BB31]" />
                Article Title
              </h2>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter blog title"
                className="w-full px-4 py-3 text-xl border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                required
              />
            </div>

            {/* Excerpt Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
              <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
                <FiAlignLeft className="mr-2 text-[#02BB31]" />
                Excerpt
              </h2>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                rows="3"
                placeholder="Short description of the blog post (optional)"
                className="w-full px-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors resize-none"
              />
              <p className="text-xs text-[#065A57] mt-1">
                A brief summary that will appear in blog listings
              </p>
            </div>

            {/* Content Card with TipTap Editor */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden">
              <div className="bg-[#F0F7F4] p-3 border-b border-[#A8D8C1]">
                <div className="flex flex-wrap items-center gap-1">
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    isActive={editor?.isActive('bold')}
                    title="Bold"
                  >
                    <FiBold className="text-lg" />
                  </ToolbarButton>

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    isActive={editor?.isActive('italic')}
                    title="Italic"
                  >
                    <FiItalic className="text-lg" />
                  </ToolbarButton>

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleStrike().run()}
                    isActive={editor?.isActive('strike')}
                    title="Strikethrough"
                  >
                    <span className="text-lg line-through">S</span>
                  </ToolbarButton>

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleCode().run()}
                    isActive={editor?.isActive('code')}
                    title="Code"
                  >
                    <FiCode className="text-lg" />
                  </ToolbarButton>

                  <div className="w-px h-6 bg-[#A8D8C1] mx-1"></div>

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor?.isActive('heading', { level: 1 })}
                    title="Heading 1"
                  >
                    <FaHeading className="text-lg" />
                    <span className="text-xs ml-0.5">1</span>
                  </ToolbarButton>

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor?.isActive('heading', { level: 2 })}
                    title="Heading 2"
                  >
                    <FaHeading className="text-lg" />
                    <span className="text-xs ml-0.5">2</span>
                  </ToolbarButton>

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor?.isActive('heading', { level: 3 })}
                    title="Heading 3"
                  >
                    <FaHeading className="text-lg" />
                    <span className="text-xs ml-0.5">3</span>
                  </ToolbarButton>

                  <div className="w-px h-6 bg-[#A8D8C1] mx-1"></div>

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    isActive={editor?.isActive('bulletList')}
                    title="Bullet List"
                  >
                    <FaListUl className="text-lg" />
                  </ToolbarButton>

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    isActive={editor?.isActive('orderedList')}
                    title="Numbered List"
                  >
                    <FaListOl className="text-lg" />
                  </ToolbarButton>

                  <div className="w-px h-6 bg-[#A8D8C1] mx-1"></div>

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                    isActive={editor?.isActive('blockquote')}
                    title="Quote"
                  >
                    <FaQuoteRight className="text-lg" />
                  </ToolbarButton>

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                    isActive={editor?.isActive('codeBlock')}
                    title="Code Block"
                  >
                    <MdCode className="text-lg" />
                  </ToolbarButton>

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                    title="Horizontal Rule"
                  >
                    <FiMinus className="text-lg" />
                  </ToolbarButton>

                  <div className="w-px h-6 bg-[#A8D8C1] mx-1"></div>

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().undo().run()}
                    title="Undo"
                  >
                    <FiRotateCcw className="text-lg" />
                  </ToolbarButton>

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().redo().run()}
                    title="Redo"
                  >
                    <FiRotateCw className="text-lg" />
                  </ToolbarButton>
                </div>
              </div>

              <div className="p-6">
                <EditorContent editor={editor} className="min-h-[400px] prose prose-lg max-w-none focus:outline-none" />
              </div>

              <div className="bg-[#F0F7F4] px-4 py-2 border-t border-[#A8D8C1] flex justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <span className="text-[#065A57]">
                    Words: <span className="font-medium text-[#013E43]">
                      {formData.content?.replace(/<[^>]*>/g, '').split(/\s+/).length || 0}
                    </span>
                  </span>
                  <span className="text-[#065A57]">
                    Characters: <span className="font-medium text-[#013E43]">
                      {formData.content?.replace(/<[^>]*>/g, '').length || 0}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Settings */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
              <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
                <FiSave className="mr-2 text-[#02BB31]" />
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
                      onClick={() => setFormData(prev => ({ ...prev, status: "draft" }))}
                      className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 ${
                        formData.status === "draft"
                          ? 'border-[#02BB31] bg-[#02BB31]/10 text-[#02BB31]'
                          : 'border-[#A8D8C1] text-[#065A57] hover:border-[#02BB31]'
                      }`}
                    >
                      <FiClock />
                      <span>Draft</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, status: "published" }))}
                      className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 ${
                        formData.status === "published"
                          ? 'border-[#02BB31] bg-[#02BB31]/10 text-[#02BB31]'
                          : 'border-[#A8D8C1] text-[#065A57] hover:border-[#02BB31]'
                      }`}
                    >
                      <FiGlobe />
                      <span>Publish</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Cover Image */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
              <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
                <FiImage className="mr-2 text-[#02BB31]" />
                Cover Image
              </h2>
              
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCover}
                  className="w-full px-4 py-2 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                />
                <p className="text-xs text-[#065A57] mt-1">
                  PNG, JPG up to 2MB
                </p>
              </div>

              {preview && (
                <div className="mt-4">
                  <img
                    src={preview}
                    alt="Cover preview"
                    className="w-full h-32 object-cover rounded-lg border-2 border-[#A8D8C1]"
                  />
                </div>
              )}
            </div>

            {/* Category & Tags */}
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
                    value={formData.category}
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
                    value={formData.tags}
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

            {/* SEO Settings */}
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
                    value={formData.metaTitle}
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
                    value={formData.metaDescription}
                    onChange={handleChange}
                    rows="3"
                    placeholder="SEO description (optional)"
                    className="w-full px-4 py-2 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate("/admin/blog")}
              className="px-6 py-3 text-[#065A57] border border-[#A8D8C1] rounded-lg hover:bg-[#F0F7F4] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  {isEdit ? "Update Blog" : "Publish Blog"}
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
                <FiXCircle className="text-xl text-[#065A57]" />
              </button>
            </div>
            <div className="p-6">
              {preview && (
                <img
                  src={preview}
                  alt={formData.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}
              <h1 className="text-3xl font-bold text-[#013E43] mb-4">{formData.title || "Blog Title"}</h1>
              {formData.excerpt && (
                <p className="text-lg text-[#065A57] mb-6 italic">{formData.excerpt}</p>
              )}
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: formData.content || "<p>No content yet...</p>" }}
              />
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .ProseMirror {
          outline: none;
          min-height: 400px;
        }
        .ProseMirror p {
          margin: 0.5em 0;
          color: #065A57;
        }
        .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.5em 0;
          color: #013E43;
        }
        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.5em 0;
          color: #013E43;
        }
        .ProseMirror h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 0.5em 0;
          color: #013E43;
        }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
          color: #065A57;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #02BB31;
          padding-left: 1em;
          margin: 1em 0;
          color: #065A57;
          font-style: italic;
        }
        .ProseMirror code {
          background: #F0F7F4;
          color: #02BB31;
          padding: 0.2em 0.4em;
          border-radius: 0.25em;
          font-family: monospace;
        }
        .ProseMirror pre {
          background: #013E43;
          color: #F0F7F4;
          padding: 1em;
          border-radius: 0.5em;
          font-family: monospace;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
};

export default AdminBlogEditorPage;