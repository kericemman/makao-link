import { useEffect, useState } from "react";
import {
  getPolicies,
  upsertPolicy
} from "../../../services/app/adminContent.service";
import { 
  FiFileText, 
  FiEdit2, 
  FiSave, 
  FiRefreshCw,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiShield,
  FiLock,
  FiAlertCircle,
  FiBookOpen
} from "react-icons/fi";
import { FaGavel, FaHandshake, FaUserShield } from "react-icons/fa";
import toast from "react-hot-toast";

const emptyForm = {
  slug: "privacy",
  title: "",
  body: "",
  isPublished: true
};

const policyTypes = [
  { slug: "privacy", label: "Privacy Policy", icon: FiLock, color: "from-blue-400 to-blue-500", bgColor: "bg-blue-100", textColor: "text-blue-600" },
  { slug: "terms", label: "Terms & Conditions", icon: FaGavel, color: "from-purple-400 to-purple-500", bgColor: "bg-purple-100", textColor: "text-purple-600" },
  { slug: "safety", label: "Safety Guidelines", icon: FiShield, color: "from-[#02BB31] to-[#0D915C]", bgColor: "bg-[#02BB31]/10", textColor: "text-[#02BB31]" },
  { slug: "community", label: "Community Rules", icon: FaHandshake, color: "from-orange-400 to-orange-500", bgColor: "bg-orange-100", textColor: "text-orange-600" }
];

const policyIcons = {
  privacy: FiLock,
  terms: FaGavel,
  safety: FiShield,
  community: FaHandshake
};

export default function PolicyPagesPage() {
  const [policies, setPolicies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [charCount, setCharCount] = useState(0);

  const loadPolicies = async () => {
    try {
      setFetching(true);
      const { data } = await getPolicies();
      setPolicies(data.policies || []);
    } catch (err) {
      toast.error("Failed to load policies", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "body") {
      setCharCount(value.length);
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.slug || !form.title.trim() || !form.body.trim()) {
      toast.error("Slug, title and body are required", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        await updatePolicy(editingId, form);
        toast.success("Policy updated successfully", {
          style: { background: "#02BB31", color: "#fff" }
        });
      } else {
        await upsertPolicy(form);
        toast.success("Policy saved successfully", {
          style: { background: "#02BB31", color: "#fff" }
        });
      }

      setForm(emptyForm);
      setEditingId(null);
      setCharCount(0);
      loadPolicies();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save policy", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  const edit = (item) => {
    setEditingId(item._id);
    setForm({
      slug: item.slug || "privacy",
      title: item.title || "",
      body: item.body || "",
      isPublished: item.isPublished
    });
    setCharCount(item.body?.length || 0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setCharCount(0);
  };

  const getPolicyIcon = (slug) => {
    return policyIcons[slug] || FiFileText;
  };

  const getPolicyInfo = (slug) => {
    return policyTypes.find(p => p.slug === slug) || policyTypes[0];
  };

  const stats = {
    total: policies.length,
    published: policies.filter(p => p.isPublished).length,
    draft: policies.filter(p => !p.isPublished).length
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading policies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl">
              <FiShield className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">Policy Pages</h1>
              <p className="text-sm text-[#065A57]">
                Manage legal policies and guidelines for the platform
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={loadPolicies}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className="text-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#013E43]">
          <p className="text-sm text-[#065A57]">Total Policies</p>
          <p className="text-2xl font-bold text-[#013E43]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#02BB31]">
          <p className="text-sm text-[#065A57]">Published</p>
          <p className="text-2xl font-bold text-[#02BB31]">{stats.published}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-yellow-400">
          <p className="text-sm text-[#065A57]">Drafts</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Create/Edit Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden sticky top-24">
          <div className="bg-gradient-to-r from-[#013E43] to-[#005C57] p-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              {editingId ? <FiEdit2 className="mr-2" /> : <FiFileText className="mr-2" />}
              {editingId ? "Edit Policy" : "Create / Update Policy"}
            </h2>
            <p className="text-sm text-[#A8D8C1] mt-1">
              These policies are displayed in the mobile app Profile section
            </p>
          </div>

          <form onSubmit={submit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Policy Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                disabled={!!editingId}
                className="w-full px-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors disabled:bg-[#F0F7F4] disabled:cursor-not-allowed"
              >
                {policyTypes.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.label}
                  </option>
                ))}
              </select>
              {editingId && (
                <p className="text-xs text-[#065A57] mt-1">
                  Policy type cannot be changed after creation
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiBookOpen className="h-5 w-5 text-[#0D915C]" />
                </div>
                <input
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                  placeholder="e.g., Privacy Policy"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Policy Body <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiFileText className="h-5 w-5 text-[#0D915C]" />
                </div>
                <textarea
                  value={form.body}
                  onChange={(e) => updateField("body", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors resize-none"
                  rows="10"
                  placeholder="Write the full policy content here..."
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-[#065A57]">
                  {charCount} characters
                </p>
                {charCount > 5000 && (
                  <p className="text-xs text-orange-500">Long content may affect readability</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F0F7F4] rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => updateField("isPublished", e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${
                    form.isPublished ? 'bg-[#02BB31]' : 'bg-[#A8D8C1]'
                  }`}>
                    <div className={`w-4 h-4 bg-white rounded-full transform transition-transform absolute top-1 ${
                      form.isPublished ? 'translate-x-5' : 'translate-x-1'
                    }`}></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-[#013E43]">Published</span>
              </label>
              <span className="text-xs text-[#065A57] flex items-center gap-1">
                {form.isPublished ? <FiEye className="text-[#02BB31]" /> : <FiEyeOff className="text-gray-400" />}
                {form.isPublished ? "Visible to users" : "Hidden from users"}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent inline-block mr-2"></div>
                  Saving...
                </>
              ) : editingId ? "Update Policy" : "Save Policy"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="w-full py-3 border-2 border-[#A8D8C1] text-[#065A57] rounded-lg font-medium hover:bg-[#F0F7F4] transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* Policies List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden">
            <div className="bg-gradient-to-r from-[#F0F7F4] to-white p-6 border-b border-[#A8D8C1]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#013E43] flex items-center">
                    <FiShield className="mr-2 text-[#02BB31]" />
                    Policy Pages
                  </h2>
                  <p className="text-sm text-[#065A57] mt-1">
                    Manage legal documents and guidelines
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {policies.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiShield className="text-3xl text-[#A8D8C1]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#013E43] mb-2">No policies created yet</h3>
                  <p className="text-sm text-[#065A57]">
                    Create your first policy document to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {policies.map((item) => {
                    const Icon = getPolicyIcon(item.slug);
                    const policyInfo = getPolicyInfo(item.slug);
                    
                    return (
                      <div
                        key={item._id}
                        className="group rounded-xl border border-[#A8D8C1] p-5 hover:shadow-md transition-all hover:border-[#02BB31]/30"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`p-2 ${policyInfo.bgColor} rounded-lg`}>
                                <Icon className={`text-lg ${policyInfo.textColor}`} />
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                item.isPublished 
                                  ? "bg-[#02BB31]/10 text-[#02BB31]" 
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                {item.isPublished ? "Published" : "Draft"}
                              </span>
                            </div>
                            <h3 className="font-bold text-[#013E43] text-lg mb-2">{item.title}</h3>
                            <p className="text-sm text-[#065A57] leading-relaxed line-clamp-3">
                              {item.body}
                            </p>
                            <div className="flex items-center gap-3 mt-3 text-xs text-[#065A57]">
                              <span className="flex items-center gap-1">
                                <FiFileText className="text-[#02BB31]" />
                                Slug: {item.slug}
                              </span>
                              {item.updatedAt && (
                                <span className="flex items-center gap-1">
                                  <FiRefreshCw className="text-[#02BB31]" />
                                  Updated: {new Date(item.updatedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => edit(item)}
                            className="p-2 text-[#02BB31] hover:bg-[#02BB31]/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 className="text-lg" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}