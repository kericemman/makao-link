import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPublishedBlogBySlug } from "../../../services/blog.service";
import {
  FiCalendar,
  FiUser,
  FiClock,
  FiBookmark,
  FiHeart,
  FiFacebook,
  FiTwitter,
  FiLinkedin,
  FiLink,
  FiArrowLeft,
  FiChevronRight,
  FiTag,
  FiAlertCircle
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";
import sanitizeHtml from "../../../utils/sanitizeHtml";

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "";

const getImageUrl = (image) => {
  if (!image) return "";

  if (typeof image === "object" && image.url) {
    return image.url;
  }

  if (typeof image === "string" && image.startsWith("http")) {
    return image;
  }

  if (typeof image === "string" && image.startsWith("/")) {
    return `${API_BASE_URL}${image}`;
  }

  return `${API_BASE_URL}/${image}`;
};

const createHeadingId = (text, index) => {
  return `heading-${index}-${String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
};

const BlogDetailPage = () => {
  const { slug } = useParams();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeHeading, setActiveHeading] = useState("");
  const [headings, setHeadings] = useState([]);
  const [scrollProgress, setScrollProgress] = useState(0);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const data = await getPublishedBlogBySlug(slug);
      setBlog(data.blog);
    } catch (error) {
      toast.error("Failed to load blog post", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchBlog();
  }, [slug]);

  useEffect(() => {
    if (!blog?.content) return;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = sanitizeHtml(blog.content);

    const headingElements = tempDiv.querySelectorAll("h1, h2, h3");

    const extractedHeadings = Array.from(headingElements).map(
      (element, index) => {
        const text = element.textContent || "";

        return {
          id: createHeadingId(text, index),
          text,
          level: element.tagName.toLowerCase()
        };
      }
    );

    setHeadings(extractedHeadings);
  }, [blog]);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      const progress =
        totalScroll > 0 ? (window.scrollY / totalScroll) * 100 : 0;

      setScrollProgress(Math.min(100, progress));

      const headingElements = document.querySelectorAll(".blog-content h1, .blog-content h2, .blog-content h3");
      const scrollPosition = window.scrollY + 120;

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i];

        if (element.offsetTop <= scrollPosition) {
          setActiveHeading(element.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const calculateReadingTime = () => {
    if (!blog?.content) return 1;

    const wordsPerMinute = 200;
    const wordCount = blog.content
      .replace(/<[^>]*>/g, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  const processContent = () => {
    if (!blog?.content) return "";

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = sanitizeHtml(blog.content);

    const headingElements = tempDiv.querySelectorAll("h1, h2, h3");

    headingElements.forEach((element, index) => {
      const text = element.textContent || "";
      element.id = createHeadingId(text, index);
    });

    return tempDiv.innerHTML;
  };

  const shareUrl = window.location.href;
  const shareTitle = blog?.title || "Check out this article";

  const handleShare = (platform) => {
    let url = "";

    switch (platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}`;
        break;

      case "twitter":
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          shareUrl
        )}&text=${encodeURIComponent(shareTitle)}`;
        break;

      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          shareUrl
        )}`;
        break;

      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(
          `${shareTitle} ${shareUrl}`
        )}`;
        break;

      case "copy":
        navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!", {
          style: { background: "#02BB31", color: "#fff" }
        });
        return;

      default:
        return;
    }

    if (url) window.open(url, "_blank");
  };

  const scrollToHeading = (id) => {
    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#A8D8C1] border-t-[#02BB31]" />
          <p className="text-[#065A57]">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="mx-auto mb-4 text-4xl text-red-500" />
          <h2 className="mb-2 text-2xl font-bold text-[#013E43]">
            Article not found
          </h2>
          <p className="mb-4 text-[#065A57]">
            The article you're looking for doesn't exist.
          </p>

          <Link
            to="/blog"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#02BB31] to-[#0D915C] px-6 py-3 font-semibold text-white"
          >
            <FiArrowLeft />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const coverImageUrl = getImageUrl(blog.coverImage);
  const processedContent = processContent();

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      <div className="border-b border-[#A8D8C1] bg-white">
        <div className="mx-auto max-w-9xl px-4 py-12 sm:px-6 lg:px-8 md:py-16">
          <Link
            to="/blog"
            className="mb-6 inline-flex items-center gap-2 text-[#065A57] hover:text-[#013E43]"
          >
            <FiArrowLeft />
            Back to Blog
          </Link>

          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              {blog.category && (
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#02BB31]/10 px-3 py-1">
                  <FiTag className="text-sm text-[#02BB31]" />
                  <span className="text-sm font-medium text-[#02BB31]">
                    {blog.category}
                  </span>
                </div>
              )}

              <h1 className="mb-4 font-bold text-[#013E43] text-lg md:text-4xl lg:text-5xl">
                {blog.title}
              </h1>

              {blog.excerpt && (
                <p className="mb-6 md:text-lg text-sm leading-relaxed text-[#065A57]">
                  {blog.excerpt}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-6 text-sm text-[#065A57]">
                {/* <span className="flex items-center gap-2">
                  <FiUser className="text-[#02BB31]" />
                  {blog.author?.name || "RendaHomes"}
                </span> */}

                <span className="flex items-center gap-2">
                  <FiCalendar className="text-[#02BB31]" />
                  {formatDate(blog.publishedAt || blog.createdAt)}
                </span>

                <span className="flex items-center gap-2">
                  <FiClock className="text-[#02BB31]" />
                  {calculateReadingTime()} min read
                </span>
              </div>
            </div>

            {coverImageUrl && (
              <div className="overflow-hidden rounded-2xl shadow-xl">
                <img
                  src={coverImageUrl}
                  alt={blog.title}
                  className="h-[280px] w-full object-cover transition-transform duration-500 hover:scale-105 md:h-[320px]"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-9xl px-2 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <main className="lg:w-[70%]">
            <div className="p-3 md:p-8">
              <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#065A57]">
                  Share this article:
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleShare("facebook")}
                    className="rounded-lg bg-[#1877F2]/10 p-2 text-[#1877F2]"
                  >
                    <FiFacebook />
                  </button>

                  <button
                    onClick={() => handleShare("twitter")}
                    className="rounded-lg bg-[#1DA1F2]/10 p-2 text-[#1DA1F2]"
                  >
                    <FiTwitter />
                  </button>

                  <button
                    onClick={() => handleShare("linkedin")}
                    className="rounded-lg bg-[#0A66C2]/10 p-2 text-[#0A66C2]"
                  >
                    <FiLinkedin />
                  </button>

                  <button
                    onClick={() => handleShare("whatsapp")}
                    className="rounded-lg bg-[#25D366]/10 p-2 text-[#25D366]"
                  >
                    <FaWhatsapp />
                  </button>

                  <button
                    onClick={() => handleShare("copy")}
                    className="rounded-lg bg-[#F0F7F4] p-2 text-[#065A57]"
                  >
                    <FiLink />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 text-[#065A57]">
                  <FiHeart />
                  <span className="text-sm">Like</span>
                </button>

                <button className="flex items-center gap-2 px-4 py-2 text-[#065A57]">
                  <FiBookmark />
                  <span className="text-sm">Save</span>
                </button>
              </div>
            </div>
          </main>

          <aside className="lg:w-[30%]">
            <div className="sticky top-24 rounded-2xl border border-[#A8D8C1] bg-white p-6 shadow-lg">
              <h3 className="mb-4 flex items-center text-lg font-bold text-[#013E43]">
                <FiBookmark className="mr-2 text-[#02BB31]" />
                Table of Contents
              </h3>

              {headings.length > 0 ? (
                <nav className="max-h-[400px] space-y-2 overflow-y-auto pr-2">
                  {headings.map((heading) => (
                    <button
                      key={heading.id}
                      onClick={() => scrollToHeading(heading.id)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-all ${
                        activeHeading === heading.id
                          ? "bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white"
                          : "text-[#065A57] hover:bg-[#F0F7F4] hover:text-[#013E43]"
                      }`}
                      style={{
                        paddingLeft:
                          heading.level === "h3"
                            ? "2rem"
                            : heading.level === "h2"
                            ? "1rem"
                            : "0.5rem"
                      }}
                    >
                      <div className="flex items-start">
                        <FiChevronRight className="mr-2 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{heading.text}</span>
                      </div>
                    </button>
                  ))}
                </nav>
              ) : (
                <p className="text-sm italic text-[#065A57]">
                  No headings found in this article
                </p>
              )}

              <div className="mt-6 border-t border-[#A8D8C1] pt-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-[#065A57]">Reading progress</span>
                  <span className="font-medium text-[#013E43]">
                    {Math.round(scrollProgress)}%
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0F7F4]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#02BB31] to-[#0D915C]"
                    style={{ width: `${scrollProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        .blog-content {
          color: #065A57;
          line-height: 1.8;
        }

        .blog-content h1 {
          font-size: 2em;
          font-weight: 700;
          margin: 1.5em 0 0.75em;
          color: #013E43;
        }

        .blog-content h1:first-child {
          margin-top: 0;
        }

        .blog-content h2 {
          font-size: 1.5em;
          font-weight: 700;
          margin: 1.25em 0 0.75em;
          color: #013E43;
          padding-bottom: 0.5em;
          border-bottom: 2px solid #A8D8C1;
        }

        .blog-content h3 {
          font-size: 1.25em;
          font-weight: 700;
          margin: 1em 0 0.5em;
          color: #013E43;
        }

        .blog-content p {
          margin: 1em 0;
          line-height: 1.8;
        }

        .blog-content ul {
          list-style-type: disc;
          padding-left: 2em;
          margin: 1em 0;
        }

        .blog-content ol {
          list-style-type: decimal;
          padding-left: 2em;
          margin: 1em 0;
        }

        .blog-content li {
          display: list-item;
          margin: 0.5em 0;
        }

        .blog-content blockquote {
          border-left: 4px solid #02BB31;
          margin: 1.5em 0;
          padding: 0.5em 0 0.5em 1.5em;
          font-style: italic;
          color: #065A57;
          background: #F0F7F4;
          border-radius: 0 8px 8px 0;
        }

        .blog-content code {
          background: #F0F7F4;
          color: #02BB31;
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9em;
        }

        .blog-content pre {
          background: #013E43;
          color: #F0F7F4;
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
          margin: 1.5em 0;
        }

        .blog-content pre code {
          background: transparent;
          color: inherit;
          padding: 0;
        }

        .blog-content a {
          color: #02BB31;
          text-decoration: underline;
        }

        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 1.5em 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .blog-content hr {
          border: none;
          border-top: 2px solid #A8D8C1;
          margin: 2em 0;
        }

        .blog-content strong {
          font-weight: 700;
          color: #013E43;
        }

        .blog-content em {
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default BlogDetailPage;
