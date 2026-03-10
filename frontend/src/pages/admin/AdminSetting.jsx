import { useEffect, useState } from "react"
import {
  getSettings,
  updateSettings
} from "../../services/setting.service"
import { 
  FiSettings, 
  FiGlobe, 
  FiMail, 
  FiPhone, 
  FiDollarSign,
  FiCheckCircle,
  FiSave,
  FiRefreshCw,
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiLinkedin,
  FiShield,
  FiBriefcase,
  FiHome,
  FiAlertCircle
} from "react-icons/fi"
import { FaWhatsapp } from "react-icons/fa"
import toast from "react-hot-toast"

function AdminSettings() {
  const [form, setForm] = useState({
    platformName: "",
    supportEmail: "",
    supportPhone: "",
    whatsappNumber: "",
    currency: "KES",
    partnerApplicationFee: 5000,
    propertyApprovalRequired: true,
    socialLinks: {
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: ""
    }
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await getSettings()
      setForm(res.data)
    } catch (error) {
      toast.error("Failed to load settings", {
        style: { background: "#013E43", color: "#fff" }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    })
  }

  const handleSocialChange = (platform, value) => {
    setForm({
      ...form,
      socialLinks: {
        ...form.socialLinks,
        [platform]: value
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)
      await updateSettings(form)
      toast.success("Settings updated successfully", {
        style: { background: "#02BB31", color: "#fff" }
      })
    } catch (error) {
      toast.error("Failed to update settings", {
        style: { background: "#013E43", color: "#fff" }
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading settings...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: "general", label: "General", icon: FiSettings },
    { id: "contact", label: "Contact", icon: FiPhone },
    { id: "social", label: "Social Media", icon: FiGlobe },
    { id: "fees", label: "Fees & Approvals", icon: FiBriefcase }
  ]

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl">
              <FiSettings className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">Platform Settings</h1>
              <p className="text-sm text-[#065A57]">Configure your platform preferences</p>
            </div>
          </div>
          
          <button
            onClick={fetchSettings}
            className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
            title="Refresh"
          >
            <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-[#A8D8C1] bg-[#F0F7F4]">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'border-[#02BB31] text-[#013E43] bg-white'
                      : 'border-transparent text-[#065A57] hover:text-[#013E43] hover:bg-white/50'
                  }`}
                >
                  <Icon className="text-lg" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {/* General Settings Tab */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#013E43]">
                    Platform Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiGlobe className="h-5 w-5 text-[#0D915C]" />
                    </div>
                    <input
                      name="platformName"
                      value={form.platformName || ""}
                      onChange={handleChange}
                      placeholder="MakaoLink"
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                    />
                  </div>
                  <p className="text-xs text-[#065A57]">The name of your platform</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#013E43]">
                    Currency
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiDollarSign className="h-5 w-5 text-[#0D915C]" />
                    </div>
                    <input
                      name="currency"
                      value={form.currency || ""}
                      onChange={handleChange}
                      placeholder="KES"
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                    />
                  </div>
                  <p className="text-xs text-[#065A57]">Default currency for listings</p>
                </div>
              </div>

              {/* Platform Status */}
              <div className="bg-[#F0F7F4] p-4 rounded-xl border border-[#A8D8C1]">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-[#02BB31] rounded-full"></div>
                  <span className="text-sm font-medium text-[#013E43]">Platform Status: Active</span>
                </div>
              </div>
            </div>
          )}

          {/* Contact Settings Tab */}
          {activeTab === "contact" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#013E43]">
                    Support Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-[#0D915C]" />
                    </div>
                    <input
                      name="supportEmail"
                      type="email"
                      value={form.supportEmail || ""}
                      onChange={handleChange}
                      placeholder="support@makaolink.com"
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#013E43]">
                    Support Phone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiPhone className="h-5 w-5 text-[#0D915C]" />
                    </div>
                    <input
                      name="supportPhone"
                      value={form.supportPhone || ""}
                      onChange={handleChange}
                      placeholder="+254 712 345 678"
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-[#013E43]">
                    WhatsApp Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaWhatsapp className="h-5 w-5 text-[#25D366]" />
                    </div>
                    <input
                      name="whatsappNumber"
                      value={form.whatsappNumber || ""}
                      onChange={handleChange}
                      placeholder="0712345678"
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                    />
                  </div>
                  <p className="text-xs text-[#065A57]">Include country code without +</p>
                </div>
              </div>
            </div>
          )}

          {/* Social Media Tab */}
          {activeTab === "social" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#013E43]">
                    Facebook
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiFacebook className="h-5 w-5 text-[#1877F2]" />
                    </div>
                    <input
                      value={form.socialLinks?.facebook || ""}
                      onChange={(e) => handleSocialChange("facebook", e.target.value)}
                      placeholder="https://facebook.com/makaolink"
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#013E43]">
                    Twitter
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiTwitter className="h-5 w-5 text-[#1DA1F2]" />
                    </div>
                    <input
                      value={form.socialLinks?.twitter || ""}
                      onChange={(e) => handleSocialChange("twitter", e.target.value)}
                      placeholder="https://twitter.com/makaolink"
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#013E43]">
                    Instagram
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiInstagram className="h-5 w-5 text-[#E4405F]" />
                    </div>
                    <input
                      value={form.socialLinks?.instagram || ""}
                      onChange={(e) => handleSocialChange("instagram", e.target.value)}
                      placeholder="https://instagram.com/makaolink"
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#013E43]">
                    LinkedIn
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLinkedin className="h-5 w-5 text-[#0A66C2]" />
                    </div>
                    <input
                      value={form.socialLinks?.linkedin || ""}
                      onChange={(e) => handleSocialChange("linkedin", e.target.value)}
                      placeholder="https://linkedin.com/company/makaolink"
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#F0F7F4] p-4 rounded-xl border border-[#A8D8C1]">
                <div className="flex items-start space-x-3">
                  <FiAlertCircle className="text-[#02BB31] mt-0.5" />
                  <p className="text-sm text-[#065A57]">
                    Social media links will appear in the footer and contact sections
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Fees & Approvals Tab */}
          {activeTab === "fees" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#013E43]">
                    Partner Application Fee (KES)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiDollarSign className="h-5 w-5 text-[#0D915C]" />
                    </div>
                    <input
                      name="partnerApplicationFee"
                      type="number"
                      value={form.partnerApplicationFee || ""}
                      onChange={handleChange}
                      min="0"
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                    />
                  </div>
                  <p className="text-xs text-[#065A57]">Fee for partner applications</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={form.propertyApprovalRequired}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          propertyApprovalRequired: e.target.checked
                        })
                      }
                      className="sr-only"
                    />
                    <div className={`w-10 h-6 rounded-full transition-colors ${
                      form.propertyApprovalRequired ? 'bg-[#02BB31]' : 'bg-[#A8D8C1]'
                    }`}>
                      <div className={`w-4 h-4 bg-white rounded-full transform transition-transform absolute top-1 ${
                        form.propertyApprovalRequired ? 'translate-x-5' : 'translate-x-1'
                      }`}></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-[#013E43]">
                    Require admin approval for property listings
                  </span>
                </label>
                <p className="text-xs text-[#065A57] ml-12">
                  When enabled, all new property listings must be approved by an admin before appearing on the platform
                </p>
              </div>

              <div className="bg-[#F0F7F4] p-4 rounded-xl border border-[#A8D8C1]">
                <div className="flex items-center space-x-2">
                  <FiShield className="text-[#02BB31]" />
                  <span className="text-sm font-medium text-[#013E43]">Current Settings</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div className="text-[#065A57]">Partner Fee:</div>
                  <div className="font-medium text-[#013E43]">KES {form.partnerApplicationFee?.toLocaleString()}</div>
                  <div className="text-[#065A57]">Property Approval:</div>
                  <div className="font-medium text-[#013E43]">{form.propertyApprovalRequired ? 'Required' : 'Not Required'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="border-t border-[#A8D8C1] p-6 bg-[#F0F7F4]">
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiSave className="text-lg" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Settings Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-[#A8D8C1]">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-[#013E43]/10 rounded-lg">
              <FiGlobe className="text-[#013E43]" />
            </div>
            <h3 className="font-semibold text-[#013E43]">Platform</h3>
          </div>
          <p className="text-sm text-[#065A57] mb-1">Name</p>
          <p className="font-medium text-[#013E43]">{form.platformName || 'Not set'}</p>
          <p className="text-sm text-[#065A57] mt-2 mb-1">Currency</p>
          <p className="font-medium text-[#013E43]">{form.currency || 'KES'}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-[#A8D8C1]">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-[#02BB31]/10 rounded-lg">
              <FiPhone className="text-[#02BB31]" />
            </div>
            <h3 className="font-semibold text-[#013E43]">Contact</h3>
          </div>
          <p className="text-sm text-[#065A57] mb-1">Email</p>
          <p className="font-medium text-[#013E43] truncate">{form.supportEmail || 'Not set'}</p>
          <p className="text-sm text-[#065A57] mt-2 mb-1">Phone</p>
          <p className="font-medium text-[#013E43]">{form.supportPhone || 'Not set'}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-[#A8D8C1]">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiBriefcase className="text-purple-600" />
            </div>
            <h3 className="font-semibold text-[#013E43]">Fees</h3>
          </div>
          <p className="text-sm text-[#065A57] mb-1">Partner Application</p>
          <p className="font-medium text-[#013E43]">KES {form.partnerApplicationFee?.toLocaleString()}</p>
          <p className="text-sm text-[#065A57] mt-2 mb-1">Approval Required</p>
          <p className="font-medium text-[#013E43]">{form.propertyApprovalRequired ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings