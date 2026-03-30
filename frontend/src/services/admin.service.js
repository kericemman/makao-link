import api from "../api/api";

export const getAdminSummary = async () => {
  const response = await api.get("/admin/summary");
  return response.data;
};

export const getPendingListings = async () => {
  const response = await api.get("/admin/listings/pending");
  return response.data;
};

export const approveListing = async (id) => {
  const response = await api.patch(`/admin/listings/${id}/approve`);
  return response.data;
};

export const rejectListing = async (id) => {
  const response = await api.patch(`/admin/listings/${id}/reject`);
  return response.data;
};

export const getLandlords = async () => {
  const response = await api.get("/admin/landlords");
  return response.data;
};

export const getAdminPayments = async () => {
  const response = await api.get("/admin/payments");
  return response.data;
};

export const getListingHistory = async (params = {}) => {
  const response = await api.get("/admin/listings/history", { params });
  return response.data;
};

export const getAdminInquiries = async (params = {}) => {
  const response = await api.get("/admin/inquiries", { params });
  return response.data;
};