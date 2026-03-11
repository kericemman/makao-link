import API from "../api/api"

export const getAdminBlogs = () => API.get("/blogs/admin")

export const createBlog = (data) => API.post("/blogs", data)

export const updateBlog = (id, data) => API.put(`/blogs/${id}`, data)

export const updateBlogStatus = (id, data) => API.put(`/blogs/${id}`, data)

export const deleteBlog = (id) => API.delete(`/blogs/${id}`)

export const getBlogs = () => API.get("/blogs")

export const getBlog = (slug) => API.get(`/blogs/${slug}`)