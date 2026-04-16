import api from "../api/api";

export const getPublishedBlogs = async () => {
  const response = await api.get("/blog");
  return response.data;
};

export const getPublishedBlogBySlug = async (slug) => {
  const response = await api.get(`/blog/${slug}`);
  return response.data;
};

export const subscribeToNewsletter = async (payload) => {
  const response = await api.post("/blog/subscribe", payload);
  return response.data;
};

export const getAdminBlogs = async () => {
  const response = await api.get("/blog/admin/all");
  return response.data;
};

export const getAdminBlogById = async (id) => {
  const response = await api.get(`/blog/admin/${id}`);
  return response.data;
};

export const createBlog = async (formData) => {
  const response = await api.post("/blog/admin", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

export const updateBlog = async (id, formData) => {
  const response = await api.patch(`/blog/admin/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

export const deleteBlog = async (id) => {
  const response = await api.delete(`/blog/admin/${id}`);
  return response.data;
};

export const getNewsletterSubscribers = async () => {
  const response = await api.get("/blog/admin/subscribers");
  return response.data;
};

export const updateBlogStatus = async (id, status) => {
  const formData = new FormData();
  formData.append("status", status);

  const response = await api.patch(`/blog/admin/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data;
};