import api from "../api/api";

export const getLeads = async (params = {}) => (await api.get("/leads", { params })).data;
const organizationParams = (organizationId) => organizationId ? { params: { organizationId } } : {};
export const updateLeadStage = async (id, payload, organizationId) => (await api.patch(`/leads/${id}/status`, payload, organizationParams(organizationId))).data;
export const assignLead = async (id, agentId, organizationId) => (await api.post(`/leads/${id}/assignments`, { agentId }, organizationParams(organizationId))).data;
export const getAdvertiserViewings = async () => (await api.get("/viewings/advertiser")).data;
export const updateViewing = async (id, action, payload = {}) => (await api.post(`/viewings/${id}/${action}`, payload)).data;
