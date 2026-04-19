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


export const getServiceApplications = async (params = {}) => {
  const response = await api.get("/admin/service-applications", { params });
  return response.data;
};

export const getServiceApplicationById = async (id) => {
  const response = await api.get(`/admin/service-applications/${id}`);
  return response.data;
};

export const approveServiceApplication = async (id) => {
  const response = await api.patch(`/admin/service-applications/${id}/approve`);
  return response.data;
};

export const rejectServiceApplication = async (id) => {
  const response = await api.patch(`/admin/service-applications/${id}/reject`);
  return response.data;
};

export const getAllListings = async (params = {}) => {
  const response = await api.get("/admin/listings", { params });
  return response.data;
};

export const getAdminSubscriptions = async (params = {}) => {
  const response = await api.get("/admin/subscriptions", { params });
  return response.data;
};

export const getRecentActivity = async () => {
  const response = await api.get("/admin/activity");
  return response.data;
};