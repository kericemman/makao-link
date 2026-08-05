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
