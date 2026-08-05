import { useEffect, useState } from "react";
import { FiImage, FiSend } from "react-icons/fi";
import { getMyInquiries, markInquiryRead, replyToInquiry } from "../services/alerts.service";
import { getApiErrorMessage } from "../utils/apiError";
import { portalLinks } from "../config/portals";

export default function Inquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const active = inquiries.find((item) => item._id === activeId) || inquiries[0];

  useEffect(() => {
    getMyInquiries()
      .then((data) => {
        const items = data.inquiries || [];
        setInquiries(items);
        setActiveId(items[0]?._id || null);
      })
      .catch((err) => setError(getApiErrorMessage(err, "Could not load inquiries.")));
  }, []);

  useEffect(() => {
    if (active?._id && !active.readByUser) {
      markInquiryRead(active._id).catch(() => {});
    }
  }, [active?._id, active?.readByUser]);

  const sendReply = async (event) => {
    event.preventDefault();
    if (!active?._id || !reply.trim()) return;

    try {
      const data = await replyToInquiry(active._id, reply);
      setInquiries((items) => items.map((item) => (item._id === active._id ? data.inquiry : item)));
      setReply("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not send reply."));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <section className="rounded-[1.5rem] border border-[#A8D8C1] bg-white p-4">
        <p className="px-2 text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">Inquiries</p>
        <div className="mt-4 space-y-2">
          {inquiries.map((item) => (
            <button
              key={item._id}
              onClick={() => setActiveId(item._id)}
              className={`w-full rounded-2xl p-3 text-left transition ${active?._id === item._id ? "bg-[#013E43] text-white" : "bg-[#F0F7F4] text-[#013E43] hover:bg-[#E5F3EC]"}`}
            >
              <p className="line-clamp-1 text-sm font-extrabold">{item.listing?.title || "Listing inquiry"}</p>
              <p className={`mt-1 line-clamp-1 text-xs font-semibold ${active?._id === item._id ? "text-[#A8D8C1]" : "text-[#065A57]"}`}>{item.message}</p>
            </button>
          ))}
          {!inquiries.length ? <p className="rounded-2xl bg-[#F0F7F4] p-4 text-sm font-semibold text-[#065A57]">No app inquiry threads yet.</p> : null}
        </div>
      </section>

      <section className="min-h-[520px] rounded-[1.5rem] border border-[#A8D8C1] bg-white p-5">
        {error ? <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
        {active ? (
          <>
            <div className="flex gap-4 border-b border-[#A8D8C1] pb-5">
              <ListingImage listing={active.listing} />
              <div>
                <p className="text-lg font-extrabold text-[#013E43]">{active.listing?.title || "Listing inquiry"}</p>
                <p className="mt-1 text-sm font-semibold text-[#065A57]">{[active.listing?.area, active.listing?.town, active.listing?.county].filter(Boolean).join(", ")}</p>
                <a href={`${portalLinks.main.href}/listings/${active.listing?._id}`} className="mt-3 inline-flex rounded-full bg-[#F0F7F4] px-3 py-2 text-xs font-extrabold text-[#013E43]">
                  Open listing
                </a>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <Bubble role="You" message={active.message} mine />
              {(active.replies || []).map((item) => (
                <Bubble key={item._id || `${item.createdAt}-${item.message}`} role={item.senderRole === "landlord" ? "Landlord" : "You"} message={item.message} mine={item.senderRole !== "landlord"} />
              ))}
            </div>

            <form onSubmit={sendReply} className="mt-6 flex gap-3">
              <input
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder="Write a reply..."
                className="min-w-0 flex-1 rounded-2xl border border-[#A8D8C1] bg-[#F0F7F4] px-4 py-3 text-sm font-semibold outline-none focus:border-[#02BB31]"
              />
              <button className="inline-flex items-center gap-2 rounded-2xl bg-[#013E43] px-5 py-3 text-sm font-extrabold text-white">
                <FiSend />
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="grid h-full place-items-center rounded-2xl bg-[#F0F7F4] p-8 text-center text-sm font-semibold text-[#065A57]">
            Select an inquiry to view the conversation.
          </div>
        )}
      </section>
    </div>
  );
}

function ListingImage({ listing }) {
  const raw = listing?.images?.[0];
  const src = typeof raw === "string" ? raw : raw?.url || raw?.path;
  return src ? <img src={src} alt="" className="h-20 w-24 rounded-2xl object-cover" /> : <div className="grid h-20 w-24 place-items-center rounded-2xl bg-[#F0F7F4] text-[#065A57]"><FiImage /></div>;
}

function Bubble({ role, message, mine }) {
  return (
    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${mine ? "ml-auto bg-[#013E43] text-white" : "bg-[#F0F7F4] text-[#013E43]"}`}>
      <p className={`text-xs font-extrabold ${mine ? "text-[#A8D8C1]" : "text-[#02BB31]"}`}>{role}</p>
      <p className="mt-1 text-sm font-semibold leading-6">{message}</p>
    </div>
  );
}
