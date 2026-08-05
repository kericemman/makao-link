import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCalendar } from "react-icons/fi";
import LoadingScreen from "../components/common/LoadingScreen";
import { getBlogPosts } from "../services/public.service";
import { getApiErrorMessage } from "../utils/apiError";

export default function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getBlogPosts();
        setBlogs(data.blogs || []);
      } catch (err) {
        setError(getApiErrorMessage(err, "Could not load articles."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingScreen label="Loading articles" />;

  return (
    <main className="bg-[#F6FAF8]">
      <section className="border-b border-[#DDEBE4] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">Resources</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#013E43]">RendaHomes updates and guides</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#065A57]">Fresh property guides, platform updates, and helpful notes for landlords and home seekers.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {error ? <div className="rounded-2xl border border-red-200 bg-white p-5 text-sm text-[#065A57]">{error}</div> : null}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <article key={blog._id} className="overflow-hidden rounded-2xl border border-[#DDEBE4] bg-white shadow-sm">
              {blog.coverImage ? <img src={blog.coverImage} alt={blog.title} className="h-48 w-full object-cover" /> : null}
              <div className="p-5">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#065A57]">
                  <FiCalendar className="text-[#02BB31]" />
                  {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString() : "RendaHomes"}
                </p>
                <h2 className="mt-3 line-clamp-2 text-xl font-extrabold text-[#013E43]">{blog.title}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#065A57]">{blog.excerpt}</p>
                <Link to={`/blog/${blog.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#013E43]">
                  Read article <FiArrowRight />
                </Link>
              </div>
            </article>
          ))}
        </div>
        {!error && !blogs.length ? (
          <div className="rounded-2xl border border-dashed border-[#A8D8C1] bg-white p-10 text-center text-[#065A57]">No published articles yet.</div>
        ) : null}
      </section>
    </main>
  );
}
