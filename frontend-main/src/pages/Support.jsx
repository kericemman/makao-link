import { useEffect, useState } from "react";
import { FiMail, FiMapPin, FiPhone, FiSend } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { getApiErrorMessage } from "../utils/apiError";
import { getContactInfo, sendContactMessage } from "../services/public.service";

const initialForm = { name: "", email: "", phone: "", subject: "", message: "" };

export default function Support() {
  const [contact, setContact] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getContactInfo().then((data) => setContact(data.contact)).catch(() => {});
  }, []);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      setStatus("");
      await sendContactMessage(form);
      setForm(initialForm);
      setStatus("Your message has been sent. The RendaHomes team will get back to you.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not send your message."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-[#F6FAF8]">
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">Support</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#013E43]">Talk to RendaHomes.</h1>
          <p className="mt-4 text-sm leading-6 text-[#065A57]">For listing questions, account help, partnerships, or general support, send a message and we will route it to the right team.</p>
          <div className="mt-8 space-y-3 text-sm font-semibold text-[#065A57]">
            <ContactRow icon={FiMail} value={contact?.email || "support@rendahomes.com"} href={`mailto:${contact?.email || "support@rendahomes.com"}`} />
            <ContactRow icon={FiPhone} value={contact?.phone || "+254 738 388 000"} href={`tel:${contact?.phone || "+254738388000"}`} />
            <ContactRow icon={FaWhatsapp} value={contact?.whatsapp || "+254 738 388 000"} href={`https://wa.me/${(contact?.whatsapp || "254738388000").replace(/[^\d]/g, "")}`} />
            <ContactRow icon={FiMapPin} value={contact?.address || "Nairobi, Kenya"} />
          </div>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-[#DDEBE4] bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="name" value={form.name} onChange={updateField} placeholder="Your name" />
            <Input name="phone" value={form.phone} onChange={updateField} placeholder="Phone number" />
            <Input name="email" type="email" value={form.email} onChange={updateField} placeholder="Email address" />
            <Input name="subject" value={form.subject} onChange={updateField} placeholder="Subject" />
          </div>
          <textarea
            name="message"
            value={form.message}
            onChange={updateField}
            placeholder="How can we help?"
            className="mt-4 min-h-36 w-full rounded-xl border border-[#DDEBE4] px-4 py-3 text-sm font-semibold text-[#013E43] outline-none focus:border-[#02BB31] focus:ring-4 focus:ring-[#E7F8EE]"
            required
          />
          {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
          {status ? <p className="mt-3 text-sm font-semibold text-[#0D915C]">{status}</p> : null}
          <button disabled={submitting} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#013E43] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60">
            <FiSend /> {submitting ? "Sending..." : "Send message"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      required
      className="h-12 rounded-xl border border-[#DDEBE4] px-4 text-sm font-semibold text-[#013E43] outline-none focus:border-[#02BB31] focus:ring-4 focus:ring-[#E7F8EE]"
    />
  );
}

function ContactRow({ icon: Icon, value, href }) {
  const content = (
    <>
      <Icon className="text-[#02BB31]" />
      <span>{value}</span>
    </>
  );
  return href ? <a href={href} className="flex items-center gap-3 hover:text-[#013E43]">{content}</a> : <p className="flex items-center gap-3">{content}</p>;
}
