import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createBlog,
  getAdminBlogById,
  updateBlog
} from "../../../services/blog.service";
import RichText from "./RichText";
import {
  FiAlignLeft,
  FiClock,
  FiGlobe,
  FiTag,
  FiEye,
  FiSave,
  FiArrowLeft,
  FiImage,
  FiFileText,
  FiType,
  FiXCircle
} from "react-icons/fi";
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
  const [coverPreview, setCoverPreview] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      setError("");

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
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load blog";
      setError(message);
      toast.error(message, {
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
    if (!coverImage) {
      setCoverPreview(existingCover);
      return;
    }

    const objectUrl = URL.createObjectURL(coverImage);
    setCoverPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [coverImage, existingCover]);

  const cleanText = formData.content?.replace(/<[^>]*>/g, "").trim() || "";

  const wordCount = cleanText
    ? cleanText.split(/\s+/).filter(Boolean).length
    : 0;

  const characterCount = cleanText.length;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCover = (e) => {
    const file = e.target.files?.[0] || null;

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    setCoverImage(file);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a title", {
        style: { background: "#013E43", color: "#fff" }
      });
      return false;
    }

    if (!formData.content || !cleanText) {
      toast.error("Please enter blog content", {
        style: { background: "#013E43", color: "#fff" }
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

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
      const message = err.response?.data?.message || "Failed to save blog";
      setError(message);
      toast.error(message, {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#A8D8C1] border-t-[#02BB31]" />
          <p className="text-[#065A57]">Loading blog editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#A8D8C1] bg-white p-6 shadow-lg">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => navigate("/admin/blog")}
              className="rounded-lg p-2 transition-colors hover:bg-[#F0F7F4]"
            >
              <FiArrowLeft className="text-xl text-[#065A57]" />
            </button>

            <div>
              <h1 className="text-xl font-bold text-[#013E43]">
                {isEdit ? "Edit Blog Post" : "Create Blog Post"}
              </h1>
              <p className="text-sm text-[#065A57]">
                {isEdit
                  ? "Edit your existing blog post"
                  : "Write and publish a new blog article"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPreviewMode(true)}
            className="flex items-center rounded-lg border border-[#A8D8C1] px-4 py-2 text-[#065A57] transition-colors hover:bg-[#F0F7F4]"
          >
            <FiEye className="mr-2" />
            Preview
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-[#A8D8C1] bg-white p-6 shadow-lg">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-[#013E43]">
                <FiType className="mr-2 text-[#02BB31]" />
                Article Title
              </h2>

              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter blog title"
                className="w-full rounded-lg border-2 border-[#A8D8C1] px-4 py-3 text-xl outline-none transition-colors focus:border-[#02BB31]"
                required
              />
            </div>

            <div className="rounded-2xl border border-[#A8D8C1] bg-white p-6 shadow-lg">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-[#013E43]">
                <FiAlignLeft className="mr-2 text-[#02BB31]" />
                Excerpt
              </h2>

              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                rows="3"
                placeholder="Short description of the blog post"
                className="w-full resize-none rounded-lg border-2 border-[#A8D8C1] px-4 py-3 outline-none transition-colors focus:border-[#02BB31]"
              />

              <p className="mt-1 text-xs text-[#065A57]">
                A brief summary that will appear in blog listings.
              </p>
            </div>

            <div>
              <h2 className="mb-4 flex items-center text-lg font-semibold text-[#013E43]">
                <FiFileText className="mr-2 text-[#02BB31]" />
                Content
              </h2>

              <RichText
                value={formData.content}
                onChange={(html) =>
                  setFormData((prev) => ({
                    ...prev,
                    content: html
                  }))
                }
              />

              <div className="flex justify-between rounded-b-2xl border border-t-0 border-[#A8D8C1] bg-[#F0F7F4] px-4 py-2 text-sm">
                <span className="text-[#065A57]">
                  Words:{" "}
                  <span className="font-medium text-[#013E43]">
                    {wordCount}
                  </span>
                </span>

                <span className="text-[#065A57]">
                  Characters:{" "}
                  <span className="font-medium text-[#013E43]">
                    {characterCount}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-[#A8D8C1] bg-white p-6 shadow-lg">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-[#013E43]">
                <FiSave className="mr-2 text-[#02BB31]" />
                Publish Settings
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, status: "draft" }))
                  }
                  className={`flex items-center justify-center space-x-2 rounded-lg border-2 p-3 transition-all ${
                    formData.status === "draft"
                      ? "border-[#02BB31] bg-[#02BB31]/10 text-[#02BB31]"
                      : "border-[#A8D8C1] text-[#065A57] hover:border-[#02BB31]"
                  }`}
                >
                  <FiClock />
                  <span>Draft</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, status: "published" }))
                  }
                  className={`flex items-center justify-center space-x-2 rounded-lg border-2 p-3 transition-all ${
                    formData.status === "published"
                      ? "border-[#02BB31] bg-[#02BB31]/10 text-[#02BB31]"
                      : "border-[#A8D8C1] text-[#065A57] hover:border-[#02BB31]"
                  }`}
                >
                  <FiGlobe />
                  <span>Publish</span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[#A8D8C1] bg-white p-6 shadow-lg">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-[#013E43]">
                <FiImage className="mr-2 text-[#02BB31]" />
                Cover Image
              </h2>

              <input
                type="file"
                accept="image/*"
                onChange={handleCover}
                className="w-full rounded-lg border-2 border-[#A8D8C1] px-4 py-2 outline-none transition-colors focus:border-[#02BB31]"
              />

              <p className="mt-1 text-xs text-[#065A57]">
                PNG, JPG up to 2MB.
              </p>

              {coverPreview ? (
                <div className="mt-4">
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="h-32 w-full rounded-lg border-2 border-[#A8D8C1] object-cover"
                  />
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-[#A8D8C1] bg-white p-6 shadow-lg">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-[#013E43]">
                <FiTag className="mr-2 text-[#02BB31]" />
                Categorization
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#013E43]">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-[#A8D8C1] px-4 py-2 outline-none transition-colors focus:border-[#02BB31]"
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
                  <label className="mb-1 block text-sm font-medium text-[#013E43]">
                    Tags
                  </label>
                  <input
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="property, rental, tips"
                    className="w-full rounded-lg border-2 border-[#A8D8C1] px-4 py-2 outline-none transition-colors focus:border-[#02BB31]"
                  />

                  <p className="mt-1 text-xs text-[#065A57]">
                    Separate tags with commas.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#A8D8C1] bg-white p-6 shadow-lg">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-[#013E43]">
                <FiEye className="mr-2 text-[#02BB31]" />
                SEO Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#013E43]">
                    Meta Title
                  </label>
                  <input
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleChange}
                    placeholder="SEO title"
                    className="w-full rounded-lg border-2 border-[#A8D8C1] px-4 py-2 outline-none transition-colors focus:border-[#02BB31]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#013E43]">
                    Meta Description
                  </label>
                  <textarea
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleChange}
                    rows="3"
                    placeholder="SEO description"
                    className="w-full resize-none rounded-lg border-2 border-[#A8D8C1] px-4 py-2 outline-none transition-colors focus:border-[#02BB31]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#A8D8C1] bg-white p-6 shadow-lg">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate("/admin/blog")}
              className="rounded-lg border border-[#A8D8C1] px-6 py-3 text-[#065A57] transition-colors hover:bg-[#F0F7F4]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center rounded-lg bg-gradient-to-r from-[#02BB31] to-[#0D915C] px-8 py-3 font-semibold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
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

      {previewMode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-[#A8D8C1] bg-white p-6">
              <h2 className="text-xl font-bold text-[#013E43]">
                Blog Preview
              </h2>

              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className="rounded-lg p-2 transition-colors hover:bg-[#F0F7F4]"
              >
                <FiXCircle className="text-xl text-[#065A57]" />
              </button>
            </div>

            <div className="p-6">
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt={formData.title}
                  className="mb-6 h-64 w-full rounded-lg object-cover"
                />
              ) : null}

              <h1 className="mb-4 text-3xl font-bold text-[#013E43]">
                {formData.title || "Blog Title"}
              </h1>

              {formData.excerpt ? (
                <p className="mb-6 text-lg italic text-[#065A57]">
                  {formData.excerpt}
                </p>
              ) : null}

              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{
                  __html: formData.content || "<p>No content yet...</p>"
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
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

        .ProseMirror ul,
        .ProseMirror ol {
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

        .ProseMirror a {
          color: #02BB31;
          text-decoration: underline;
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