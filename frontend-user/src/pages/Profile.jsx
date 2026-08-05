import { useState } from "react";
import { FiSave, FiUpload } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "../services/user.service";
import { getApiErrorMessage } from "../utils/apiError";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    location: user?.location || "",
    bio: user?.bio || "",
    businessName: user?.businessName || ""
  });
  const [avatar, setAvatar] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const data = await updateProfile({ ...form, avatar });
      updateUser(data.user);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not update profile."));
    }
  };

  return (
    <section className="rounded-[1.5rem] border border-[#A8D8C1] bg-white p-6">
      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">Profile</p>
      <h1 className="mt-2 text-3xl font-extrabold text-[#013E43]">Keep your contact details current.</h1>
      <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Name" value={form.name} onChange={(name) => setForm((f) => ({ ...f, name }))} />
        <Field label="Phone" value={form.phone} onChange={(phone) => setForm((f) => ({ ...f, phone }))} />
        <Field label="Location" value={form.location} onChange={(location) => setForm((f) => ({ ...f, location }))} />
        <Field label="Business name" value={form.businessName} onChange={(businessName) => setForm((f) => ({ ...f, businessName }))} />
        <label className="md:col-span-2">
          <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#065A57]">Bio</span>
          <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={4} className="w-full rounded-2xl border border-[#A8D8C1] bg-[#F0F7F4] px-4 py-3 text-sm font-semibold outline-none" />
        </label>
        <label className="md:col-span-2">
          <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#065A57]">Avatar</span>
          <span className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-[#02BB31] bg-[#F0F7F4] px-4 py-4 text-sm font-extrabold text-[#013E43]">
            <FiUpload />
            {avatar?.name || "Choose image"}
            <input type="file" accept="image/*" className="hidden" onChange={(event) => setAvatar(event.target.files?.[0] || null)} />
          </span>
        </label>
        {message ? <p className="md:col-span-2 rounded-2xl bg-[#F0F7F4] px-4 py-3 text-sm font-semibold text-[#065A57]">{message}</p> : null}
        {error ? <p className="md:col-span-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#013E43] px-5 py-4 text-sm font-extrabold text-white md:col-span-2">
          <FiSave />
          Save profile
        </button>
      </form>
    </section>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#065A57]">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-[#A8D8C1] bg-[#F0F7F4] px-4 py-3 text-sm font-semibold outline-none" />
    </label>
  );
}
