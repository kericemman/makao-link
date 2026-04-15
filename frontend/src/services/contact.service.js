import api from "../api/api";

export const sendMessage = async (payload) => {
  const response = await api.post("/contact", payload);
  return response.data;
};

export const getAdminContactMessages = async (params = {}) => {
  const response = await api.get("/contact/admin", { params });
  return response.data;
};

export const getAdminContactMessageById = async (id) => {
  const response = await api.get(`/contact/admin/${id}`);
  return response.data;
};

export const updateAdminContactMessage = async (id, payload) => {
  const response = await api.patch(`/contact/admin/${id}`, payload);
  return response.data;
};