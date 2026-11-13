import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiArrowRight, FiCalendar, FiClock, FiLink, FiShare2 } from "react-icons/fi";
import { FaFacebook, FaWhatsapp } from "react-icons/fa";
import { getPublishedBlogBySlug, getPublishedBlogs } from "../../../services/blog.service";
import { useSeo } from "../../../utils/seo";
import sanitizeHtml from "../../../utils/sanitizeHtml";
import LoadingScreen from "../../../components/common/LoadingScreen";

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") || "";
const SITE_NAME = "RendaHomes";
const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://rendahomes.com").replace(/\/$/, "");

const getImageUrl = (image) => {
  if (!image) return "";
  if (typeof image === "object") return image.url || image.path || "";
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_BASE_URL}${image.startsWith("/") ? "" : "/"}${image}`;
};

const toSlug = (text) => String(text || "section")
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "") || "section";

const prepareArticle = (content) => {
  if (typeof document === "undefined" || !content) return { html: "", headings: [] };
  const container = document.createElement("div");
  container.innerHTML = sanitizeHtml(content);
  const usedIds = new Set();

  container.querySelectorAll("h1, h2, h3").forEach((heading) => {
    const authoredId = heading.id?.trim();
    let id = authoredId && !/\s/.test(authoredId) && !usedIds.has(authoredId)
      ? authoredId
      : toSlug(heading.textContent);
    let suffix = 2;
    const base = id;
    while (usedIds.has(id)) id = `${base}-${suffix++}`;
    heading.id = id;
    usedIds.add(id);
  });

  const headings = Array.from(container.querySelectorAll("h2, h3"), (heading) => ({
    id: heading.id,
    text: heading.textContent?.trim() || "Section",
    level: heading.tagName.toLowerCase()
  }));
  return { html: container.innerHTML, headings };
};

const getReadingMinutes = (content) => {
  const text = String(content || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

const formatDate = (value) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return "";
  return new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
};
const toIsoDate = (value) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return undefined;
  return new Date(value).toISOString();
};

const getDiscoveryLink = (category = "") => {
  const value = category.toLowerCase();
  if (/short.?stay|bnb|holiday|stay/.test(value)) return "/listings?purpose=short_stay";
  if (/buy|sale|home.?buy/.test(value)) return "/listings?purpose=sale";
  if (/commercial|office|business/.test(value)) return "/listings?type=office";
  if (/rent|tenant|landlord|letting/.test(value)) return "/listings?purpose=rent";
  return "/listings";
};

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeHeading, setActiveHeading] = useState("");
  const [copyState, setCopyState] = useState("Copy link");

  const loadArticle = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [articleResult, articlesResult] = await Promise.all([
        getPublishedBlogBySlug(slug),
        getPublishedBlogs().catch(() => ({ blogs: [] }))
      ]);
      const article = articleResult.blog;
      setBlog(article);
      const published = articlesResult.blogs || [];
      const other = published.filter((item) => item._id !== article?._id && item.slug !== article?.slug);
      const tags = new Set((article?.tags || []).map((tag) => tag.toLowerCase()));
      const ranked = other.map((item) => {
        const score = (item.category && item.category === article?.category ? 3 : 0)
          + (item.tags || []).filter((tag) => tags.has(String(tag).toLowerCase())).length;
        return { item, score };
      }).sort((a, b) => b.score - a.score);
      setRelated(ranked.slice(0, 3).map(({ item }) => item));
    } catch (requestError) {
      setBlog(null);
      setError(requestError.response?.status === 404
        ? "not-found"
        : "We couldn't load this article. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadArticle();
  }, [loadArticle]);

  const prepared = useMemo(() => prepareArticle(blog?.content), [blog?.content]);
  const readingMinutes = useMemo(() => getReadingMinutes(blog?.content), [blog?.content]);
  const coverImageUrl = getImageUrl(blog?.coverImage);
  const authorName = blog?.authorName || (typeof blog?.author === "object" ? blog.author?.name : "");
  const authorImageUrl = getImageUrl(blog?.authorImage);
  const publishedDate = blog?.publishedAt || blog?.createdAt;
  const canonicalUrl = `${SITE_URL}/blog/${blog?.slug || slug}`;

  const jsonLd = useMemo(() => {
    if (!blog) return null;
    const articleUrl = `${SITE_URL}/blog/${blog.slug}`;
    const authorName = blog.authorName || blog.author?.name;
    const author = authorName
      ? { "@type": "Person", name: authorName, image: getImageUrl(blog.authorImage) || undefined }
      : { "@type": "Organization", name: SITE_NAME };
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BlogPosting",
          headline: blog.title,
          description: blog.metaDescription || blog.excerpt || undefined,
          image: coverImageUrl || undefined,
          author,
          publisher: { "@type": "Organization", name: SITE_NAME },
          datePublished: blog.publishedAt || undefined,
          dateModified: blog.updatedAt || blog.publishedAt || undefined,
          mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
          url: articleUrl,
          articleSection: blog.category || undefined,
          keywords: Array.isArray(blog.tags) && blog.tags.length ? blog.tags.join(", ") : undefined
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Renda Insights", item: `${SITE_URL}/blog` },
            { "@type": "ListItem", position: 3, name: blog.title, item: articleUrl }
          ]
        }
      ]
    };
  }, [blog, coverImageUrl]);

  useSeo({
    title: blog?.metaTitle || blog?.title || "Renda Insights",
    description: blog?.metaDescription || blog?.excerpt,
    path: blog?.slug ? `/blog/${blog.slug}` : `/blog/${slug}`,
    image: coverImageUrl || undefined,
    type: "article",
    jsonLd
  });

  const updateActiveHeading = useCallback(() => {
    const nodes = Array.from(document.querySelectorAll(".article-reading h2, .article-reading h3"));
    if (!nodes.length) return;
    const threshold = 150;
    const passed = nodes.filter((node) => node.getBoundingClientRect().top <= threshold);
    const current = (passed.length ? passed[passed.length - 1] : nodes[0]).id;
    setActiveHeading((previous) => previous === current ? previous : current);
  }, []);

  useEffect(() => {
    if (!prepared.headings.length) return undefined;
    let frame = 0;
    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateActiveHeading();
      });
    };
    const observer = new IntersectionObserver(scheduleUpdate, {
      rootMargin: "-110px 0px -65% 0px",
      threshold: [0, 1]
    });
    document.querySelectorAll(".article-reading h2, .article-reading h3").forEach((node) => observer.observe(node));
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    scheduleUpdate();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [prepared, updateActiveHeading]);

  const share = async (platform) => {
    const title = blog?.title || "RendaHomes Insights";
    const encodedUrl = encodeURIComponent(canonicalUrl);
    const encodedTitle = encodeURIComponent(title);
    if (platform === "copy") {
      try {
        await navigator.clipboard.writeText(canonicalUrl);
        setCopyState("Copied");
        window.setTimeout(() => setCopyState("Copy link"), 1800);
      } catch {
        setCopyState("Copy unavailable");
        window.setTimeout(() => setCopyState("Copy link"), 1800);
      }
      return;
    }
    if (platform === "native" && navigator.share) {
      try { await navigator.share({ title, url: canonicalUrl }); } catch { /* User dismissed the share sheet. */ }
      return;
    }
    const targets = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${canonicalUrl}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
    };
    if (targets[platform]) window.open(targets[platform], "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <>
        <main className="min-h-screen bg-white">
          <header className="bg-[#F0F7F4]">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <div className="h-4 w-32 rounded bg-white" />
              <div className="mt-8 h-12 max-w-3xl rounded bg-white" />
              <div className="mt-4 h-5 max-w-xl rounded bg-white" />
              <div className="mt-10 aspect-[16/8] rounded-2xl bg-white" />
            </div>
          </header>
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="space-y-4">
              <div className="h-5 rounded bg-[#F0F7F4]" />
              <div className="h-5 rounded bg-[#F0F7F4]" />
              <div className="h-5 w-4/5 rounded bg-[#F0F7F4]" />
            </div>
          </div>
        </main>
        <LoadingScreen />
      </>
    );
  }

  if (!blog) {
    const notFound = error === "not-found";
    return (
      <main className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-start justify-center px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-[#013E43]">{notFound ? "Article not found" : "We couldn't load this article"}</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-[#41635A]">{notFound ? "The article may have moved or is no longer available." : error}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {!notFound && <button type="button" onClick={loadArticle} className="rounded-md bg-[#0D915C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#08794b]">Try again</button>}
          <Link to="/blog" className="inline-flex items-center gap-2 rounded-md border border-[#A8D8C1] px-4 py-2.5 text-sm font-semibold text-[#013E43] hover:bg-[#F0F7F4]"><FiArrowLeft />Back to Renda Insights</Link>
        </div>
      </main>
    );
  }

  const toc = prepared.headings.filter((heading) => heading.level === "h2" || heading.level === "h3");
  const discoveryLink = getDiscoveryLink(blog.category);

  return (
    <main className="bg-white">
      <header className="bg-[#F0F7F4]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 md:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)] lg:items-center lg:gap-12 lg:px-8 lg:py-14">
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#41635A]">
              <Link to="/" className="hover:text-[#0D915C]">Home</Link><span aria-hidden="true">/</span>
              <Link to="/blog" className="hover:text-[#0D915C]">Renda Insights</Link>
              {blog.category && <><span aria-hidden="true">/</span><span>{blog.category}</span></>}
            </nav>
            {blog.category && <p className="mb-3 text-xs font-bold uppercase text-[#0D915C]">{blog.category}</p>}
            <h1 className="max-w-3xl text-3xl font-bold leading-tight text-[#013E43] sm:text-4xl">{blog.title}</h1>
            {blog.excerpt && <p className="mt-5 max-w-2xl text-base leading-7 text-[#41635A] sm:text-lg sm:leading-8">{blog.excerpt}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#41635A]">
            {authorName && <span className="inline-flex items-center gap-2 font-semibold text-[#013E43]">{authorImageUrl && <img src={authorImageUrl} alt="" aria-hidden="true" className="h-9 w-9 rounded-full object-cover" />}{authorName}</span>}
              {formatDate(publishedDate) && <time dateTime={toIsoDate(publishedDate)} className="inline-flex items-center gap-2"><FiCalendar aria-hidden="true" />{formatDate(publishedDate)}</time>}
              <span className="inline-flex items-center gap-2"><FiClock aria-hidden="true" />{readingMinutes} min read</span>
            </div>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-[#DCEBE3]">
            {coverImageUrl ? <img src={coverImageUrl} alt={blog.coverImageAlt || blog.title} fetchPriority="high" className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center px-6 text-sm font-medium text-[#41635A]">RendaHomes Insights</div>}
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-14 lg:px-8">
        <aside className="self-start lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto" aria-label="Article navigation">
          {toc.length > 0 && <>
            <div className="hidden lg:block">
              <h2 className="mb-4 text-xs font-bold uppercase text-[#41635A]">On this page</h2>
              <nav aria-label="On this page" className="space-y-1 border-l border-[#DCEBE3]">
                {toc.map((heading) => <a key={heading.id} href={`#${encodeURIComponent(heading.id)}`} onClick={() => setActiveHeading(heading.id)} className={`block border-l-2 py-2 pr-2 text-sm leading-5 transition-colors ${heading.level === "h3" ? "pl-5" : "pl-3"} ${activeHeading === heading.id ? "-ml-px border-[#0D915C] font-semibold text-[#013E43]" : "border-transparent text-[#52716A] hover:text-[#0D915C]"}`}>{heading.text}</a>)}
              </nav>
            </div>
            <details className="rounded-md border border-[#DCEBE3] bg-[#F8FBF9] p-4 lg:hidden">
              <summary className="cursor-pointer text-sm font-semibold text-[#013E43]">On this page</summary>
              <nav aria-label="Article sections" className="mt-3 space-y-2">
                {toc.map((heading) => <a key={heading.id} href={`#${encodeURIComponent(heading.id)}`} onClick={() => setActiveHeading(heading.id)} className={`block py-1 text-sm ${heading.level === "h3" ? "pl-4" : ""} ${activeHeading === heading.id ? "font-semibold text-[#0D915C]" : "text-[#41635A]"}`}>{heading.text}</a>)}
              </nav>
            </details>
          </>}
          <div className="mt-6 border-t border-[#DCEBE3] pt-4">
            <p className="mb-3 text-xs font-bold uppercase text-[#41635A]">Share this story</p>
            <div className="flex flex-wrap gap-2">
              <ShareButton label="Share on WhatsApp" onClick={() => share("whatsapp")}><FaWhatsapp /></ShareButton>
              <ShareButton label="Share on Facebook" onClick={() => share("facebook")}><FaFacebook /></ShareButton>
              <ShareButton label="Share on X" onClick={() => share("x")}>𝕏</ShareButton>
              <ShareButton label="Copy article link" onClick={() => share("copy")}><FiLink /></ShareButton>
              {typeof navigator !== "undefined" && navigator.share && <ShareButton label="More sharing options" onClick={() => share("native")}><FiShare2 /></ShareButton>}
            </div>
            <p aria-live="polite" className="mt-2 min-h-4 text-xs text-[#0D915C]">{copyState !== "Copy link" ? copyState : ""}</p>
          </div>
        </aside>

        <article className="min-w-0">
          <div className="article-reading rich-content" dangerouslySetInnerHTML={{ __html: prepared.html }} />
          <section className="mt-12 rounded-lg bg-[#013E43] px-6 py-8 text-white sm:px-8" aria-labelledby="discovery-heading">
            <p className="text-xs font-bold uppercase text-[#9AE6B4]">Discover your next space</p>
            <h2 id="discovery-heading" className="mt-2 text-2xl font-bold leading-tight">Your next home could be one search away.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">Explore homes, short stays, properties for sale and commercial spaces across Kenya.</p>
            <Link to={discoveryLink} className="mt-5 inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-[#013E43] hover:bg-[#E9F5EE]">Browse properties <FiArrowRight /></Link>
          </section>
        </article>
      </section>

      {related.length > 0 && <section className="bg-[#F0F7F4]" aria-labelledby="related-heading">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase text-[#0D915C]">Keep reading</p><h2 id="related-heading" className="mt-2 text-2xl font-bold text-[#013E43]">More from Renda Insights</h2></div>
            <Link to="/blog" className="hidden items-center gap-2 text-sm font-semibold text-[#0D915C] hover:text-[#08794b] sm:inline-flex">All articles <FiArrowRight /></Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => <RelatedArticle key={item._id} article={item} />)}
          </div>
          <Link to="/blog" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0D915C] sm:hidden">All articles <FiArrowRight /></Link>
        </div>
      </section>}
    </main>
  );
}

function ShareButton({ label, onClick, children }) {
  return <button type="button" onClick={onClick} aria-label={label} title={label} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#DCEBE3] bg-white text-[#065A57] transition hover:border-[#0D915C] hover:text-[#0D915C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D915C]">{children}</button>;
}

function RelatedArticle({ article }) {
  const image = getImageUrl(article.coverImage);
  return <Link to={`/blog/${article.slug}`} className="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-[#D7E8DF] bg-white transition-colors hover:border-[#0D915C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D915C]">
    <div className="aspect-[16/10] overflow-hidden bg-[#DCEBE3]">{image ? <img src={image} alt={article.coverImageAlt || article.title} loading="lazy" className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center text-sm text-[#52716A]">RendaHomes Insights</div>}</div>
    <div className="flex flex-1 flex-col p-5">
      {article.category && <p className="text-xs font-bold uppercase text-[#0D915C]">{article.category}</p>}
      <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug text-[#013E43]">{article.title}</h3>
      {article.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#52716A]">{article.excerpt}</p>}
      <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-[#52716A]">
        {formatDate(article.publishedAt || article.createdAt) && <time dateTime={toIsoDate(article.publishedAt || article.createdAt)}>{formatDate(article.publishedAt || article.createdAt)}</time>}
        <span>{getReadingMinutes(article.content)} min read</span>
      </div>
    </div>
  </Link>;
}
