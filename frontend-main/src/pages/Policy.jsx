import { useEffect, useMemo, useState } from "react";
import LoadingScreen from "../components/common/LoadingScreen";
import { getPolicy } from "../services/public.service";
import sanitizeHtml from "../utils/sanitizeHtml";

const fallback = {
  privacy: {
    title: "Privacy Policy",
    body: "RendaHomes collects account, contact, listing, and inquiry information only to operate the property platform, support users, prevent misuse, and improve our services."
  },
  terms: {
    title: "Terms of Service",
    body: "By using RendaHomes, you agree to provide accurate information, respect other users, and use the platform only for legitimate property, service, and support activity."
  }
};

export default function Policy({ slug = "privacy" }) {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  const fallbackPolicy = useMemo(() => fallback[slug] || fallback.privacy, [slug]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getPolicy(slug);
        setPolicy(data.policy);
      } catch {
        setPolicy(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading) return <LoadingScreen label="Loading policy" />;

  const title = policy?.title || fallbackPolicy.title;
  const content = policy?.content || `<p>${fallbackPolicy.body}</p>`;

  return (
    <main className="bg-[#F6FAF8]">
      <section className="border-b border-[#DDEBE4] bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">Legal</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#013E43]">{title}</h1>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div
          className="prose prose-lg max-w-none rounded-2xl border border-[#DDEBE4] bg-white p-6 prose-headings:text-[#013E43] prose-p:text-[#065A57] prose-li:text-[#065A57]"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
        />
      </section>
    </main>
  );
}
