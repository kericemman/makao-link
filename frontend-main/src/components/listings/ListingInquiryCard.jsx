import { useMemo, useState } from "react";
import { FiArrowUpRight, FiCheckCircle, FiMail, FiMessageSquare, FiPhone, FiSend, FiUser } from "react-icons/fi";
import { FaApple, FaGooglePlay } from "react-icons/fa";
import { portalLinks } from "../../config/portals";
import { createPublicInquiry } from "../../services/inquiries.service";
import { getApiErrorMessage } from "../../utils/apiError";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  message: ""
};

const userLoginUrl = `${portalLinks.user.href}/login?next=${encodeURIComponent("/inquiries")}`;

export default function ListingInquiryCard({ listing }) {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const defaultMessage = useMemo(
    () => `Hi, I am interested in ${listing?.title || "this property"}. Please contact me with viewing details.`,
    [listing?.title]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    try {
      await createPublicInquiry({
        listingId: listing._id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message || defaultMessage
      });
      setStatus("success");
    } catch (err) {
      setStatus("idle");
      setError(getApiErrorMessage(err, "Could not send your inquiry. Please try again."));
    }
  };

  if (status === "success") {
    return (
      <aside className="rounded-[1.5rem] border border-[#A8D8C1] bg-white p-6 shadow-[0_18px_45px_rgba(22,33,31,0.07)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#02BB31]/10 text-[#02BB31]">
          <FiCheckCircle className="text-2xl" />
        </div>
        <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">Inquiry sent</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#013E43]">Create or sign in to manage this conversation.</h2>
        <p className="mt-3 text-sm leading-6 text-[#065A57]">
          The landlord has received your request. Use the user portal or mobile app to manage replies, track inquiries, and schedule viewing details.
        </p>

        <div className="mt-5 grid gap-3">
          <a
            href={userLoginUrl}
            title={portalLinks.user.purpose}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#013E43] px-5 py-4 text-sm font-extrabold text-white transition hover:bg-[#005C57]"
          >
            Sign in or create account
            <FiArrowUpRight />
          </a>
          <AppDownloadLinks />
        </div>
      </aside>
    );
  }

  return (
    <aside className="rounded-[1.5rem] border border-[#A8D8C1] bg-white p-6 shadow-[0_18px_45px_rgba(22,33,31,0.07)]">
      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">Send inquiry</p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#013E43]">Ask about viewing this property.</h2>
      <p className="mt-2 text-sm leading-6 text-[#065A57]">
        Share your contact details and the landlord will receive your inquiry directly.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <Field icon={FiUser} label="Name" name="name" value={form.name} onChange={handleChange} placeholder="Your full name" required />
        <Field icon={FiMail} label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
        <Field icon={FiPhone} label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+254..." required />

        <label className="block">
          <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#065A57]">Message</span>
          <div className="flex rounded-2xl border border-[#A8D8C1] bg-[#F0F7F4] px-4 py-3 focus-within:border-[#02BB31]">
            <FiMessageSquare className="mt-1 shrink-0 text-[#02BB31]" />
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder={defaultMessage}
              rows={4}
              className="ml-3 min-h-24 w-full resize-none bg-transparent text-sm font-semibold text-[#013E43] outline-none placeholder:text-[#065A57]/70"
            />
          </div>
        </label>

        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#013E43] px-5 py-4 text-sm font-extrabold text-white transition hover:bg-[#005C57] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <FiSend />
          {status === "submitting" ? "Sending inquiry..." : "Send inquiry"}
        </button>
      </form>

      <div className="mt-5 rounded-2xl bg-[#F0F7F4] p-4">
        <p className="text-sm font-extrabold text-[#013E43]">Manage everything in the app</p>
        <p className="mt-1 text-sm leading-6 text-[#065A57]">
          Sign in after sending to manage replies, organize inquiries, and schedule viewing details from one place.
        </p>
        <AppDownloadLinks compact />
      </div>
    </aside>
  );
}

function Field({ icon: Icon, label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#065A57]">{label}</span>
      <div className="flex items-center rounded-2xl border border-[#A8D8C1] bg-[#F0F7F4] px-4 py-3 focus-within:border-[#02BB31]">
        <Icon className="shrink-0 text-[#02BB31]" />
        <input
          {...props}
          className="ml-3 w-full bg-transparent text-sm font-semibold text-[#013E43] outline-none placeholder:text-[#065A57]/70"
        />
      </div>
    </label>
  );
}

function AppDownloadLinks({ compact = false }) {
  const appStoreUrl = import.meta.env.VITE_IOS_APP_URL;
  const playStoreUrl = import.meta.env.VITE_ANDROID_APP_URL;
  const buttonClass = compact
    ? "mt-3 inline-flex items-center gap-2 rounded-full border border-[#A8D8C1] bg-white px-3 py-2 text-xs font-extrabold text-[#013E43]"
    : "inline-flex items-center justify-center gap-2 rounded-2xl border border-[#A8D8C1] bg-white px-4 py-3 text-sm font-extrabold text-[#013E43]";

  return (
    <div className={compact ? "flex flex-wrap gap-2" : "grid gap-2 sm:grid-cols-2"}>
      <a href={playStoreUrl || portalLinks.user.href} className={buttonClass}>
        <FaGooglePlay />
        {playStoreUrl ? "Google Play" : "Mobile app"}
      </a>
      <a href={appStoreUrl || portalLinks.user.href} className={buttonClass}>
        <FaApple />
        {appStoreUrl ? "App Store" : "User portal"}
      </a>
    </div>
  );
}
