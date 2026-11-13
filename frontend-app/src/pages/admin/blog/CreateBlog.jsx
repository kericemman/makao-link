import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createBlog,
  getAdminBlogById,
  uploadBlogImage,
  updateBlog
} from "../../../services/blog.service";
import RichText from "./RichText";
import sanitizeHtml from "../../../utils/sanitizeHtml";
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

const ARTICLE_CATEGORIES = [
  "Getting Started",
  "Landlord Guide",
  "Tenant Guide",
  "Property Management",
  "Property Tips",
  "Market Insights",
  "Market News",
  "Safety & Legal",
  "Relocation"
];

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
    metaDescription: "",
    coverImageAlt: ""
  });
  const articleCategories = [...new Set([...ARTICLE_CATEGORIES, formData.category].filter(Boolean))];

  const [coverImage, setCoverImage] = useState(null);
  const [existingCover, setExistingCover] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  const fetchBlog = useCallback(async () => {
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
        metaDescription: blog?.metaDescription || "",
        coverImageAlt: blog?.coverImageAlt || ""
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
  }, [id]);

  useEffect(() => {
    if (isEdit) {
      fetchBlog();
    }
  }, [fetchBlog, isEdit]);

  useEffect(() => {
    if (!coverImage) {
      setCoverPreview(existingCover);
      return;
    }

    const objectUrl = URL.createObjectURL(coverImage);
    setCoverPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [coverImage, existingCover]);

  const cleanText = formData.content?.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim() || "";

  const wordCount = cleanText
    ? cleanText.split(/\s+/).filter(Boolean).length
    : 0;

  const characterCount = cleanText.length;
  const searchPreviewTitle = formData.metaTitle.trim() || formData.title.trim() || "Article title";
  const searchPreviewDescription = formData.metaDescription.trim() || formData.excerpt.trim() || "Your article summary will appear here when it is added.";

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

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image must be less than 20MB", {
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

    if (formData.status === "published" && !cleanText) {
      toast.error("Add article content before publishing. You can save this as a draft meanwhile.", {
        style: { background: "#013E43", color: "#fff" }
      });
      return false;
    }

    if (formData.status === "published" && !formData.excerpt.trim()) {
      toast.error("Add a short summary before publishing.", {
        style: { background: "#013E43", color: "#fff" }
      });
      return false;
    }

    if (formData.status === "published" && !formData.category) {
      toast.error("Choose a category before publishing.", {
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
      payload.append("coverImageAlt", formData.coverImageAlt);

      if (coverImage) {
        payload.append("coverImage", coverImage);
      }

      if (isEdit) {
        await updateBlog(id, payload);
        toast.success("Blog updated successfully", {
          style: { background: "#0D915C", color: "#fff" }
        });
      } else {
        await createBlog(payload);
        toast.success("Blog created successfully", {
          style: { background: "#0D915C", color: "#fff" }
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
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#DDEAE3] border-t-[#0D915C]" />
          <p className="text-[#41635A]">Loading blog editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#DDEAE3] bg-white p-6 shadow-none">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => navigate("/admin/blog")}
              className="rounded-lg p-2 transition-colors hover:bg-[#F1F7F3]"
            >
              <FiArrowLeft className="text-xl text-[#41635A]" />
            </button>

            <div>
              <h1 className="text-xl font-bold text-[#013E43]">
                {isEdit ? "Edit Blog Post" : "Create Blog Post"}
              </h1>
              <p className="text-sm text-[#41635A]">
                {isEdit
                  ? "Edit your existing blog post"
                  : "Write and publish a new blog article"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPreviewMode(true)}
            className="flex items-center rounded-lg border border-[#DDEAE3] px-4 py-2 text-[#41635A] transition-colors hover:bg-[#F1F7F3]"
          >
            <FiEye className="mr-2" />
            Preview
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-lg border border-[#DDEAE3] bg-white p-6 shadow-none">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-[#013E43]">
                <FiType className="mr-2 text-[#0D915C]" />
                Article Title
              </h2>

              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter blog title"
                maxLength={180}
                className="w-full rounded-lg border-2 border-[#DDEAE3] px-4 py-3 text-xl outline-none transition-colors focus:border-[#0D915C]"
                required
              />
              <p className="mt-2 text-right text-xs text-[#41635A]">{formData.title.length}/180</p>
            </div>

            <div className="rounded-lg border border-[#DDEAE3] bg-white p-6 shadow-none">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-[#013E43]">
                <FiAlignLeft className="mr-2 text-[#0D915C]" />
                Excerpt
              </h2>

              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                rows="3"
                placeholder="Short description of the blog post"
                maxLength={300}
                className="w-full resize-none rounded-lg border-2 border-[#DDEAE3] px-4 py-3 outline-none transition-colors focus:border-[#0D915C]"
              />

              <p className="mt-1 flex justify-between text-xs text-[#41635A]">
                <span>A useful summary shown on article cards and search previews.</span>
                <span>{formData.excerpt.length}/300</span>
              </p>
            </div>

            <div>
              <h2 className="mb-4 flex items-center text-lg font-semibold text-[#013E43]">
                <FiFileText className="mr-2 text-[#0D915C]" />
                Content
              </h2>

              <RichText
                value={formData.content}
                onUploadImage={uploadBlogImage}
                stickyToolbar
                onChange={(html) =>
                  setFormData((prev) => ({
                    ...prev,
                    content: html
                  }))
                }
              />

              <div className="flex justify-between rounded-b-2xl border border-t-0 border-[#DDEAE3] bg-[#F1F7F3] px-4 py-2 text-sm">
                <span className="text-[#41635A]">
                  Words:{" "}
                  <span className="font-medium text-[#013E43]">
                    {wordCount}
                  </span>
                </span>

                <span className="text-[#41635A]">
                  Characters:{" "}
                  <span className="font-medium text-[#013E43]">
                    {characterCount}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-[#DDEAE3] bg-white p-6 shadow-none">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-[#013E43]">
                <FiSave className="mr-2 text-[#0D915C]" />
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
                      ? "border-[#0D915C] bg-[#0D915C]/10 text-[#0D915C]"
                      : "border-[#DDEAE3] text-[#41635A] hover:border-[#0D915C]"
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
                      ? "border-[#0D915C] bg-[#0D915C]/10 text-[#0D915C]"
                      : "border-[#DDEAE3] text-[#41635A] hover:border-[#0D915C]"
                  }`}
                >
                  <FiGlobe />
                  <span>Publish</span>
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-[#DDEAE3] bg-white p-6 shadow-none">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-[#013E43]">
                <FiImage className="mr-2 text-[#0D915C]" />
                Cover Image
              </h2>

              <input
                type="file"
                accept="image/*"
                onChange={handleCover}
                className="w-full rounded-lg border-2 border-[#DDEAE3] px-4 py-2 outline-none transition-colors focus:border-[#0D915C]"
              />

              <p className="mt-1 text-xs text-[#41635A]">
                Use a clear, landscape image. PNG, JPG, WEBP, or AVIF up to 20MB.
              </p>

              <label className="mt-4 block text-sm font-medium text-[#013E43]">
                Image description (alt text)
                <input
                  name="coverImageAlt"
                  value={formData.coverImageAlt}
                  onChange={handleChange}
                  maxLength={180}
                  placeholder="Describe the cover image for readers using assistive technology"
                  className="mt-1 w-full rounded-lg border-2 border-[#DDEAE3] px-3 py-2 text-sm outline-none focus:border-[#0D915C]"
                />
              </label>

              {coverPreview ? (
                <div className="mt-4">
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="h-32 w-full rounded-lg border-2 border-[#DDEAE3] object-cover"
                  />
                </div>
              ) : null}
            </div>

            <div className="rounded-lg border border-[#DDEAE3] bg-white p-6 shadow-none">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-[#013E43]">
                <FiTag className="mr-2 text-[#0D915C]" />
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
                    className="w-full rounded-lg border-2 border-[#DDEAE3] px-4 py-2 outline-none transition-colors focus:border-[#0D915C]"
                  >
                    <option value="">Select a category</option>
                    {articleCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
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
                    className="w-full rounded-lg border-2 border-[#DDEAE3] px-4 py-2 outline-none transition-colors focus:border-[#0D915C]"
                  />

                  <p className="mt-1 text-xs text-[#41635A]">
                    Separate tags with commas.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-y border-[#DDEAE3] py-4">
              <h3 className="text-sm font-semibold text-[#013E43]">Publishing readiness</h3>
              <ul className="mt-3 space-y-2 text-sm text-[#41635A]">
                <li className="flex items-center justify-between"><span>Title</span><span className={formData.title.trim() ? "text-[#0D915C]" : "text-[#9A5B13]"}>{formData.title.trim() ? "Ready" : "Needed"}</span></li>
                <li className="flex items-center justify-between"><span>Article content</span><span className={cleanText ? "text-[#0D915C]" : "text-[#9A5B13]"}>{cleanText ? `${wordCount} words` : "Needed to publish"}</span></li>
                <li className="flex items-center justify-between"><span>Summary and category</span><span className={formData.excerpt.trim() && formData.category ? "text-[#0D915C]" : "text-[#9A5B13]"}>{formData.excerpt.trim() && formData.category ? "Ready" : "Needed to publish"}</span></li>
                <li className="flex items-center justify-between"><span>Cover image</span><span className={coverPreview ? "text-[#0D915C]" : "text-[#41635A]"}>{coverPreview ? "Added" : "Optional"}</span></li>
              </ul>
            </div>

            <div className="rounded-lg border border-[#DDEAE3] bg-white p-6 shadow-none">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-[#013E43]">
                <FiEye className="mr-2 text-[#0D915C]" />
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
                    maxLength={70}
                    className="w-full rounded-lg border-2 border-[#DDEAE3] px-4 py-2 outline-none transition-colors focus:border-[#0D915C]"
                  />
                  <p className="mt-1 text-right text-xs text-[#41635A]">{formData.metaTitle.length}/70</p>
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
                    maxLength={170}
                    className="w-full resize-none rounded-lg border-2 border-[#DDEAE3] px-4 py-2 outline-none transition-colors focus:border-[#0D915C]"
                  />
                  <p className="mt-1 text-right text-xs text-[#41635A]">{formData.metaDescription.length}/170</p>
                </div>
                <div className="rounded-md border border-[#DDEAE3] bg-[#F8FBF9] p-4" aria-live="polite">
                  <p className="text-xs font-semibold text-[#41635A]">Search result preview</p>
                  <p className="mt-2 truncate text-lg font-medium text-[#1A0DAB]">{searchPreviewTitle}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#4D5156]">{searchPreviewDescription}</p>
                  <p className="mt-2 text-xs text-[#41635A]">Uses the article title and summary when custom metadata is blank.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[#DDEAE3] bg-white p-6 shadow-none">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate("/admin/blog")}
              className="rounded-lg border border-[#DDEAE3] px-6 py-3 text-[#41635A] transition-colors hover:bg-[#F1F7F3]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center rounded-lg bg-[#0D915C] px-8 py-3 font-semibold text-white transition-all  disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  {formData.status === "draft" ? "Save Draft" : isEdit ? "Update Article" : "Publish Article"}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {previewMode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-none">
            <div className="sticky top-0 flex items-center justify-between border-b border-[#DDEAE3] bg-white p-6">
              <h2 className="text-xl font-bold text-[#013E43]">
                Blog Preview
              </h2>

              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className="rounded-lg p-2 transition-colors hover:bg-[#F1F7F3]"
              >
                <FiXCircle className="text-xl text-[#41635A]" />
              </button>
            </div>

            <div className="p-6">
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt={formData.coverImageAlt || formData.title}
                  className="mb-6 h-64 w-full rounded-lg object-cover"
                />
              ) : null}

              <h1 className="mb-4 text-3xl font-bold text-[#013E43]">
                {formData.title || "Blog Title"}
              </h1>

              {formData.category && <p className="mb-3 text-sm font-semibold text-[#0D915C]">{formData.category}</p>}

              {formData.excerpt ? (
                <p className="mb-6 text-lg italic text-[#41635A]">
                  {formData.excerpt}
                </p>
              ) : null}

              <div
                className="rich-content"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(formData.content || "<p>No content yet...</p>")
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        .ProseMirror {
          outline: none;
          min-height: 460px;
          max-width: 100%;
          overflow-wrap: anywhere;
          padding: 1rem;
        }

        .ProseMirror p {
          margin: 0.5em 0;
          color: #41635A;
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
          color: #41635A;
        }

        .ProseMirror blockquote {
          border-left: 4px solid #0D915C;
          padding-left: 1em;
          margin: 1em 0;
          color: #41635A;
          font-style: italic;
        }

        .ProseMirror a {
          color: #0D915C;
          text-decoration: underline;
        }

        .ProseMirror code {
          background: #F1F7F3;
          color: #0D915C;
          padding: 0.2em 0.4em;
          border-radius: 0.25em;
          font-family: monospace;
        }

        .ProseMirror pre {
          background: #013E43;
          color: #F1F7F3;
          padding: 1em;
          border-radius: 0.5em;
          font-family: monospace;
          overflow-x: auto;
        }

        @media (max-width: 640px) {
          .ProseMirror { min-height: 320px; padding: 0.75rem; }
        }
      `}</style>
    </div>
  );
};

export default AdminBlogEditorPage;
