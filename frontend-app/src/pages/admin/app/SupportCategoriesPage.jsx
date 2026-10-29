import { useEffect, useState } from "react";
import {
  createSupportCategory,
  deleteSupportCategory,
  getSupportCategories,
  updateSupportCategory
} from "../../../services/app/adminContent.service";
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiArchive, 
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiTag,
  FiFolder,
  FiAlertCircle
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function SupportCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", isActive: true });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const loadCategories = async () => {
    try {
      setFetching(true);
      const { data } = await getSupportCategories();
      setCategories(data.categories || []);
    } catch {
      toast.error("Failed to load categories", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const submit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Title is required", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    setLoading(true);

    try {
      if (editingId) {
        await updateSupportCategory(editingId, form);
        toast.success("Category updated successfully", {
          style: { background: "#0D915C", color: "#fff" }
        });
      } else {
        await createSupportCategory(form);
        toast.success("Category created successfully", {
          style: { background: "#0D915C", color: "#fff" }
        });
      }

      setForm({ title: "", description: "", isActive: true });
      setEditingId(null);
      loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save category", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  const edit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title,
      description: item.description || "",
      isActive: item.isActive
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ title: "", description: "", isActive: true });
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await deleteSupportCategory(deleteId);
      toast.success("Category deleted successfully", {
        style: { background: "#0D915C", color: "#fff" }
      });
      loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete category", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setShowDeleteConfirm(false);
      setDeleteId(null);
    }
  };

  const stats = {
    total: categories.length,
    active: categories.filter(c => c.isActive).length,
    inactive: categories.filter(c => !c.isActive).length
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#DDEAE3] border-t-[#0D915C] mx-auto mb-4"></div>
          <p className="text-[#41635A]">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="border-b border-[#DDEAE3] pb-5">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-[#013E43] rounded-md">
            <FiFolder className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#013E43]">Support Categories</h1>
            <p className="text-sm text-[#41635A]">
              Manage support ticket categories for better organization
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border-b border-[#DDEAE3] py-4">
          <p className="text-sm text-[#41635A]">Total Categories</p>
          <p className="text-2xl font-bold text-[#013E43]">{stats.total}</p>
        </div>
        <div className="border-b border-[#DDEAE3] py-4">
          <p className="text-sm text-[#41635A]">Active</p>
          <p className="text-2xl font-bold text-[#0D915C]">{stats.active}</p>
        </div>
        <div className="border-b border-[#DDEAE3] py-4">
          <p className="text-sm text-[#41635A]">Inactive</p>
          <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Create/Edit Form */}
        <div className="bg-white rounded-lg shadow-none border border-[#DDEAE3] overflow-hidden">
          <div className="border-b border-[#DDEAE3] bg-[#F8FAF8] px-5 py-4">
            <h2 className="flex items-center text-lg font-semibold text-[#013E43]">
              {editingId ? <FiEdit2 className="mr-2" /> : <FiPlus className="mr-2" />}
              {editingId ? "Edit Category" : "Create New Category"}
            </h2>
            <p className="mt-1 text-sm text-[#647C75]">
              {editingId ? "Update category details" : "Add a new support category"}
            </p>
          </div>

          <form onSubmit={submit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiTag className="h-5 w-5 text-[#0D915C]" />
                </div>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border-2 border-[#DDEAE3] rounded-lg focus:border-[#0D915C] outline-none transition-colors"
                  placeholder="e.g., Account Support, Technical Issues"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Description
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiFolder className="h-5 w-5 text-[#0D915C]" />
                </div>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border-2 border-[#DDEAE3] rounded-lg focus:border-[#0D915C] outline-none transition-colors resize-none"
                  rows="4"
                  placeholder="Brief description of this category..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F1F7F3] rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${
                    form.isActive ? 'bg-[#0D915C]' : 'bg-[#BBD2C6]'
                  }`}>
                    <div className={`w-4 h-4 bg-white rounded-full transform transition-transform absolute top-1 ${
                      form.isActive ? 'translate-x-5' : 'translate-x-1'
                    }`}></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-[#013E43]">Active</span>
              </label>
              <span className="text-xs text-[#41635A]">
                {form.isActive ? "Category is visible to users" : "Category is hidden"}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-[#0D915C] text-white rounded-lg font-semibold  transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent inline-block mr-2"></div>
                    Saving...
                  </>
                ) : editingId ? "Update Category" : "Create Category"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-3 border-2 border-[#DDEAE3] text-[#41635A] rounded-lg font-medium hover:bg-[#F1F7F3] transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Categories List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-none border border-[#DDEAE3] overflow-hidden">
            <div className="bg-[#F8FAF8] p-6 border-b border-[#DDEAE3]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#013E43] flex items-center">
                    <FiFolder className="mr-2 text-[#0D915C]" />
                    All Categories
                  </h2>
                  <p className="text-sm text-[#41635A] mt-1">
                    Manage your support categories
                  </p>
                </div>
                <button
                  onClick={loadCategories}
                  className="p-2 text-[#41635A] hover:bg-[#F1F7F3] rounded-lg transition-colors"
                  title="Refresh"
                >
                  <FiRefreshCw className="text-lg" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {categories.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-[#F1F7F3] rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiFolder className="text-3xl text-[#BBD2C6]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#013E43] mb-2">No categories yet</h3>
                  <p className="text-sm text-[#41635A]">
                    Create your first support category to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map((item) => (
                    <div
                      key={item._id}
                      className="group rounded-md border border-[#DDEAE3] p-5 transition-all hover:border-[#0D915C]/30"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${item.isActive ? 'bg-[#0D915C]' : 'bg-gray-400'}`}></div>
                            <h3 className="font-bold text-[#013E43] text-lg">{item.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              item.isActive 
                                ? "bg-[#0D915C]/10 text-[#0D915C]"
                                : "bg-gray-100 text-gray-600"
                            }`}>
                              {item.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-[#41635A] mt-1">{item.description}</p>
                          )}
                          <div className="mt-3 flex items-center gap-3 text-xs text-[#41635A]">
                            <span className="flex items-center gap-1">
                              <FiTag className="text-[#0D915C]" />
                              Category ID: {item._id.slice(-8)}
                            </span>
                            {item.createdAt && (
                              <span className="flex items-center gap-1">
                                <FiCheckCircle className="text-[#0D915C]" />
                                Created: {new Date(item.createdAt).toLocaleDateString()}
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
                  ))}
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
              <h3 className="text-xl font-bold text-[#013E43] mb-2">Delete Category</h3>
              <p className="text-sm text-[#41635A]">
                Are you sure you want to delete this category? This action cannot be undone.
                Support tickets using this category may be affected.
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
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
