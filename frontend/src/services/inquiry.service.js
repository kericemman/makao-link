import api from "../api/api";

export const sendInquiry = async (payload) => {
  const response = await api.post("/inquiries", payload);
  return response.data;
};

export const getMyInquiries = async () => {
  const response = await api.get("/inquiries/landlord/my");
  return response.data;
};

export const updateInquiryStatus = async (id, status) => {
  const response = await api.put(`/inquiries/landlord/${id}/status`, { status });
  return response.data;
};