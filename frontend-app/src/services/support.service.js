import api from "../api/api";

// landlord
export const createSupportTicket = async (payload) => {
  const response = await api.post("/support", payload);
  return response.data;
};

export const getMySupportTickets = async () => {
  const response = await api.get("/support/my");
  return response.data;
};

export const getMySupportTicketById = async (id) => {
  const response = await api.get(`/support/my/${id}`);
  return response.data;
};

export const replyToMySupportTicket = async (id, payload) => {
  const response = await api.post(`/support/my/${id}/reply`, payload);
  return response.data;
};

// admin
export const getAdminSupportTickets = async (params = {}) => {
  const response = await api.get("/support/admin", { params });
  return response.data;
};

export const getAdminSupportTicketById = async (id) => {
  const response = await api.get(`/support/admin/${id}`);
  return response.data;
};

export const replyToSupportTicketAsAdmin = async (id, payload) => {
  const response = await api.post(`/support/admin/${id}/reply`, payload);
  return response.data;
};

export const updateSupportTicketStatus = async (id, payload) => {
  const response = await api.patch(`/support/admin/${id}/status`, payload);
  return response.data;
};