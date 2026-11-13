import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FiArrowLeft, FiExternalLink, FiMail, FiMessageCircle, FiRefreshCw, FiSend } from "react-icons/fi";
import { getLandlordOnboardingDetail, sendManualLandlordOnboardingEmail } from "../../services/admin.service";

const stageLabels = {
  email_unverified: "Email not verified",
  plan_payment: "Plan payment pending",
  no_listing: "No property added",
  listing_review: "Listing under review",
  listing_needs_changes: "Listing needs changes",
  listing_live: "Approved listing",
  listing_in_progress: "Listing in progress",
  listing_removed: "Listing removed"
};

const makeRequestId = () => globalThis.crypto?.randomUUID?.()
  || `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const buildWhatsAppLink = (baseUrl, message) => {
  if (!baseUrl || !message.trim()) return "";
  try {
    const url = new URL(baseUrl);
    if (url.protocol !== "https:" || url.hostname !== "wa.me") return "";
    url.searchParams.set("text", message.trim());
    return url.toString();
  } catch {
    return "";
  }
};

export default function AdminLandlordOnboardingDetailPage() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [subject, setSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getLandlordOnboardingDetail(userId);
      setData(result);
      const name = result.landlord?.name || "there";
      const draft = `Hi ${name}, this is the RendaHomes team. I’m reaching out to see if you need any help with your landlord account or property listing. You can continue from your landlord dashboard, or reply here and we’ll help you with the next step.`;
      setSubject("Can we help you get started on RendaHomes?");
      setEmailMessage(draft);
      setWhatsappMessage(draft);
    } catch (error) {
      setData(null);
      toast.error(error.response?.data?.message || "Could not load this landlord’s onboarding details.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const whatsappLink = useMemo(
    () => buildWhatsAppLink(data?.whatsappUrl, whatsappMessage),
    [data?.whatsappUrl, whatsappMessage]
  );

  const sendEmail = async (event) => {
    event.preventDefault();
    if (!subject.trim() || !emailMessage.trim()) {
      toast.error("Add an email subject and message first.");
      return;
    }
    try {
      setSending(true);
      const result = await sendManualLandlordOnboardingEmail(userId, {
        requestId: makeRequestId(),
        subject: subject.trim(),
        message: emailMessage.trim()
      });
      toast.success(result.message || "Email sent to the landlord.");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send the email.");
    } finally {
      setSending(false);
    }
  };

  if (loading && !data) {
    return <div className="py-16 text-center text-sm text-[#55706A]">Loading landlord details...</div>;
  }
  if (!data?.landlord) {
    return (
      <div className="space-y-4 py-10">
        <p role="alert" className="text-sm text-red-700">Landlord details could not be loaded.</p>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-md border border-[#C8D8D0] px-3 py-2 text-sm font-semibold text-[#013E43]"><FiRefreshCw /> Try again</button>
        <Link to="/admin/onboarding" className="ml-3 text-sm font-semibold text-[#0D915C]">Back to onboarding</Link>
      </div>
    );
  }

  const landlord = data.landlord;
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="border-b border-[#DDEAE3] pb-5">
        <Link to="/admin/onboarding" className="inline-flex items-center gap-2 text-sm font-medium text-[#55706A] hover:text-[#0D915C]"><FiArrowLeft /> Onboarding progress</Link>
        <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0D915C]">Landlord follow-up</p>
            <h1 className="mt-1 truncate text-2xl font-semibold text-[#013E43]">{landlord.name}</h1>
            <p className="mt-1 break-all text-sm text-[#55706A]">{landlord.email}{landlord.phone ? ` · ${landlord.phone}` : ""}</p>
          </div>
          <span className="self-start rounded-full bg-[#F0F8F3] px-3 py-1.5 text-xs font-semibold text-[#176C4B] sm:self-auto">{stageLabels[data.stage] || data.stage}</span>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-y-4 border-b border-[#DDEAE3] pb-5 text-sm sm:grid-cols-4">
        <div><p className="text-xs text-[#71827D]">Joined</p><p className="mt-1 font-medium text-[#013E43]">{new Date(landlord.createdAt).toLocaleDateString()}</p></div>
        <div><p className="text-xs text-[#71827D]">Email</p><p className="mt-1 font-medium text-[#013E43]">{landlord.emailVerified ? "Verified" : "Not verified"}</p></div>
        <div><p className="text-xs text-[#71827D]">Plan</p><p className="mt-1 font-medium capitalize text-[#013E43]">{data.subscription?.plan || "No plan"}{data.subscription?.status ? ` · ${data.subscription.status}` : ""}</p></div>
        <div><p className="text-xs text-[#71827D]">Properties</p><p className="mt-1 font-medium text-[#013E43]">{data.listingCounts?.total || 0} total · {data.listingCounts?.approved || 0} approved</p></div>
      </section>

      {data.automatedFollowup ? <p className="text-xs text-[#71827D]">Automated reminder: {data.automatedFollowup.status}{data.automatedFollowup.sentAt ? ` · ${new Date(data.automatedFollowup.sentAt).toLocaleString()}` : ""}</p> : null}

      <section className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={sendEmail} className="space-y-4 border-b border-[#DDEAE3] pb-6 lg:border-b-0 lg:border-r lg:pr-8">
          <div className="flex items-center gap-2"><FiMail className="text-[#0D915C]" /><h2 className="font-semibold text-[#013E43]">Email follow-up</h2></div>
          <p className="text-xs text-[#71827D]">Email goes to the address on this account. The message is formatted and sent through RendaHomes email.</p>
          {!data.emailConfigured ? <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">Email is not configured on this server.</p> : null}
          <label className="block text-xs font-semibold text-[#526760]">Subject
            <input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={160} required className="mt-1.5 h-10 w-full rounded-md border border-[#C8D8D0] px-3 text-sm font-normal text-[#013E43] outline-none focus:border-[#0D915C]" />
          </label>
          <label className="block text-xs font-semibold text-[#526760]">Message
            <textarea value={emailMessage} onChange={(event) => setEmailMessage(event.target.value)} maxLength={4000} required rows={7} className="mt-1.5 w-full resize-y rounded-md border border-[#C8D8D0] px-3 py-2 text-sm font-normal leading-6 text-[#013E43] outline-none focus:border-[#0D915C]" />
          </label>
          {data.lastManualEmail ? <p className="text-xs text-[#71827D]">Last manual email: {data.lastManualEmail.status}{data.lastManualEmail.sentAt ? ` · ${new Date(data.lastManualEmail.sentAt).toLocaleString()}` : ""}</p> : null}
          {data.lastManualEmail && ["sending", "unknown"].includes(data.lastManualEmail.status) ? <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">Delivery is unconfirmed. Check the email provider before sending again to prevent a duplicate.</p> : null}
          <button type="submit" disabled={sending || !data.emailConfigured || !landlord.email || ["sending", "unknown"].includes(data.lastManualEmail?.status)} className="inline-flex items-center gap-2 rounded-md bg-[#0D915C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#08764A] disabled:cursor-not-allowed disabled:opacity-50"><FiSend />{sending ? "Sending..." : "Send email"}</button>
        </form>

        <section className="space-y-4">
          <div className="flex items-center gap-2"><FiMessageCircle className="text-[#0D915C]" /><h2 className="font-semibold text-[#013E43]">WhatsApp follow-up</h2></div>
          <p className="text-xs leading-5 text-[#71827D]">Review the draft, then open a direct chat with this landlord. WhatsApp opens with the text filled in; an admin must review and press Send there.</p>
          <label className="block text-xs font-semibold text-[#526760]">Message
            <textarea value={whatsappMessage} onChange={(event) => setWhatsappMessage(event.target.value)} maxLength={1500} rows={9} className="mt-1.5 w-full resize-y rounded-md border border-[#C8D8D0] px-3 py-2 text-sm font-normal leading-6 text-[#013E43] outline-none focus:border-[#0D915C]" />
          </label>
          {whatsappLink ? (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md bg-[#16865A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0E7049]"><FiExternalLink /> Open WhatsApp draft</a>
          ) : (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">A valid +254 mobile number is not saved on this landlord account.</p>
          )}
        </section>
      </section>
    </div>
  );
}
