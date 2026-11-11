import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";

const emptyForm = { companyName: "", contactPerson: "", email: "", phone: "", category: "movers", description: "", location: "", website: "" };
const categoryLabels = { movers: "Movers", cleaning: "Cleaning", handyman: "Handyman / repairs", furniture: "Furniture / appliances", internet: "Internet / WiFi" };

export default function AdminAssistedServicePage() {
  const [form, setForm] = useState(emptyForm);
  const [application, setApplication] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const createApplication = async (event) => {
    event.preventDefault();
    setSaving(true);
    setApplication(null);
    setPaymentUrl("");
    try {
      const { data } = await api.post("/admin/service-applications/assisted", form);
      setApplication(data.application);
      toast.success(data.message);
    } catch (error) { toast.error(error.response?.data?.message || "Could not create the provider application."); }
    finally { setSaving(false); }
  };

  const generatePaymentLink = async () => {
    if (!application?._id) return;
    setGenerating(true);
    try {
      const { data } = await api.post(`/services/apply/${application._id}/pay`);
      setPaymentUrl(data.authorization_url);
      toast.success("Payment link generated. Share it with the provider.");
    } catch (error) { toast.error(error.response?.data?.message || "Could not generate the payment link."); }
    finally { setGenerating(false); }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(paymentUrl); toast.success("Payment link copied."); }
    catch { toast.error("Could not copy the link. Select and copy it manually."); }
  };

  return <main className="mx-auto max-w-5xl space-y-7">
    <header className="border-b border-[#DDEAE3] pb-5"><p className="text-xs font-bold uppercase tracking-wide text-[#0D915C]">Service providers</p><h1 className="mt-1 text-xl font-bold text-[#013E43]">Assisted provider application</h1><p className="mt-1 max-w-3xl text-sm text-[#41635A]">Enter a provider’s details, then share their Paystack link. The provider is not published until payment is verified and an admin approves the application.</p></header>
    <form onSubmit={createApplication} className="space-y-5">
      <section className="rounded-md border border-[#DDEAE3] bg-white p-5 sm:p-6">
        <h2 className="font-semibold text-[#013E43]">Provider details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-[#263D35]">Business name *<input required maxLength={160} name="companyName" value={form.companyName} onChange={update} className="mt-1 w-full rounded border border-[#DDEAE3] px-3 py-2.5" /></label>
          <label className="text-sm font-medium text-[#263D35]">Contact person *<input required maxLength={120} name="contactPerson" value={form.contactPerson} onChange={update} className="mt-1 w-full rounded border border-[#DDEAE3] px-3 py-2.5" /></label>
          <label className="text-sm font-medium text-[#263D35]">Email *<input required type="email" name="email" value={form.email} onChange={update} className="mt-1 w-full rounded border border-[#DDEAE3] px-3 py-2.5" /></label>
          <label className="text-sm font-medium text-[#263D35]">Phone *<input required type="tel" maxLength={32} name="phone" value={form.phone} onChange={update} className="mt-1 w-full rounded border border-[#DDEAE3] px-3 py-2.5" /></label>
          <label className="text-sm font-medium text-[#263D35]">Service category *<select name="category" value={form.category} onChange={update} className="mt-1 w-full rounded border border-[#DDEAE3] bg-white px-3 py-2.5">{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-sm font-medium text-[#263D35]">Service area / location *<input required maxLength={200} name="location" value={form.location} onChange={update} placeholder="e.g. Nairobi and Kiambu" className="mt-1 w-full rounded border border-[#DDEAE3] px-3 py-2.5" /></label>
          <label className="text-sm font-medium text-[#263D35] sm:col-span-2">Website (optional)<input type="url" name="website" value={form.website} onChange={update} placeholder="https://example.co.ke" className="mt-1 w-full rounded border border-[#DDEAE3] px-3 py-2.5" /></label>
          <label className="text-sm font-medium text-[#263D35] sm:col-span-2">Service description *<textarea required maxLength={4000} rows={5} name="description" value={form.description} onChange={update} className="mt-1 w-full rounded border border-[#DDEAE3] px-3 py-2.5" /></label>
        </div>
        <button type="submit" disabled={saving} className="mt-5 bg-[#0D915C] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Creating application..." : "Create provider application"}</button>
      </section>
    </form>

    {application && <section className="border-l-4 border-amber-500 bg-amber-50 p-5" aria-live="polite">
      <h2 className="font-semibold text-amber-950">Application created, awaiting payment and review</h2>
      <p className="mt-1 text-sm text-amber-900">{application.companyName} · {categoryLabels[application.category]} · application fee KES {Number(application.amountPaid || 0).toLocaleString()}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" onClick={generatePaymentLink} disabled={generating || Boolean(paymentUrl) || application.paymentStatus === "success"} className="bg-[#013E43] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{generating ? "Generating..." : application.paymentStatus === "success" ? "Payment confirmed" : paymentUrl ? "Payment link ready" : "Generate Paystack link"}</button><a href={`/admin/services/applications/${application._id}`} className="text-sm font-semibold text-[#013E43] underline">Open application review</a></div>
      {paymentUrl && <div className="mt-4 space-y-2"><label htmlFor="provider-payment-url" className="text-sm font-medium text-amber-950">Share this secure payment link with the provider</label><div className="flex flex-col gap-2 sm:flex-row"><input id="provider-payment-url" readOnly value={paymentUrl} className="min-w-0 flex-1 rounded border border-amber-300 bg-white px-3 py-2 text-sm" /><button type="button" onClick={copyLink} className="border border-amber-800 px-4 py-2 text-sm font-semibold text-amber-950">Copy link</button></div><p className="text-xs text-amber-900">Do not pay on the provider’s behalf. They should complete payment themselves; verified payment and admin approval are required before public listing.</p></div>}
    </section>}
  </main>;
}
