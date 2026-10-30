import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiHome, FiMessageCircle, FiRefreshCw, FiSend, FiX } from "react-icons/fi";
import {
  createRendaWebConversation,
  getRendaWebConversation,
  resetRendaWebConversation,
  sendRendaWebMessage
} from "../services/rendaAssistant.service";

const errorMessage = (error) => error?.response?.data?.message || "Ask Renda is temporarily unavailable. You can still browse all listings.";
const formatAssistantText = (text) => String(text || "")
  .replace(/\bshort_stay\b/gi, "short stay")
  .replace(/\bshort_term\b/gi, "short stay")
  .replace(/\b(\d+)\s*-\s*(\d+)\b/g, "$1 to $2")
  .replace(/[_‐‑‒–—-]+/g, " ")
  .replace(/\s{2,}/g, " ")
  .trim();
const getWelcomeMessage = () => {
  const hour = Number(new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    hourCycle: "h23"
  }).format(new Date()));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${greeting}, I’m Renda, your RendaHomes home-finding assistant. I can help you discover homes and short stays that fit your location, budget, and needs. What are you looking for today?`;
};
const getImage = (listing) => {
  const image = Array.isArray(listing.images) ? listing.images[0] : listing.images;
  return typeof image === "string" ? image : image?.url || image?.secure_url || "";
};
const formatPrice = (price) => {
  const amount = Number(price);
  return Number.isFinite(amount) ? `KES ${amount.toLocaleString("en-KE")}` : "Price on request";
};

function ListingResult({ listing }) {
  return (
    <Link to={`/listings/${listing._id}`} className="group flex min-w-0 overflow-hidden rounded-xl border border-[#dce9e2] bg-white text-[#013e43] transition hover:border-[#0d915c]">
      {getImage(listing) ? (
        <img src={getImage(listing)} alt="" className="h-[82px] w-[92px] shrink-0 object-cover" />
      ) : (
        <div className="flex h-[82px] w-[92px] shrink-0 items-center justify-center bg-[#edf5ef] text-[#0d915c]"><FiHome size={21} /></div>
      )}
      <span className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2">
        <span className="line-clamp-2 text-xs font-semibold leading-4 group-hover:text-[#0d915c]">{listing.title}</span>
        <span className="mt-1 truncate text-[11px] text-[#56716a]">{[listing.area, listing.town, listing.county].filter(Boolean).join(", ")}</span>
        <span className="mt-1 text-xs font-bold">{formatPrice(listing.price)}</span>
      </span>
      <FiArrowUpRight className="mr-3 mt-3 shrink-0 text-[#719087]" size={15} />
    </Link>
  );
}

export default function RendaAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [consent, setConsent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [started, setStarted] = useState(false);
  const [activeRequest, setActiveRequest] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const sendingPendingRef = useRef(false);

  useEffect(() => {
    if (!open || started) return;
    let cancelled = false;
    setStarted(true);
    setPhase("loading");
    getRendaWebConversation()
      .then((conversation) => {
        if (cancelled) return;
        setConsent(conversation.consent);
        if (conversation.active) {
          setMessages(conversation.messages.map((message) => ({
            ...message,
            text: message.direction === "outbound" ? formatAssistantText(message.text) : message.text,
            listings: []
          })));
          setPhase("chat");
        } else setPhase("consent");
      })
      .catch((error) => {
        if (!cancelled) { setNotice(errorMessage(error)); setPhase("error"); }
      });
    return () => { cancelled = true; };
  }, [open, started]);

  useEffect(() => {
    if (open && (phase === "loading" || phase === "chat")) inputRef.current?.focus();
    if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [open, phase, messages, busy]);

  useEffect(() => {
    if (phase !== "chat" || !pendingMessage || busy || sendingPendingRef.current) return;
    const message = pendingMessage;
    sendingPendingRef.current = true;
    setPendingMessage("");
    setNotice("");
    setActiveRequest(message);
    setMessages((current) => [...current, { direction: "inbound", text: message, listings: [] }]);
    setBusy(true);
    sendRendaWebMessage(message)
      .then((result) => setMessages((current) => [...current, { direction: "outbound", text: result.reply, listings: result.listings || [] }]))
      .catch((error) => {
        setNotice(errorMessage(error));
        if (error?.response?.status === 401) setPhase("consent");
      })
      .finally(() => { sendingPendingRef.current = false; setBusy(false); setActiveRequest(""); });
  }, [phase, pendingMessage, busy]);

  const startChat = async () => {
    setBusy(true);
    setNotice("");
    try {
      await createRendaWebConversation();
      setMessages([{ direction: "outbound", text: getWelcomeMessage(), listings: [] }]);
      setPhase("chat");
    } catch (error) { setNotice(errorMessage(error)); }
    finally { setBusy(false); }
  };

  const submit = async (event) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || busy || pendingMessage || !["loading", "chat"].includes(phase)) return;
    setDraft("");
    setNotice("");
    setPendingMessage(message);
  };

  const resetChat = async () => {
    setBusy(true);
    try { await resetRendaWebConversation(); }
    catch { /* A missing or expired session is already reset from the user's perspective. */ }
    setMessages([]);
    setPendingMessage("");
    setNotice("");
    setStarted(false);
    setPhase("idle");
    setBusy(false);
    queueMicrotask(() => setStarted(true));
    setPhase("consent");
  };

  return (
    <div className="fixed bottom-5 right-5 z-[80] sm:bottom-6 sm:right-6">
      {open && (
        <section aria-label="Ask Renda assistant" className="mb-3 flex h-[min(620px,calc(100dvh-110px))] w-[min(390px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-[#dce9e2] bg-white shadow-[0_18px_60px_rgba(1,62,67,0.2)]">
          <header className="flex shrink-0 items-center justify-between bg-[#013e43] px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12"><FiHome size={18} /></span>
              <div><h2 className="text-sm font-semibold">Ask Renda</h2><p className="mt-0.5 text-[11px] text-white/75">Find a home that fits</p></div>
            </div>
            <div className="flex items-center gap-1">
              {phase === "chat" && <button type="button" aria-label="Start a new chat" title="Start a new chat" onClick={resetChat} className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"><FiRefreshCw size={15} /></button>}
              <button type="button" aria-label="Close Ask Renda" title="Close" onClick={() => setOpen(false)} className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"><FiX size={18} /></button>
            </div>
          </header>

          {phase === "loading" && (
            <div className="flex min-h-0 flex-1 flex-col bg-[#f8fbf9]">
              <div className="flex flex-1 flex-col justify-end gap-3 overflow-y-auto px-3 py-4">
                {pendingMessage && <p className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-[#0d915c] px-3.5 py-2.5 text-[13px] leading-5 text-white">{pendingMessage}</p>}
                <span role="status" aria-live="polite" className="ml-1 flex min-w-0 items-center gap-2 text-[11px] text-[#718780]">
                  <i className="h-1 w-1 animate-bounce rounded-full bg-[#0d915c] [animation-delay:-0.2s]" />
                  <i className="h-1 w-1 animate-bounce rounded-full bg-[#0d915c] [animation-delay:-0.1s]" />
                  <i className="h-1 w-1 animate-bounce rounded-full bg-[#0d915c]" />
                  {pendingMessage && <span className="line-clamp-2 min-w-0 break-words">Loading your request: {pendingMessage}</span>}
                </span>
              </div>
              <form onSubmit={submit} className="flex shrink-0 items-end gap-2 border-t border-[#e4eee8] bg-white p-3">
                <textarea ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} rows={1} maxLength={2000} placeholder="Type your request…" aria-label="Message Ask Renda" className="max-h-24 min-h-11 flex-1 resize-none rounded-lg border border-[#dce9e2] bg-[#fbfdfc] px-3 py-2.5 text-sm text-[#013e43] outline-none placeholder:text-[#7d928b] focus:border-[#0d915c]" />
                <button type="submit" aria-label="Send message" title="Send message" disabled={!draft.trim() || !!pendingMessage} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#0d915c] text-white transition hover:bg-[#08794b] disabled:cursor-not-allowed disabled:opacity-45"><FiSend size={17} /></button>
              </form>
            </div>
          )}
          {phase === "consent" && (
            <div className="flex flex-1 flex-col justify-center px-5 py-6">
              <h3 className="text-base font-semibold text-[#013e43]">Search with Renda</h3>
              <p className="mt-2 text-sm leading-6 text-[#56716a]">Ask in your own words. Renda searches public, available listings and can suggest nearby alternatives.</p>
              <p className="mt-4 rounded-xl bg-[#f0f7f4] p-3 text-xs leading-5 text-[#45645b]">{consent?.text || "Your messages are used to search public listings and retained for a limited period."} {consent?.privacyUrl && <a className="font-semibold text-[#0d7952] underline underline-offset-2" href={consent.privacyUrl} target="_blank" rel="noreferrer">Privacy policy</a>}</p>
              {pendingMessage && <p className="mt-3 rounded-xl bg-[#f8fbf9] p-3 text-xs leading-5 text-[#45645b]">Your message is ready. Agree to send it to Renda: <span className="font-medium text-[#013e43]">{pendingMessage}</span></p>}
              <button type="button" disabled={busy} onClick={startChat} className="mt-5 flex min-h-11 items-center justify-center rounded-lg bg-[#0d915c] px-4 text-sm font-semibold text-white transition hover:bg-[#08794b] disabled:opacity-60">{busy ? "Starting…" : "Agree and start"}</button>
              <p className="mt-3 text-center text-[11px] text-[#718780]">Please don’t share passwords, payment details, or identity documents.</p>
              {notice && <p role="alert" className="mt-3 text-center text-xs text-red-700">{notice}</p>}
            </div>
          )}
          {phase === "error" && (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <p className="text-sm leading-6 text-[#45645b]">{notice}</p>
              <Link to="/listings" onClick={() => setOpen(false)} className="mt-4 text-sm font-semibold text-[#0d7952] underline underline-offset-4">Browse listings</Link>
              <button type="button" onClick={() => { setStarted(false); setPhase("idle"); }} className="mt-4 text-xs font-medium text-[#56716a]">Try again</button>
            </div>
          )}
          {phase === "chat" && (
            <>
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[#f8fbf9] px-3 py-4" aria-live="polite">
                {messages.map((message, index) => (
                  <div key={`${message.createdAt || "local"}-${index}`} className={message.direction === "inbound" ? "ml-auto max-w-[88%]" : "mr-auto max-w-[94%]"}>
                    <p className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13px] leading-5 ${message.direction === "inbound" ? "rounded-br-md bg-[#0d915c] text-white" : "rounded-bl-md border border-[#e2ece6] bg-white text-[#234a43]"}`}>{message.text}</p>
                    {!!message.listings?.length && <div className="mt-2 space-y-2">{message.listings.map((listing) => <ListingResult key={listing._id} listing={listing} />)}</div>}
                  </div>
                ))}
                {busy && <div role="status" aria-live="polite" className="flex w-fit max-w-[94%] items-start gap-2 rounded-2xl rounded-bl-md border border-[#e2ece6] bg-white px-3.5 py-2.5 text-xs text-[#56716a]">
                  <span className="mt-1 flex shrink-0 items-center gap-0.5" aria-hidden="true"><i className="h-1 w-1 animate-bounce rounded-full bg-[#0d915c] [animation-delay:-0.2s]" /><i className="h-1 w-1 animate-bounce rounded-full bg-[#0d915c] [animation-delay:-0.1s]" /><i className="h-1 w-1 animate-bounce rounded-full bg-[#0d915c]" /></span>
                  <span className="min-w-0"><span className="block font-semibold">Loading your request</span><span className="mt-0.5 block line-clamp-2 break-words text-[11px] text-[#718780]">{activeRequest}</span></span>
                </div>}
              </div>
              {notice && <div role="alert" className="border-t border-[#f0d6d3] bg-[#fff8f7] px-3 py-2 text-xs text-[#9c3e35]">{notice}</div>}
              <form onSubmit={submit} className="flex shrink-0 items-end gap-2 border-t border-[#e4eee8] bg-white p-3">
                <textarea ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} rows={1} maxLength={2000} placeholder="Tell Renda what you’re looking for…" aria-label="Message Ask Renda" className="max-h-24 min-h-11 flex-1 resize-none rounded-lg border border-[#dce9e2] bg-[#fbfdfc] px-3 py-2.5 text-sm text-[#013e43] outline-none placeholder:text-[#7d928b] focus:border-[#0d915c]" />
                <button type="submit" aria-label="Send message" title="Send message" disabled={busy || !!pendingMessage || !draft.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#0d915c] text-white transition hover:bg-[#08794b] disabled:cursor-not-allowed disabled:opacity-45"><FiSend size={17} /></button>
              </form>
            </>
          )}
        </section>
      )}
      {!open && <button type="button" aria-label="Ask Renda" onClick={() => setOpen(true)} className="ml-auto flex h-14 items-center gap-2.5 rounded-full bg-[#013e43] px-5 text-white shadow-lg transition hover:bg-[#075a55] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d915c]">
        <FiMessageCircle size={20} />
        <span className="text-sm font-semibold">Ask Renda</span>
      </button>}
    </div>
  );
}
