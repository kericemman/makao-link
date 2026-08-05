import api from "../api/api";

export const getMyInquiries = async () => {
  const response = await api.get("/alerts/me");
  return response.data;
};

export const replyToInquiry = async (inquiryId, message) => {
  const response = await api.post(`/alerts/${inquiryId}/reply`, { message });
  return response.data;
};

export const markInquiryRead = async (inquiryId) => {
  const response = await api.patch(`/alerts/${inquiryId}/read`);
  return response.data;
};
