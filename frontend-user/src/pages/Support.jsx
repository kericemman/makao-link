import { useState } from "react";
import { FiSend } from "react-icons/fi";
import { createSupportTicket } from "../services/support.service";
import { getApiErrorMessage } from "../utils/apiError";

export default function Support() {
  const [form, setForm] = useState({ category: "account", subject: "", message: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setNotice("");
    setError("");

    try {
      await createSupportTicket(form);
      setNotice("Support ticket submitted. The team will review it.");
      setForm({ category: "account", subject: "", message: "" });
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not submit support ticket."));
    }
  };

  return (
    <section className="rounded-[1.5rem] border border-[#A8D8C1] bg-white p-6">
      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">Support</p>
      <h1 className="mt-2 text-3xl font-extrabold text-[#013E43]">Tell us what you need help with.</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#065A57]">Category</span>
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full rounded-2xl border border-[#A8D8C1] bg-[#F0F7F4] px-4 py-3 text-sm font-semibold outline-none">
            <option value="account">Account</option>
            <option value="inquiries">Inquiries</option>
            <option value="listings">Listings</option>
            <option value="services">Services</option>
            <option value="technical">Technical issue</option>
          </select>
        </label>
        <Field label="Subject" value={form.subject} onChange={(subject) => setForm((f) => ({ ...f, subject }))} />
        <label className="block">
          <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#065A57]">Message</span>
          <textarea required rows={5} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} className="w-full rounded-2xl border border-[#A8D8C1] bg-[#F0F7F4] px-4 py-3 text-sm font-semibold outline-none" />
        </label>
        {notice ? <p className="rounded-2xl bg-[#F0F7F4] px-4 py-3 text-sm font-semibold text-[#065A57]">{notice}</p> : null}
        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#013E43] px-5 py-4 text-sm font-extrabold text-white">
          <FiSend />
          Submit ticket
        </button>
      </form>
    </section>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#065A57]">{label}</span>
      <input required value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-[#A8D8C1] bg-[#F0F7F4] px-4 py-3 text-sm font-semibold outline-none" />
    </label>
  );
}
