import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPartnerApplication, initializePartnerApplicationPayment } from "../../../services/service.service";
import { 
  
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin,
  FiGlobe,
  FiFileText,
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowLeft,
  FiInfo,
  FiDollarSign,
  FiShield,
  FiClock
} from "react-icons/fi";
import { FaWhatsapp, FaHandshake, FaHome, FaCircle } from "react-icons/fa";
import toast from "react-hot-toast";
import { useEditor } from "@tiptap/react";

const PartnerApplicationPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    category: "moving",
    description: "",
    location: "",
    website: ""
  });

  const [logo, setLogo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  const logoPreview = useMemo(() => {
    return logo ? URL.createObjectURL(logo) : "";
  }, [logo]);

  const categories = [
    { value: "moving", label: "Movers & Moving Services", icon: "🚚" },
    { value: "cleaning", label: "Cleaning Companies", icon: "🧹" },
    { value: "repairs", label: "Handyman / Repairs", icon: "🔧" },
    { value: "furniture", label: "Furniture & Appliances", icon: "🛋️" },
    { value: "internet", label: "Internet / WiFi Providers", icon: "📡" }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleLogo = (e) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo must be less than 2MB", {
          style: { background: "#013E43", color: "#fff" }
        });
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file", {
          style: { background: "#013E43", color: "#fff" }
        });
        return;
      }
      setLogo(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) newErrors.companyName = "Company name is required";
    if (!formData.contactPerson.trim()) newErrors.contactPerson = "Contact person is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Please enter a valid email";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^(07|01)\d{8}$/.test(formData.phone)) newErrors.phone = "Please enter a valid Kenyan phone number";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.description.trim()) newErrors.description = "Company description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value);
      });

      if (logo) {
        payload.append("logo", logo);
      }

      const applicationData = await createPartnerApplication(payload);
      const applicationId = applicationData.application?._id;

      if (!applicationId) {
        throw new Error("Application created but no application ID was returned.");
      }

      toast.success("Application created! Redirecting to payment...", {
        style: { background: "#02BB31", color: "#fff" }
      });

      const paymentData = await initializePartnerApplicationPayment(applicationId);
      window.location.href = paymentData.authorization_url;
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to submit application"
      );
      toast.error("Failed to submit application", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  const removeLogo = () => {
    setLogo(null);
  };

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#013E43] to-[#005C57] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#02BB31] rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#A8D8C1] rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-4">
            <Link
              to="/services"
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <FiArrowLeft className="text-xl" />
            </Link>
            <div className="p-3 bg-white/10 rounded-xl">
              <FaHandshake className="text-2xl text-[#02BB31]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Apply as a Partner</h1>
              <p className="text-sm text-[#A8D8C1] mt-1">
                Join RendaHomes trusted service network
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden">
              <div className="bg-gradient-to-r from-[#013E43] to-[#005C57] p-6">
                <h2 className="text-xl font-bold text-white">Partner Application</h2>
                <p className="text-sm text-[#A8D8C1] mt-1">
                  Fill in your company details to get started
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-[#013E43] mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaHome className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                      <input
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                          errors.companyName
                            ? 'border-red-400 focus:border-red-500 bg-red-50'
                            : 'border-[#A8D8C1] focus:border-[#02BB31]'
                        }`}
                        placeholder="Your company name"
                      />
                    </div>
                    {errors.companyName && (
                      <p className="text-xs text-red-500 mt-1">{errors.companyName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#013E43] mb-1">
                      Contact Person <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                      <input
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                          errors.contactPerson
                            ? 'border-red-400 focus:border-red-500 bg-red-50'
                            : 'border-[#A8D8C1] focus:border-[#02BB31]'
                        }`}
                        placeholder="Full name"
                      />
                    </div>
                    {errors.contactPerson && (
                      <p className="text-xs text-red-500 mt-1">{errors.contactPerson}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#013E43] mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                          errors.email
                            ? 'border-red-400 focus:border-red-500 bg-red-50'
                            : 'border-[#A8D8C1] focus:border-[#02BB31]'
                        }`}
                        placeholder="contact@company.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#013E43] mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                      <input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                          errors.phone
                            ? 'border-red-400 focus:border-red-500 bg-red-50'
                            : 'border-[#A8D8C1] focus:border-[#02BB31]'
                        }`}
                        placeholder="0712345678"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#013E43] mb-1">
                      Service Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#013E43] mb-1">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                      <input
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                          errors.location
                            ? 'border-red-400 focus:border-red-500 bg-red-50'
                            : 'border-[#A8D8C1] focus:border-[#02BB31]'
                        }`}
                        placeholder="Nairobi, Kenya"
                      />
                    </div>
                    {errors.location && (
                      <p className="text-xs text-red-500 mt-1">{errors.location}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[#013E43] mb-1">
                      Website (Optional)
                    </label>
                    <div className="relative">
                      <FiGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                      <input
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                        placeholder="https://yourcompany.com"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[#013E43] mb-1">
                      Company Description <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiFileText className="absolute left-3 top-3 text-[#0D915C]" />
                      <textarea
                        rows="5"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg outline-none transition-colors resize-none ${
                          errors.description
                            ? 'border-red-400 focus:border-red-500 bg-red-50'
                            : 'border-[#A8D8C1] focus:border-[#02BB31]'
                        }`}
                        placeholder="Tell us about your company, services offered, experience, and why you'd like to partner with MakaoLink..."
                      />
                    </div>
                    {errors.description && (
                      <p className="text-xs text-red-500 mt-1">{errors.description}</p>
                    )}
                  </div>
                </div>

                {/* Logo Upload */}
                <div className="rounded-xl border-2 border-dashed border-[#A8D8C1] p-6 text-center hover:border-[#02BB31] transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogo}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <FiUpload className="text-3xl text-[#065A57] mb-2" />
                    <span className="text-sm text-[#065A57]">
                      Click to upload company logo
                    </span>
                    <span className="text-xs text-[#065A57] mt-1">
                      PNG, JPG up to 2MB
                    </span>
                  </label>
                </div>

                {/* Logo Preview */}
                {logoPreview && (
                  <div className="relative inline-block">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-24 w-24 rounded-xl border-2 border-[#A8D8C1] object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <FaCircle size={14} />
                    </button>
                  </div>
                )}

                {/* Fee Info */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <FiDollarSign className="text-yellow-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#013E43]">Application Fee</h3>
                      <p className="text-sm text-[#065A57]">
                        A one-time joining fee of <strong>KES 5,000</strong> applies.
                        After submitting this form, you will be redirected to Paystack to complete payment.
                        Once payment is confirmed, your application will move to admin review.
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 p-3 rounded-lg text-sm text-red-600 flex items-center gap-2">
                    <FiAlertCircle />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Submitting..." : "Submit & Continue to Payment"}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar - Info Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
              <h3 className="text-lg font-bold text-[#013E43] mb-4 flex items-center">
                <FiInfo className="mr-2 text-[#02BB31]" />
                Why Join RendaHomes?
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="text-[#02BB31] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#065A57]">Reach thousands of potential customers</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="text-[#02BB31] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#065A57]">Get verified and trusted status</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="text-[#02BB31] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#065A57]">Showcase your services to active home seekers</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="text-[#02BB31] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#065A57]">Grow your business with quality leads</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
              <h3 className="text-lg font-bold text-[#013E43] mb-4 flex items-center">
                <FiShield className="mr-2 text-[#02BB31]" />
                Requirements
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="text-[#02BB31] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#065A57]">Valid business registration</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="text-[#02BB31] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#065A57]">Quality service track record</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="text-[#02BB31] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#065A57]">Professional liability insurance</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="text-[#02BB31] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#065A57]">Commitment to customer satisfaction</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
              <h3 className="text-lg font-bold text-[#013E43] mb-4 flex items-center">
                <FiClock className="mr-2 text-[#02BB31]" />
                Processing Time
              </h3>
              <p className="text-sm text-[#065A57] mb-3">
                Applications are typically reviewed within <strong>3-5 business days</strong> after payment confirmation.
              </p>
              <div className="flex items-center gap-2 text-xs text-[#065A57]">
                <FiShield className="text-[#02BB31]" />
                <span>Your information is secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerApplicationPage;