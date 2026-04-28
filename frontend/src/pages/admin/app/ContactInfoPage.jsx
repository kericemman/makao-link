import { useEffect, useState } from "react";
import {
  getContactInfo,
  updateContactInfo
} from "../../../services/app/adminContent.service";
import { 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiFacebook, 
  FiInstagram, 
  FiLinkedin, 
  FiTwitter,
  FiSave,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiGlobe,
  FiMessageCircle
} from "react-icons/fi";
import { FaWhatsapp, FaTiktok } from "react-icons/fa";
import toast from "react-hot-toast";

const initialForm = {
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  socials: {
    facebook: "",
    instagram: "",
    linkedin: "",
    x: "",
    tiktok: ""
  }
};

export default function ContactInfoPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const loadContact = async () => {
    try {
      setFetching(true);
      const { data } = await getContactInfo();
      if (data.contact) {
        setForm({
          email: data.contact.email || "",
          phone: data.contact.phone || "",
          whatsapp: data.contact.whatsapp || "",
          address: data.contact.address || "",
          socials: {
            facebook: data.contact.socials?.facebook || "",
            instagram: data.contact.socials?.instagram || "",
            linkedin: data.contact.socials?.linkedin || "",
            x: data.contact.socials?.x || "",
            tiktok: data.contact.socials?.tiktok || ""
          }
        });
      }
    } catch {
      toast.error("Failed to load contact info", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadContact();
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateSocial = (key, value) => {
    setForm((prev) => ({
      ...prev,
      socials: {
        ...prev.socials,
        [key]: value
      }
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await updateContactInfo(form);
      toast.success("Contact information updated successfully", {
        style: { background: "#02BB31", color: "#fff" }
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update contact info", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  const socialFields = [
    { key: "facebook", label: "Facebook", icon: FiFacebook, color: "text-[#1877F2]", placeholder: "https://facebook.com/rendahomes" },
    { key: "instagram", label: "Instagram", icon: FiInstagram, color: "text-[#E4405F]", placeholder: "https://instagram.com/rendahomes" },
    { key: "linkedin", label: "LinkedIn", icon: FiLinkedin, color: "text-[#0A66C2]", placeholder: "https://linkedin.com/company/rendahomes" },
    { key: "x", label: "X / Twitter", icon: FiTwitter, color: "text-[#1DA1F2]", placeholder: "https://x.com/rendahomes" },
    { key: "tiktok", label: "TikTok", icon: FaTiktok, color: "text-black", placeholder: "https://tiktok.com/@rendahomes" }
  ];

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading contact information...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl">
              <FiGlobe className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">Contact Information</h1>
              <p className="text-sm text-[#065A57]">
                Manage contact details displayed on the Contact Us page and mobile app
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={loadContact}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className="text-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* Contact Details Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden">
        <div className="bg-gradient-to-r from-[#F0F7F4] to-white p-6 border-b border-[#A8D8C1]">
          <h2 className="text-lg font-bold text-[#013E43] flex items-center">
            <FiMail className="mr-2 text-[#02BB31]" />
            Contact Details
          </h2>
          <p className="text-sm text-[#065A57] mt-1">
            These details appear on the Contact Us screen across web and mobile platforms
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-[#0D915C]" />
                </div>
                <input
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                  placeholder="support@rendahomes.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiPhone className="h-5 w-5 text-[#0D915C]" />
                </div>
                <input
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                  placeholder="+254 700 000 000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                WhatsApp Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaWhatsapp className="h-5 w-5 text-[#25D366]" />
                </div>
                <input
                  value={form.whatsapp}
                  onChange={(e) => updateField("whatsapp", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                  placeholder="+254 700 000 000"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMapPin className="h-5 w-5 text-[#0D915C]" />
                </div>
                <input
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                  placeholder="Nairobi, Kenya"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Media Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden">
        <div className="bg-gradient-to-r from-[#F0F7F4] to-white p-6 border-b border-[#A8D8C1]">
          <h2 className="text-lg font-bold text-[#013E43] flex items-center">
            <FiGlobe className="mr-2 text-[#02BB31]" />
            Social Media Links
          </h2>
          <p className="text-sm text-[#065A57] mt-1">
            Add social links that users can open from the Contact page and mobile app
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {socialFields.map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-[#013E43] mb-1 capitalize">
                    {field.label}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Icon className={`h-5 w-5 ${field.color}`} />
                    </div>
                    <input
                      value={form.socials[field.key]}
                      onChange={(e) => updateSocial(field.key, e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                      placeholder={field.placeholder}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden">
        <div className="bg-gradient-to-r from-[#F0F7F4] to-white p-6 border-b border-[#A8D8C1]">
          <h2 className="text-lg font-bold text-[#013E43] flex items-center">
            <FiCheckCircle className="mr-2 text-[#02BB31]" />
            Preview
          </h2>
          <p className="text-sm text-[#065A57] mt-1">
            How your contact information will appear to users
          </p>
        </div>

        <div className="p-6">
          <div className="bg-[#F0F7F4] rounded-xl p-6 border border-[#A8D8C1]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-[#013E43] mb-3">Contact Methods</h3>
                <div className="space-y-2">
                  {form.email && (
                    <div className="flex items-center gap-2 text-sm text-[#065A57]">
                      <FiMail className="text-[#02BB31]" />
                      <span>{form.email}</span>
                    </div>
                  )}
                  {form.phone && (
                    <div className="flex items-center gap-2 text-sm text-[#065A57]">
                      <FiPhone className="text-[#02BB31]" />
                      <span>{form.phone}</span>
                    </div>
                  )}
                  {form.whatsapp && (
                    <div className="flex items-center gap-2 text-sm text-[#065A57]">
                      <FaWhatsapp className="text-[#25D366]" />
                      <span>{form.whatsapp}</span>
                    </div>
                  )}
                  {form.address && (
                    <div className="flex items-center gap-2 text-sm text-[#065A57]">
                      <FiMapPin className="text-[#02BB31]" />
                      <span>{form.address}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#013E43] mb-3">Social Media</h3>
                <div className="flex flex-wrap gap-3">
                  {form.socials.facebook && (
                    <a href="#" className="p-2 bg-white rounded-lg text-[#1877F2] hover:bg-[#F0F7F4] transition-colors">
                      <FiFacebook className="text-xl" />
                    </a>
                  )}
                  {form.socials.instagram && (
                    <a href="#" className="p-2 bg-white rounded-lg text-[#E4405F] hover:bg-[#F0F7F4] transition-colors">
                      <FiInstagram className="text-xl" />
                    </a>
                  )}
                  {form.socials.linkedin && (
                    <a href="#" className="p-2 bg-white rounded-lg text-[#0A66C2] hover:bg-[#F0F7F4] transition-colors">
                      <FiLinkedin className="text-xl" />
                    </a>
                  )}
                  {form.socials.x && (
                    <a href="#" className="p-2 bg-white rounded-lg text-[#1DA1F2] hover:bg-[#F0F7F4] transition-colors">
                      <FiTwitter className="text-xl" />
                    </a>
                  )}
                  {form.socials.tiktok && (
                    <a href="#" className="p-2 bg-white rounded-lg text-black hover:bg-[#F0F7F4] transition-colors">
                      <FaTiktok className="text-xl" />
                    </a>
                  )}
                </div>
                {!Object.values(form.socials).some(v => v) && (
                  <p className="text-sm text-[#065A57]">No social links added yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Saving...
            </>
          ) : (
            <>
              <FiSave className="text-lg" />
              Save Contact Information
            </>
          )}
        </button>
      </div>
    </form>
  );
}