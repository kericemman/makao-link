import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import LoadingScreen from "../components/common/LoadingScreen";
import { getBlogPost } from "../services/public.service";
import { getApiErrorMessage } from "../utils/apiError";
import sanitizeHtml from "../utils/sanitizeHtml";

export default function BlogDetails() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getBlogPost(slug);
        setBlog(data.blog);
      } catch (err) {
        setError(getApiErrorMessage(err, "Could not load this article."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading) return <LoadingScreen label="Loading article" />;

  return (
    <main className="bg-[#F6FAF8]">
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#065A57] hover:text-[#013E43]">
          <FiArrowLeft /> Articles
        </Link>
        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-white p-5 text-sm text-[#065A57]">{error}</div>
        ) : (
          <>
            {blog?.coverImage ? <img src={blog.coverImage} alt={blog.title} className="mt-6 max-h-[460px] w-full rounded-2xl object-cover" /> : null}
            <h1 className="mt-7 text-4xl font-extrabold tracking-tight text-[#013E43]">{blog?.title}</h1>
            <p className="mt-3 text-sm font-semibold text-[#065A57]">{blog?.publishedAt ? new Date(blog.publishedAt).toLocaleDateString() : "RendaHomes"}</p>
            <div
              className="prose prose-lg mt-8 max-w-none prose-headings:text-[#013E43] prose-p:text-[#065A57] prose-a:text-[#013E43]"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(blog?.content || blog?.excerpt || "") }}
            />
          </>
        )}
      </article>
    </main>
  );
}
