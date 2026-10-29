import api from "../api/api";

export const createStayRequest = async (listingId, payload) => {
  const response = await api.post(`/stays/${listingId}/requests`, payload);
  return response.data;
};
