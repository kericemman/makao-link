import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPublishedBlogBySlug } from "../../../services/blog.service";
import { 
  FiCalendar, 
  FiUser, 
  FiClock, 
  FiShare2,
  FiBookmark,
  FiHeart,
  FiFacebook,
  FiTwitter,
  FiLinkedin,
  FiLink,
  FiArrowLeft,
  FiChevronRight,
  FiChevronLeft,
  FiMessageSquare,
  FiTag,
  FiEye
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";

const BlogDetailPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);
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
    fetchBlog();
  }, [slug]);

  useEffect(() => {
    if (blog?.content) {
      extractHeadings();
    }
  }, [blog]);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalScroll) * 100;
      setScrollProgress(Math.min(100, progress));

      const headingElements = document.querySelectorAll('h1, h2, h3');
      const scrollPosition = window.scrollY + 100;

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i];
        if (element.offsetTop <= scrollPosition) {
          setActiveHeading(element.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  const extractHeadings = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = blog.content;
    const headingElements = tempDiv.querySelectorAll('h1, h2, h3');
    
    const extractedHeadings = [];
    headingElements.forEach((element, index) => {
      const text = element.textContent || '';
      const level = element.tagName.toLowerCase();
      const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      
      extractedHeadings.push({ id, text, level });
    });
    
    setHeadings(extractedHeadings);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateReadingTime = () => {
    if (!blog?.content) return 1;
    const wordsPerMinute = 200;
    const wordCount = blog.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const shareUrl = window.location.href;
  const shareTitle = blog?.title || "Check out this article";

  const handleShare = (platform) => {
    let url = "";
    switch(platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!", {
          style: { background: "#02BB31", color: "#fff" }
        });
        return;
    }
    if (url) window.open(url, "_blank");
    setShowShareMenu(false);
  };

  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const processContent = () => {
    if (!blog?.content) return "";
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = blog.content;
    
    headings.forEach((heading, index) => {
      const elements = tempDiv.querySelectorAll(`${heading.level}`);
      if (elements[index]) {
        elements[index].id = heading.id;
      }
    });
    
    return tempDiv.innerHTML;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="text-3xl text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#013E43] mb-2">Article not found</h2>
          <p className="text-[#065A57] mb-4">The article you're looking for doesn't exist.</p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            <FiArrowLeft />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const processedContent = processContent();

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      {/* Hero Section with White Background */}
      <div className="bg-white border-b border-[#A8D8C1]">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-[#065A57] hover:text-[#013E43] transition-colors mb-6"
          >
            <FiArrowLeft />
            Back to Blog
          </Link>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Title and Excerpt */}
            <div>
              {blog.category && (
                <div className="inline-flex items-center gap-2 bg-[#02BB31]/10 px-3 py-1 rounded-full mb-4">
                  <FiTag className="text-[#02BB31] text-sm" />
                  <span className="text-sm font-medium text-[#02BB31]">{blog.category}</span>
                </div>
              )}
              
              <h1 className="text-xl md:text-4xl lg:text-5xl font-bold text-[#013E43] mb-4">
                {blog.title}
              </h1>
              
              {blog.excerpt && (
                <p className="text-l text-[#065A57] mb-6 leading-relaxed">
                  {blog.excerpt}
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-[#065A57]">
                <span className="flex items-center gap-2">
                  <FiUser className="text-[#02BB31]" />
                  {blog.author?.name || 'RendaHomes'}
                </span>
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

            {/* Right Column - Cover Image */}
            {blog.coverImage && (
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img
                  src={blog.coverImage}
                  alt={blog.title}
                  className="w-full h-[280px] md:h-[320px] object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-9xl mx-auto px-2 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:w-[70%]">
            <div className="overflow-hidden">
              <div className="p-3 md:p-8">
                <div 
                  className="blog-content"
                  dangerouslySetInnerHTML={{ __html: processedContent }}
                />
              </div>
            </div>

            {/* Share Section */}
            <div className="mt-8 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#065A57]">Share this article:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleShare("facebook")}
                    className="p-2 bg-[#1877F2]/10 text-[#1877F2] rounded-lg hover:bg-[#1877F2] hover:text-white transition-all"
                  >
                    <FiFacebook />
                  </button>
                  <button
                    onClick={() => handleShare("twitter")}
                    className="p-2 bg-[#1DA1F2]/10 text-[#1DA1F2] rounded-lg hover:bg-[#1DA1F2] hover:text-white transition-all"
                  >
                    <FiTwitter />
                  </button>
                  <button
                    onClick={() => handleShare("linkedin")}
                    className="p-2 bg-[#0A66C2]/10 text-[#0A66C2] rounded-lg hover:bg-[#0A66C2] hover:text-white transition-all"
                  >
                    <FiLinkedin />
                  </button>
                  <button
                    onClick={() => handleShare("whatsapp")}
                    className="p-2 bg-[#25D366]/10 text-[#25D366] rounded-lg hover:bg-[#25D366] hover:text-white transition-all"
                  >
                    <FaWhatsapp />
                  </button>
                  <button
                    onClick={() => handleShare("copy")}
                    className="p-2 bg-[#F0F7F4] text-[#065A57] rounded-lg hover:bg-[#A8D8C1] transition-all"
                  >
                    <FiLink />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 text-[#065A57] hover:text-[#02BB31] transition-colors">
                  <FiHeart />
                  <span className="text-sm">Like</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-[#065A57] hover:text-[#02BB31] transition-colors">
                  <FiBookmark />
                  <span className="text-sm">Save</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - Table of Contents */}
          <div className="lg:w-[30%]">
            <div className="sticky top-24 bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
              <h3 className="text-lg font-bold text-[#013E43] mb-4 flex items-center">
                <FiBookmark className="mr-2 text-[#02BB31]" />
                Table of Contents
              </h3>
              
              {headings.length > 0 ? (
                <nav className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {headings.map((heading, index) => (
                    <button
                      key={index}
                      onClick={() => scrollToHeading(heading.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm ${
                        activeHeading === heading.id
                          ? 'bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white'
                          : 'text-[#065A57] hover:bg-[#F0F7F4] hover:text-[#013E43]'
                      }`}
                      style={{ 
                        paddingLeft: heading.level === 'h3' ? '2rem' : 
                                   heading.level === 'h2' ? '1rem' : '0.5rem'
                      }}
                    >
                      <div className="flex items-start">
                        <FiChevronRight className={`mr-2 mt-0.5 flex-shrink-0 ${
                          activeHeading === heading.id ? 'text-white' : 'text-[#02BB31]'
                        }`} />
                        <span className="line-clamp-2">{heading.text}</span>
                      </div>
                    </button>
                  ))}
                </nav>
              ) : (
                <p className="text-sm text-[#065A57] italic">No headings found in this article</p>
              )}

              {/* Reading Progress */}
              <div className="mt-6 pt-6 border-t border-[#A8D8C1]">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[#065A57]">Reading progress</span>
                  <span className="font-medium text-[#013E43]">
                    {Math.round(scrollProgress)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[#F0F7F4] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#02BB31] to-[#0D915C] rounded-full transition-all duration-300"
                    style={{ width: `${scrollProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Author Bio
            {blog.author && (
              <div className="mt-6 bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
                <h3 className="text-lg font-bold text-[#013E43] mb-4 flex items-center">
                  <FiUser className="mr-2 text-[#02BB31]" />
                  Author
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {blog.author.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xl text=[#065a57 font-semibold">Renda Admin</p> 
                    <p className="text-sm text-[#065A57]">Content Writer</p>
                  </div>
                </div>
                
              </div>
        
            )} */}

            </div>
          
        </div>
      </div>

      {/* Custom Styles for Blog Content */}
      <style jsx global>{`
        .blog-content {
          color: #065A57;
          line-height: 1.8;
        }
        
        .blog-content h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 1.5em 0 0.75em;
          color: #013E43;
        }
        
        .blog-content h1:first-child {
          margin-top: 0;
        }
        
        .blog-content h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 1.25em 0 0.75em;
          color: #013E43;
          padding-bottom: 0.5em;
          border-bottom: 2px solid #A8D8C1;
        }
        
        .blog-content h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 1em 0 0.5em;
          color: #013E43;
        }
        
        .blog-content p {
          margin: 1em 0;
          line-height: 1.8;
        }
        
        .blog-content ul, .blog-content ol {
          margin: 1em 0;
          padding-left: 2em;
        }
        
        .blog-content li {
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
          text-decoration: none;
        }
        
        .blog-content a:hover {
          text-decoration: underline;
        }
        
        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 1.5em 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .blog-content hr {
          border: none;
          border-top: 2px solid #A8D8C1;
          margin: 2em 0;
        }
        
        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
        }
        
        .blog-content th,
        .blog-content td {
          border: 1px solid #A8D8C1;
          padding: 0.75em;
          text-align: left;
        }
        
        .blog-content th {
          background: #F0F7F4;
          font-weight: bold;
        }
        
        .blog-content strong {
          font-weight: bold;
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