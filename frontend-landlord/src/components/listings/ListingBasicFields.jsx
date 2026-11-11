import { FiFileText } from "react-icons/fi";

export default function ListingBasicFields({ formData, errors, onChange, disabled }) {
  return (
    <section className="rounded-md border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center text-lg font-semibold text-[#0F172A]"><FiFileText className="mr-2 text-[#126542]" />Basic Information</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#0F172A]">Title <span className="text-red-500">*</span></label>
          <div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><FiFileText className="h-5 w-5 text-[#0D915C]" /></div><input name="title" value={formData.title} onChange={onChange} placeholder="e.g., 2 Bedroom Modern Apartment in Westlands" className={`w-full rounded-lg border-2 py-3 pl-10 pr-4 outline-none transition-all ${errors.title ? "border-red-400 bg-red-50 focus:border-red-500" : "border-[#E2E8F0] focus:border-[#126542]"}`} disabled={disabled} /></div>
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#0F172A]">Description <span className="text-red-500">*</span></label>
          <textarea name="description" value={formData.description} onChange={onChange} rows="5" placeholder="Describe your property in detail..." className={`w-full resize-none rounded-lg border-2 px-4 py-3 outline-none transition-all ${errors.description ? "border-red-400 bg-red-50 focus:border-red-500" : "border-[#E2E8F0] focus:border-[#126542]"}`} disabled={disabled} />
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
        </div>
      </div>
    </section>
  );
}
