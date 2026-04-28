import { useEffect, useState } from "react";
import {
  createUpdate,
  deleteUpdate,
  getUpdates,
  updateUpdate
} from "../../../services/app/adminContent.service";
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
  isPublished: true
};

const categoryIcons = {
  "Product Update": <FaMoneyBillWave className="text-[#02BB31]" />,
  "News": <FaNewspaper className="text-blue-500" />,
  "Announcement": <FaPhone className="text-purple-500" />,
  "Maintenance": <FaTools className="text-orange-500" />
};

const categoryColors = {
  "Product Update": "bg-[#02BB31]/10 text-[#02BB31] border-[#02BB31]/20",
  "News": "bg-blue-100 text-blue-600 border-blue-200",
  "Announcement": "bg-purple-100 text-purple-600 border-purple-200",
  "Maintenance": "bg-orange-100 text-orange-600 border-orange-200"
};

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
    } catch (err) {
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
      setCharCount(value.length);
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.body.trim()) {
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
          style: { background: "#02BB31", color: "#fff" }
        });
      } else {
        await createUpdate(form);
        toast.success("Update published successfully", {
          style: { background: "#02BB31", color: "#fff" }
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

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await deleteUpdate(deleteId);
      toast.success("Update deleted successfully", {
        style: { background: "#02BB31", color: "#fff" }
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
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading app updates...</p>
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
              <FaMoneyBillWave className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">App Updates</h1>
              <p className="text-sm text-[#065A57]">
                Manage updates, news, and announcements for the mobile app
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={loadUpdates}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`text-lg ${fetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#013E43]">
          <p className="text-sm text-[#065A57]">Total Updates</p>
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
              {editingId ? <FiEdit2 className="mr-2" /> : <FiPlus className="mr-2" />}
              {editingId ? "Edit Update" : "Create App Update"}
            </h2>
            <p className="text-sm text-[#A8D8C1] mt-1">
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
                  className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
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
                className="w-full px-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
              >
                <option>Product Update</option>
                <option>News</option>
                <option>Announcement</option>
                <option>Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Body <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiEdit2 className="h-5 w-5 text-[#0D915C]" />
                </div>
                <textarea
                  value={form.body}
                  onChange={(e) => updateField("body", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors resize-none"
                  rows="5"
                  placeholder="Write the update body..."
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-[#065A57]">
                  {charCount} characters
                </p>
                {charCount > 500 && (
                  <p className="text-xs text-orange-500">Consider making it more concise</p>
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
              ) : editingId ? "Update Update" : "Publish Update"}
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

        {/* Updates List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden">
            <div className="bg-gradient-to-r from-[#F0F7F4] to-white p-6 border-b border-[#A8D8C1]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#013E43] flex items-center">
                    <FiSend className="mr-2 text-[#02BB31]" />
                    Published Updates
                  </h2>
                  <p className="text-sm text-[#065A57] mt-1">
                    Manage your app updates and announcements
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {updates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaMoneyBillWave className="text-3xl text-[#A8D8C1]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#013E43] mb-2">No updates yet</h3>
                  <p className="text-sm text-[#065A57]">
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
                        className="group rounded-xl border border-[#A8D8C1] p-5 hover:shadow-md transition-all hover:border-[#02BB31]/30"
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
                            </div>
                            <h3 className="font-bold text-[#013E43] text-lg mb-2">{item.title}</h3>
                            <p className="text-sm text-[#065A57] leading-relaxed whitespace-pre-wrap line-clamp-3">
                              {item.body}
                            </p>
                            <div className="flex items-center gap-3 mt-3 text-xs text-[#065A57]">
                              <span className="flex items-center gap-1">
                                <FiCalendar className="text-[#02BB31]" />
                                {formatDate(item.createdAt)}
                              </span>
                              {item.updatedAt !== item.createdAt && (
                                <span className="flex items-center gap-1">
                                  <FiClock className="text-[#02BB31]" />
                                  Updated: {formatDate(item.updatedAt)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => edit(item)}
                              className="p-2 text-[#02BB31] hover:bg-[#02BB31]/10 rounded-lg transition-colors"
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <FiTrash2 className="text-3xl text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-[#013E43] mb-2">Delete Update</h3>
              <p className="text-sm text-[#065A57]">
                Are you sure you want to delete this update? This action cannot be undone.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteId(null);
                }}
                className="flex-1 px-4 py-2 border border-[#A8D8C1] text-[#065A57] rounded-lg hover:bg-[#F0F7F4] transition-colors"
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