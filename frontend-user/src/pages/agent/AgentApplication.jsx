import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiBriefcase, FiFileText, FiMail, FiMapPin, FiPhone, FiUser } from "react-icons/fi";
import { submitAgentApplication } from "../../services/marketplace.service";
import { getApiErrorMessage } from "../../utils/apiError";

const initialForm = { name: "", email: "", phone: "", county: "", town: "", experience: "" };
const acceptedDocuments = ".jpg,.jpeg,.png,.webp,.pdf,.docx";
const maxDocumentSize = 10 * 1024 * 1024;

export default function AgentApplication() {
  const [form, setForm] = useState(initialForm);
  const [identityType, setIdentityType] = useState("national_id");
  const [documentConsent, setDocumentConsent] = useState(false);
  const [files, setFiles] = useState({ identityFront: null, identityBack: null, professionalCredential: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    if (!files.identityFront || !files.professionalCredential) {
      setError("Upload the front of your ID or passport and proof of agent registration or qualification.");
      return;
    }
    if (!documentConsent) {
      setError("Please consent to secure processing of your application documents.");
      return;
    }
    const oversized = Object.values(files).some((file) => file && file.size > maxDocumentSize);
    if (oversized) {
      setError("Each document must be 10 MB or smaller.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = new FormData();
      Object.entries({ ...form, identityType, documentConsent: "true" }).forEach(([key, value]) => payload.append(key, value));
      Object.entries(files).forEach(([key, file]) => { if (file) payload.append(key, file); });
      await submitAgentApplication(payload);
      setSubmitted(true);
      setForm(initialForm);
      setFiles({ identityFront: null, identityBack: null, professionalCredential: null });
      setDocumentConsent(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not submit your application. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return <section className="rounded-[2rem] border border-[#A8D8C1] bg-white/95 p-6 shadow-[0_24px_70px_rgba(22,33,31,0.08)] backdrop-blur sm:p-8">
    <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#168557]">RendaHomes agent network</p>
    <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#013E43]">Apply to become an agent</h1>
    <p className="mt-3 text-sm font-medium leading-6 text-[#496762]">Submit your details, identity document, and proof of agent registration or qualification for secure admin review. Applying does not create an account or grant agent access.</p>

    {submitted ? <div role="status" className="mt-6 border-y border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-950"><p className="font-semibold">Application received.</p><p className="mt-1">RendaHomes will contact you after review. No account has been created yet.</p><Link to="/login" className="mt-3 inline-flex items-center gap-2 font-semibold underline">Return to sign in <FiArrowRight /></Link></div> : <form onSubmit={submit} className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field icon={FiUser} label="Full name"><input required minLength={2} maxLength={100} autoComplete="name" value={form.name} onChange={update("name")} placeholder="Your full name" /></Field>
        <Field icon={FiMail} label="Email"><input required type="email" maxLength={254} autoComplete="email" value={form.email} onChange={update("email")} placeholder="you@example.com" /></Field>
        <Field icon={FiPhone} label="Phone"><input required type="tel" maxLength={16} autoComplete="tel" value={form.phone} onChange={update("phone")} placeholder="+254 712 345 678" /></Field>
        <Field icon={FiFileText} label="Identity document type"><select value={identityType} onChange={(event) => { const nextType = event.target.value; setIdentityType(nextType); if (nextType === "passport") setFiles((current) => ({ ...current, identityBack: null })); }}><option value="national_id">National ID</option><option value="passport">Passport</option></select></Field>
        <Field icon={FiMapPin} label="County"><input maxLength={80} value={form.county} onChange={update("county")} placeholder="Where do you work?" /></Field>
        <Field icon={FiMapPin} label="Town"><input maxLength={80} value={form.town} onChange={update("town")} placeholder="Town or service area" /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <DocumentField label={`${identityType === "passport" ? "Passport photo page" : "ID front"} (required)`} required file={files.identityFront} onChange={(file) => setFiles((current) => ({ ...current, identityFront: file }))} />
        {identityType === "national_id" && <DocumentField label="ID back (optional)" file={files.identityBack} onChange={(file) => setFiles((current) => ({ ...current, identityBack: file }))} />}
        <DocumentField label="Agent registration or qualification (required)" required file={files.professionalCredential} onChange={(file) => setFiles((current) => ({ ...current, professionalCredential: file }))} />
      </div>
      <p className="text-xs leading-5 text-[#647C75]">Accepted formats: JPG, PNG, WebP, PDF, or DOCX. Maximum 10 MB per file. Documents are stored privately and only made available to authorized reviewers.</p>
      <label className="flex items-start gap-2 text-sm leading-5 text-[#36564D]"><input required type="checkbox" checked={documentConsent} onChange={(event) => setDocumentConsent(event.target.checked)} className="mt-1 accent-[#0D915C]" /><span>I consent to RendaHomes securely processing these documents to review my agent application. See the <a href="https://rendahomes.com/privacy-policy" target="_blank" rel="noreferrer" className="font-semibold text-[#013E43] underline">Privacy Policy</a>.</span></label>
      <Field icon={FiBriefcase} label="Relevant experience"><textarea maxLength={1500} rows={4} value={form.experience} onChange={update("experience")} placeholder="Tell us briefly about your real-estate or customer service experience." /></Field>
      {error && <p role="alert" className="border-y border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</p>}
      <button disabled={loading} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#013E43] px-5 text-sm font-bold text-white disabled:opacity-60">{loading ? "Submitting application…" : "Submit application"}<FiArrowRight /></button>
    </form>}
    <p className="mt-5 text-center text-sm font-semibold text-[#647C75]">Already an agent? <Link to="/login" className="text-[#013E43] underline">Sign in</Link></p>
  </section>;
}

function DocumentField({ label, required = false, file, onChange }) {
  return <label className="block min-w-0">
    <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#496762]">{label}</span>
    <span className="flex min-h-12 items-center gap-3 rounded-xl border border-[#A8D8C1] bg-[#F5F8F6] px-3 py-2.5">
      <FiFileText className="shrink-0 text-[#168557]" />
      <input required={required} type="file" accept={acceptedDocuments} onChange={(event) => onChange(event.target.files?.[0] || null)} className="min-w-0 w-full text-xs text-[#013E43] file:mr-2 file:rounded-md file:border-0 file:bg-white file:px-2 file:py-1.5 file:text-xs file:font-semibold file:text-[#013E43]" />
    </span>
    {file && <span className="mt-1 block truncate text-xs text-[#647C75]">{file.name}</span>}
  </label>;
}

function Field({ icon: Icon, label, children }) {
  return <label className="block">
    <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#496762]">{label}</span>
    <span className="flex items-start gap-3 rounded-xl border border-[#A8D8C1] bg-[#F5F8F6] px-3 py-2.5 focus-within:border-[#168557]">
      <Icon className="mt-1 shrink-0 text-[#168557]" />
      {children.type === "textarea" ? <textarea {...children.props} className="min-h-24 w-full resize-y bg-transparent text-sm text-[#013E43] outline-none placeholder:text-slate-400" /> : children.type === "select" ? <select {...children.props} className="h-6 w-full bg-transparent text-sm text-[#013E43] outline-none">{children.props.children}</select> : <input {...children.props} className="h-6 w-full bg-transparent text-sm text-[#013E43] outline-none placeholder:text-slate-400" />}
    </span>
  </label>;
}
