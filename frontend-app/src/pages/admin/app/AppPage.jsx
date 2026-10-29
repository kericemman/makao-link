import { useEffect, useState } from "react";
import {
  createUpdate,
  deleteUpdate,
  getUpdates,
  updateUpdate
} from "../../../services/app/adminContent.service";
import RichText from "../blog/RichText";
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCalendar,
  FiMessageSquare,
  FiSend,
  FiEye,
  FiEyeOff,
  FiAlertCircle
} from "react-icons/fi";
import { FaMoneyBillWave, FaNewspaper, FaPhone, FaTools, FaWaveSquare } from "react-icons/fa";
import toast from "react-hot-toast";

const emptyForm = {
  title: "",
  body: "",
  category: "Product Update",
  emailAudience: "mobile_app",
  isPublished: true
};

const categoryIcons = {
  "Product Update": <FaMoneyBillWave className="text-[#0D915C]" />,
  "News": <FaNewspaper className="text-blue-500" />,
  "Announcement": <FaPhone className="text-purple-500" />,
  "Maintenance": <FaTools className="text-orange-500" />
};

const categoryColors = {
  "Product Update": "bg-[#0D915C]/10 text-[#0D915C] border-[#0D915C]/20",
  "News": "bg-blue-100 text-blue-600 border-blue-200",
  "Announcement": "bg-purple-100 text-purple-600 border-purple-200",
  "Maintenance": "bg-orange-100 text-orange-600 border-orange-200"
};

const stripHtml = (html = "") =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export default function AppUpdatesPage() {
  const [updates, setUpdates] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [charCount, setCharCount] = useState(0);

  const loadUpdates = async () => {
    try {
      setFetching(true);
      const { data } = await getUpdates();
      setUpdates(data.updates || []);
    } catch {
      toast.error("Failed to load updates", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadUpdates();
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "body") {
      setCharCount(stripHtml(value).length);
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !stripHtml(form.body)) {
      toast.error("Title and body are required", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        await updateUpdate(editingId, form);
        toast.success("Update edited successfully", {
          style: { background: "#0D915C", color: "#fff" }
        });
      } else {
        await createUpdate(form);
        toast.success("Update published successfully", {
          style: { background: "#0D915C", color: "#fff" }
        });
      }

      setForm(emptyForm);
      setEditingId(null);
      setCharCount(0);
      loadUpdates();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save update", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  const edit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title || "",
      body: item.body || "",
      category: item.category || "Product Update",
      emailAudience: item.emailAudience || "mobile_app",
      isPublished: item.isPublished
    });
    setCharCount(stripHtml(item.body).length);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setCharCount(0);
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await deleteUpdate(deleteId);
      toast.success("Update deleted successfully", {
        style: { background: "#0D915C", color: "#fff" }
      });
      loadUpdates();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete update", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setShowDeleteConfirm(false);
      setDeleteId(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const stats = {
    total: updates.length,
    published: updates.filter(u => u.isPublished).length,
    draft: updates.filter(u => !u.isPublished).length
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#DDEAE3] border-t-[#0D915C] mx-auto mb-4"></div>
          <p className="text-[#41635A]">Loading app updates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="border-b border-[#DDEAE3] pb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-[#013E43] rounded-md">
              <FaMoneyBillWave className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">App Updates</h1>
              <p className="text-sm text-[#41635A]">
                Manage updates, news, and announcements for the mobile app
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={loadUpdates}
              className="p-2 text-[#41635A] hover:bg-[#F1F7F3] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`text-lg ${fetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border-b border-[#DDEAE3] py-4">
          <p className="text-sm text-[#41635A]">Total Updates</p>
          <p className="text-2xl font-bold text-[#013E43]">{stats.total}</p>
        </div>
        <div className="border-b border-[#DDEAE3] py-4">
          <p className="text-sm text-[#41635A]">Published</p>
          <p className="text-2xl font-bold text-[#0D915C]">{stats.published}</p>
        </div>
        <div className="border-b border-[#DDEAE3] py-4">
          <p className="text-sm text-[#41635A]">Drafts</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Create/Edit Form */}
        <div className="bg-white rounded-lg shadow-none border border-[#DDEAE3] overflow-hidden lg:col-span-2">
          <div className="border-b border-[#DDEAE3] bg-[#F8FAF8] px-5 py-4">
            <h2 className="flex items-center text-lg font-semibold text-[#013E43]">
              {editingId ? <FiEdit2 className="mr-2" /> : <FiPlus className="mr-2" />}
              {editingId ? "Edit Update" : "Create App Update"}
            </h2>
            <p className="mt-1 text-sm text-[#647C75]">
              Updates appear in the mobile app updates/news section
            </p>
          </div>

          <form onSubmit={submit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMessageSquare className="h-5 w-5 text-[#0D915C]" />
                </div>
                <input
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-[#DDEAE3] rounded-lg focus:border-[#0D915C] outline-none transition-colors"
                  placeholder="e.g., Map discovery is coming"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#DDEAE3] rounded-lg focus:border-[#0D915C] outline-none transition-colors"
              >
                <option>Product Update</option>
                <option>News</option>
                <option>Announcement</option>
                <option>Maintenance</option>
              </select>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-[#013E43]">Email update to</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  ["mobile_app", "Mobile app subscribers"],
                  ["website", "Website subscribers"],
                  ["all", "Both audiences"],
                ].map(([value, label]) => (
                  <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-3 text-sm transition ${form.emailAudience === value ? "border-[#0D915C] bg-[#F1F7F3] text-[#013E43]" : "border-[#DDEAE3] text-[#526760] hover:bg-[#F8FAF8]"}`}>
                    <input
                      type="radio"
                      name="emailAudience"
                      value={value}
                      checked={form.emailAudience === value}
                      onChange={() => updateField("emailAudience", value)}
                      className="accent-[#0D915C]"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-[#647C75]">Publishing sends one email per unique address in the selected audience.</p>
              {editingId && form.isPublished && (
                <p className="mt-1 text-xs font-medium text-amber-800">This update is already published. Changing the audience will not resend its email.</p>
              )}
            </fieldset>

            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Body <span className="text-red-500">*</span>
              </label>
              <RichText
                value={form.body}
                onChange={(html) => updateField("body", html)}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-[#41635A]">
                  {charCount} text characters
                </p>
                {charCount > 500 && (
                  <p className="text-xs text-orange-500">Consider making it more concise</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F1F7F3] rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => updateField("isPublished", e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${
                    form.isPublished ? 'bg-[#0D915C]' : 'bg-[#BBD2C6]'
                  }`}>
                    <div className={`w-4 h-4 bg-white rounded-full transform transition-transform absolute top-1 ${
                      form.isPublished ? 'translate-x-5' : 'translate-x-1'
                    }`}></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-[#013E43]">Published</span>
              </label>
              <span className="text-xs text-[#41635A] flex items-center gap-1">
                {form.isPublished ? <FiEye className="text-[#0D915C]" /> : <FiEyeOff className="text-gray-400" />}
                {form.isPublished ? "Visible to users" : "Hidden from users"}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0D915C] text-white rounded-lg font-semibold  transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent inline-block mr-2"></div>
                  Saving...
                </>
              ) : editingId ? "Update Update" : "Publish Update"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="w-full py-3 border-2 border-[#DDEAE3] text-[#41635A] rounded-lg font-medium hover:bg-[#F1F7F3] transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* Updates List */}
        <div>
          <div className="bg-white rounded-lg shadow-none border border-[#DDEAE3] overflow-hidden">
            <div className="bg-[#F8FAF8] p-6 border-b border-[#DDEAE3]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#013E43] flex items-center">
                    <FiSend className="mr-2 text-[#0D915C]" />
                    Published Updates
                  </h2>
                  <p className="text-sm text-[#41635A] mt-1">
                    Manage your app updates and announcements
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {updates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-[#F1F7F3] rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaMoneyBillWave className="text-3xl text-[#BBD2C6]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#013E43] mb-2">No updates yet</h3>
                  <p className="text-sm text-[#41635A]">
                    Create your first app update to keep users informed.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {updates.map((item) => {
                    const Icon = categoryIcons[item.category] || FaWaveSquare;
                    const colorClass = categoryColors[item.category] || "bg-gray-100 text-gray-600 border-gray-200";
                    
                    return (
                      <div
                        key={item._id}
                        className="group rounded-md border border-[#DDEAE3] p-5 transition-all hover:border-[#0D915C]/30"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                                {Icon}
                                <span>{item.category}</span>
                              </span>
                              {!item.isPublished && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-600">
                                  <FiEyeOff className="text-xs" />
                                  Draft
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#F1F5F3] px-2.5 py-1 text-xs font-medium text-[#526760]">
                                Email: {item.emailAudience === "all" ? "Website + app" : item.emailAudience === "website" ? "Website" : "Mobile app"}
                              </span>
                              {item.emailNotifiedAt && (
                                <span className="text-xs text-[#647C75]">Sent {formatDate(item.emailNotifiedAt)}</span>
                              )}
                            </div>
                            <h3 className="font-bold text-[#013E43] text-lg mb-2">{item.title}</h3>
                            <p className="text-sm text-[#41635A] leading-relaxed line-clamp-3">
                              {stripHtml(item.body)}
                            </p>
                            <div className="flex items-center gap-3 mt-3 text-xs text-[#41635A]">
                              <span className="flex items-center gap-1">
                                <FiCalendar className="text-[#0D915C]" />
                                {formatDate(item.createdAt)}
                              </span>
                              {item.updatedAt !== item.createdAt && (
                                <span className="flex items-center gap-1">
                                  <FiClock className="text-[#0D915C]" />
                                  Updated: {formatDate(item.updatedAt)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => edit(item)}
                              className="p-2 text-[#0D915C] hover:bg-[#08764C]/10 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FiEdit2 className="text-lg" />
                            </button>
                            <button
                              onClick={() => confirmDelete(item._id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 className="text-lg" />
                            </button>
                          </div>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-none max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <FiTrash2 className="text-3xl text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-[#013E43] mb-2">Delete Update</h3>
              <p className="text-sm text-[#41635A]">
                Are you sure you want to delete this update? This action cannot be undone.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteId(null);
                }}
                className="flex-1 px-4 py-2 border border-[#DDEAE3] text-[#41635A] rounded-lg hover:bg-[#F1F7F3] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
