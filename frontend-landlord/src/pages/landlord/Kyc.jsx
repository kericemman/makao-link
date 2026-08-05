import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiImage,
  FiRefreshCw,
  FiShield,
  FiUpload
} from "react-icons/fi";
import toast from "react-hot-toast";
import { getMyKyc, submitKyc } from "../../services/kyc.service";

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  not_submitted: "bg-slate-50 text-slate-700 border-slate-200"
};

const statusIcons = {
  pending: FiClock,
  approved: FiCheckCircle,
  rejected: FiAlertCircle,
  not_submitted: FiShield
};

export default function LandlordKycPage() {
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    idType: "national_id",
    idNumber: "",
    documentFront: null,
    documentBack: null,
    selfiePhoto: null,
    proofOfOwnership: null
  });

  const status = kyc?.status || "not_submitted";
  const StatusIcon = statusIcons[status] || FiShield;

  const fileFields = useMemo(
    () => [
      {
        name: "documentFront",
        label: "ID front",
        required: true,
        hint: "National ID, passport, or driver's license front image."
      },
      {
        name: "documentBack",
        label: "ID back",
        required: false,
        hint: "Required only if your document has a back side."
      },
      {
        name: "selfiePhoto",
        label: "Selfie photo",
        required: true,
        hint: "A clear photo of you for identity matching."
      },
      {
        name: "proofOfOwnership",
        label: "Proof of ownership",
        required: false,
        hint: "Optional title, agreement, utility bill, or management letter."
      }
    ],
    []
  );

  const loadKyc = async () => {
    try {
      setLoading(true);
      const data = await getMyKyc();
      const nextKyc = data.kyc || null;
      setKyc(nextKyc);

      if (nextKyc) {
        setForm((prev) => ({
          ...prev,
          fullName: nextKyc.fullName || "",
          idType: nextKyc.idType || "national_id",
          idNumber: nextKyc.idNumber || ""
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load KYC status", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKyc();
  }, []);

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.fullName.trim() || !form.idNumber.trim()) {
      toast.error("Full name and ID number are required", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    if (!kyc && (!form.documentFront || !form.selfiePhoto)) {
      toast.error("ID front and selfie photo are required", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    const payload = new FormData();
    payload.append("fullName", form.fullName);
    payload.append("idType", form.idType);
    payload.append("idNumber", form.idNumber);

    fileFields.forEach((field) => {
      if (form[field.name]) {
        payload.append(field.name, form[field.name]);
      }
    });

    try {
      setSaving(true);
      const data = await submitKyc(payload);
      setKyc(data.kyc);
      toast.success(data.message || "KYC submitted for review", {
        style: { background: "#02BB31", color: "#fff" }
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit KYC", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#A8D8C1] border-t-[#02BB31]" />
          <p className="text-[#065A57]">Loading KYC status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#DDEBE4] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#0D915C]">Landlord verification</p>
            <h1 className="mt-2 text-2xl font-bold text-[#013E43]">KYC Verification</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#065A57]">
              Submit your identity documents once you upgrade to a paid plan. Approved KYC helps admin trust your listings and protects tenants from false property posts.
            </p>
          </div>

          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold ${statusStyles[status]}`}>
            <StatusIcon />
            {status.replace("_", " ")}
          </div>
        </div>

        {kyc?.rejectionReason && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <strong>Admin note:</strong> {kyc.rejectionReason}
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-[#DDEBE4] bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Full legal name">
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Name exactly as shown on ID"
              className="w-full rounded-xl border border-[#A8D8C1] px-4 py-3 text-sm outline-none focus:border-[#02BB31]"
            />
          </Field>

          <Field label="Document type">
            <select
              name="idType"
              value={form.idType}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#A8D8C1] bg-white px-4 py-3 text-sm outline-none focus:border-[#02BB31]"
            >
              <option value="national_id">National ID</option>
              <option value="passport">Passport</option>
              <option value="drivers_license">Driver's license</option>
            </select>
          </Field>

          <Field label="Document number">
            <input
              name="idNumber"
              value={form.idNumber}
              onChange={handleChange}
              placeholder="ID or passport number"
              className="w-full rounded-xl border border-[#A8D8C1] px-4 py-3 text-sm outline-none focus:border-[#02BB31]"
            />
          </Field>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {fileFields.map((field) => (
            <label key={field.name} className="block rounded-2xl border border-dashed border-[#A8D8C1] bg-[#F6FAF8] p-5 transition hover:border-[#02BB31]">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-[#0D915C]">
                  <FiImage />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#013E43]">{field.label}</span>
                    {field.required && <span className="text-xs font-bold text-red-500">Required</span>}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#065A57]">{field.hint}</p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#013E43]">
                    <FiUpload />
                    {form[field.name]?.name || "Choose image"}
                  </div>
                </div>
              </div>
              <input name={field.name} type="file" accept="image/*" onChange={handleChange} className="sr-only" />
            </label>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-[#DDEBE4] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-[#065A57]">
            <FiFileText className="text-[#0D915C]" />
            Max 10MB per image. JPG, PNG, WEBP, and AVIF are accepted.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#013E43] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#065A57] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? <FiRefreshCw className="animate-spin" /> : <FiShield />}
            {saving ? "Submitting..." : "Submit for review"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#013E43]">{label}</span>
      {children}
    </label>
  );
}
