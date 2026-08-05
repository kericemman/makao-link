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

export const moveListingToTrash = async (id, payload = {}) => {
  const response = await api.patch(`/admin/listings/${id}/trash`, payload);
  return response.data;
};

export const restoreListingFromTrash = async (id) => {
  const response = await api.patch(`/admin/listings/${id}/restore`);
  return response.data;
};

export const updateListingTrust = async (id, payload) => {
  const response = await api.patch(`/admin/listings/${id}/trust`, payload);
  return response.data;
};

export const permanentlyDeleteListing = async (id) => {
  const response = await api.delete(`/admin/listings/${id}/permanent`);
  return response.data;
};

export const getAdminSubscriptions = async (params = {}) => {
  const response = await api.get("/admin/subscriptions", { params });
  return response.data;
};

export const getAdminKycs = async (params = {}) => {
  const response = await api.get("/kyc/admin", { params });
  return response.data;
};

export const reviewAdminKyc = async (id, payload) => {
  const response = await api.patch(`/kyc/admin/${id}/review`, payload);
  return response.data;
};

export const getListingReports = async (params = {}) => {
  const response = await api.get("/listing-reports/admin", { params });
  return response.data;
};

export const updateListingReportStatus = async (id, payload) => {
  const response = await api.patch(`/listing-reports/admin/${id}/status`, payload);
  return response.data;
};

export const getRecentActivity = async () => {
  const response = await api.get("/admin/activity");
  return response.data;
};

export const getAgents = async () => {
  const response = await api.get("/admin/agents");
  return response.data;
};

export const createAgent = async (payload) => {
  const response = await api.post("/admin/agents", payload);
  return response.data;
};

export const updateAgent = async (id, payload) => {
  const response = await api.put(`/admin/agents/${id}`, payload);
  return response.data;
};

export const suspendAgent = async (id) => {
  const response = await api.put(`/admin/agents/${id}/suspend`);
  return response.data;
};

export const activateAgent = async (id) => {
  const response = await api.put(`/admin/agents/${id}/activate`);
  return response.data;
};

export const getAgentOnboarded = async (id) => {
  const response = await api.get(`/admin/agents/${id}/onboarded`);
  return response.data;
};

export const getAgentInstructions = async () => {
  const response = await api.get("/admin/agent-instructions");
  return response.data;
};

export const createAgentInstruction = async (payload) => {
  const response = await api.post("/admin/agent-instructions", payload);
  return response.data;
};


// App routes


export const getSupportCategories = () => api.get("/admin/support-categories");
export const createSupportCategory = (payload) => api.post("/admin/support-categories", payload);
export const updateSupportCategory = (id, payload) => api.patch(`/admin/support-categories/${id}`, payload);
export const deleteSupportCategory = (id) => api.delete(`/admin/support-categories/${id}`);

export const getSupportTickets = () => api.get("/admin/support-tickets");
export const updateSupportTicket = (id, payload) => api.patch(`/admin/support-tickets/${id}`, payload);

export const getContactInfo = () => api.get("/admin/contact-info");
export const updateContactInfo = (payload) => api.patch("/admin/contact-info", payload);

export const getUpdates = () => api.get("/admin/updates");
export const createUpdate = (payload) => api.post("/admin/updates", payload);
export const updateUpdate = (id, payload) => api.patch(`/admin/updates/${id}`, payload);
export const deleteUpdate = (id) => api.delete(`/admin/updates/${id}`);

export const getSubscribers = () => api.get("/admin/subscribers");

export const getPolicies = () => api.get("/admin/policies");
export const upsertPolicy = (payload) => api.post("/admin/policies", payload);
