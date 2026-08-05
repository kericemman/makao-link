import api from "../api/api";

export const createSupportTicket = async (payload) => {
  const response = await api.post("/public/support-tickets", {
    ...payload,
    source: "mobile_app"
  });
  return response.data;
};
