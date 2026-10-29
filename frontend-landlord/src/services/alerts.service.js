import api from "../api/api";

export const getLandlordAlerts = async () => {
  const response = await api.get("/alerts/landlord");
  return response.data;
};

export const replyToLandlordAlert = async (id, message) => {
  const response = await api.post(`/alerts/${id}/reply`, { message });
  return response.data;
};

export const markLandlordAlertRead = async (id) => {
  const response = await api.patch(`/alerts/${id}/read`);
  return response.data;
};
