import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { getBlog } from "../../../services/blog.service"
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
  FiChevronLeft
} from "react-icons/fi"
import { FaWhatsapp } from "react-icons/fa"
import toast from "react-hot-toast"

function BlogDetails() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const { slug } = useParams()
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeHeading, setActiveHeading] = useState("")
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [headings, setHeadings] = useState([])
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    fetchBlog()
  }, [slug])

  useEffect(() => {
    if (blog?.content) {
      extractHeadings()
    }
  }, [blog])

  useEffect(() => {
    const handleScroll = () => {
      const headingElements = document.querySelectorAll('h1, h2, h3')
      const scrollPosition = window.scrollY + 100

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i]
        if (element.offsetTop <= scrollPosition) {
          setActiveHeading(element.id)
          break
        }
      }

      // Calculate scroll progress
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight
      const progress = (window.scrollY / totalScroll) * 100
      setScrollProgress(Math.min(100, progress))
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [headings])

  const fetchBlog = async () => {
    try {
      setLoading(true)
      const res = await getBlog(slug)
      setBlog(res.data)
    } catch (error) {
      toast.error("Failed to load blog post", {
        style: { background: "#013E43", color: "#fff" }
      })
    } finally {
      setLoading(false)
    }
  }

  const extractHeadings = () => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = blog.content
    const headingElements = tempDiv.querySelectorAll('h1, h2, h3')
    
    const extractedHeadings = []
    headingElements.forEach((element, index) => {
      const text = element.textContent || ''
      const level = element.tagName.toLowerCase()
      const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      
      extractedHeadings.push({ id, text, level })
    })
    
    setHeadings(extractedHeadings)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateReadingTime = () => {
    if (!blog?.content) return 1
    const wordsPerMinute = 200
    const wordCount = blog.content.replace(/<[^>]*>/g, '').split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  const shareUrl = window.location.href
  const shareTitle = blog?.title || "Check out this article"

  const handleShare = (platform) => {
    let url = ""
    switch(platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case "twitter":
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`
        break
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        break
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`
        break
      case "copy":
        navigator.clipboard.writeText(shareUrl)
        toast.success("Link copied to clipboard!", {
          style: { background: "#02BB31", color: "#fff" }
        })
        return
    }
    if (url) window.open(url, "_blank")
    setShowShareMenu(false)
  }

  const scrollToHeading = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Process content to add IDs to headings
  const processContent = () => {
    if (!blog?.content) return ""
    
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = blog.content
    
    headings.forEach((heading, index) => {
      const elements = tempDiv.querySelectorAll(`${heading.level}`)
      if (elements[index]) {
        elements[index].id = heading.id
      }
    })
    
    return tempDiv.innerHTML
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57] text-lg">Loading article...</p>
        </div>
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#013E43] mb-2">Article not found</h2>
          <p className="text-[#065A57] mb-4">The article you're looking for doesn't exist.</p>
          <Link
            to="/blogs"
            className="inline-flex items-center px-6 py-3 bg-[#02BB31] text-white rounded-lg font-semibold hover:bg-[#0D915C] transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Blogs
          </Link>
        </div>
      </div>
    )
  }

  const processedContent = processContent()

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      {/* Back Button */}
      <div className="bg-white border-b border-[#A8D8C1] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/blogs"
            className="inline-flex items-center text-[#065A57] hover:text-[#013E43] transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Blogs
          </Link>
        </div>
      </div>

      {/* Hero Section - Image Left, Title Right */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Cover Image */}
          <div className="relative">
            {blog.coverImage?.url ? (
              <img
                src={blog.coverImage.url}
                alt={blog.title}
                className="w-full h-[300px] lg:h-[400px] object-cover rounded-2xl shadow-xl"
              />
            ) : (
              <div className="w-full h-[300px] lg:h-[400px] bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-2xl shadow-xl flex items-center justify-center">
                <span className="text-6xl text-white opacity-30">📝</span>
              </div>
            )}
            
            {/* Category Badge */}
            {blog.category && (
              <div className="absolute top-4 left-4">
                <span className="px-4 py-2 bg-[#02BB31] text-white text-sm font-medium rounded-full">
                  {blog.category}
                </span>
              </div>
            )}
          </div>

          {/* Right Column - Title and Description */}
          <div className="space-y-4">
            <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-[#013E43] leading-tight">
              {blog.title}
            </h1>
            
            {blog.excerpt && (
              <p className="text-lg text-[#065A57] leading-relaxed">
                {blog.excerpt}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-full flex items-center justify-center text-white font-bold">
                  {blog.author?.name?.charAt(0) || 'M'}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#013E43]">
                    {blog.author?.name || 'MakaoLink'}
                  </p>
                  <p className="text-xs text-[#065A57]">Author</p>
                </div>
              </div>
              
              <div className="h-8 w-px bg-[#A8D8C1]"></div>
              
              <div className="flex items-center space-x-4 text-sm text-[#065A57]">
                <span className="flex items-center">
                  <FiCalendar className="mr-1 text-[#02BB31]" />
                  {formatDate(blog.publishedAt || blog.createdAt)}
                </span>
                <span className="flex items-center">
                  <FiClock className="mr-1 text-[#02BB31]" />
                  {calculateReadingTime()} min read
                </span>
              </div>
            </div>

            {/* Share Button */}
            <div className="relative pt-4">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="inline-flex items-center px-4 py-2 border border-[#A8D8C1] rounded-lg text-[#065A57] hover:bg-[#F0F7F4] transition-colors"
              >
                <FiShare2 className="mr-2" />
                Share Article
              </button>

              {/* Share Menu */}
              {showShareMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowShareMenu(false)}
                  />
                  <div className="absolute left-0 mt-2 bg-white rounded-xl shadow-xl border border-[#A8D8C1] p-2 z-50 w-48">
                    <button
                      onClick={() => handleShare("facebook")}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-[#F0F7F4] rounded-lg transition-colors"
                    >
                      <FiFacebook className="text-[#1877F2]" />
                      <span className="text-sm text-[#013E43]">Facebook</span>
                    </button>
                    <button
                      onClick={() => handleShare("twitter")}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-[#F0F7F4] rounded-lg transition-colors"
                    >
                      <FiTwitter className="text-[#1DA1F2]" />
                      <span className="text-sm text-[#013E43]">Twitter</span>
                    </button>
                    <button
                      onClick={() => handleShare("linkedin")}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-[#F0F7F4] rounded-lg transition-colors"
                    >
                      <FiLinkedin className="text-[#0A66C2]" />
                      <span className="text-sm text-[#013E43]">LinkedIn</span>
                    </button>
                    <button
                      onClick={() => handleShare("whatsapp")}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-[#F0F7F4] rounded-lg transition-colors"
                    >
                      <FaWhatsapp className="text-[#25D366]" />
                      <span className="text-sm text-[#013E43]">WhatsApp</span>
                    </button>
                    <div className="border-t border-[#A8D8C1] my-1"></div>
                    <button
                      onClick={() => handleShare("copy")}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-[#F0F7F4] rounded-lg transition-colors"
                    >
                      <FiLink className="text-[#065A57]" />
                      <span className="text-sm text-[#013E43]">Copy Link</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Table of Contents */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content - 70% - Properly formatted */}
          <div className="lg:w-[70%]">
            <div 
              className="prose prose-lg max-w-none
                prose-headings:text-[#013E43] prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4
                prose-h1:text-3xl prose-h1:lg:text-4xl
                prose-h2:text-2xl prose-h2:lg:text-3xl
                prose-h3:text-xl prose-h3:lg:text-2xl
                prose-p:text-[#065A57] prose-p:leading-relaxed prose-p:my-4
                prose-strong:text-[#013E43] prose-strong:font-bold
                prose-em:text-[#065A57] prose-em:italic
                prose-ul:list-disc prose-ul:my-4 prose-ul:pl-6
                prose-ol:list-decimal prose-ol:my-4 prose-ol:pl-6
                prose-li:text-[#065A57] prose-li:my-1
                prose-blockquote:border-l-4 prose-blockquote:border-[#02BB31] prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-[#065A57] prose-blockquote:my-6
                prose-code:bg-[#F0F7F4] prose-code:text-[#02BB31] prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-[#013E43] prose-pre:text-white prose-pre:p-4 prose-pre:rounded-xl prose-pre:my-6
                prose-a:text-[#02BB31] prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8
                prose-hr:border-[#A8D8C1] prose-hr:my-8
                [&_p]:text-[#065A57] [&_p]:leading-relaxed [&_p]:my-4
                [&_h1]:text-[#013E43] [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4
                [&_h2]:text-[#013E43] [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4
                [&_h3]:text-[#013E43] [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-3
                [&_ul]:list-disc [&_ul]:my-4 [&_ul]:pl-6
                [&_ol]:list-decimal [&_ol]:my-4 [&_ol]:pl-6
                [&_li]:text-[#065A57] [&_li]:my-1
                [&_blockquote]:border-l-4 [&_blockquote]:border-[#02BB31] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#065A57] [&_blockquote]:my-6
                [&_code]:bg-[#F0F7F4] [&_code]:text-[#02BB31] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded
                [&_pre]:bg-[#013E43] [&_pre]:text-white [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:my-6 [&_pre]:overflow-x-auto
                [&_a]:text-[#02BB31] [&_a]:no-underline hover:[&_a]:underline
                [&_img]:rounded-xl [&_img]:shadow-lg [&_img]:my-8
                [&_hr]:border-[#A8D8C1] [&_hr]:my-8
                space-y-4"
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />
          </div>

          {/* Table of Contents - 30% (Sticky) */}
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
                          ? 'bg-[#02BB31] text-white'
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
          </div>
        </div>

        {/* Navigation between posts */}
        <div className="mt-12 flex items-center justify-between">
          <Link
            to="/blogs"
            className="flex items-center space-x-2 px-4 py-2 text-[#065A57] hover:text-[#013E43] transition-colors"
          >
            <FiChevronLeft />
            <span>Back to all articles</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-4 py-2 text-[#065A57] hover:text-[#013E43] transition-colors">
              <FiHeart />
              <span>Like</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 text-[#065A57] hover:text-[#013E43] transition-colors">
              <FiBookmark />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlogDetails