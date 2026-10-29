import api from "../api/api";

export const getTeamMembers = async () => (await api.get("/landlord/team")).data;
export const inviteTeamMember = async (payload) => (await api.post("/landlord/team", payload)).data;
export const updateTeamMember = async (id, payload) => (await api.patch(`/landlord/team/${id}`, payload)).data;
export const getTeamReports = async () => (await api.get("/landlord/team/reports")).data;
export const assignListing = async (listingId, agentId) => (await api.patch(`/landlord/team/listings/${listingId}/assign`, { agentId })).data;
export const assignInquiry = async (inquiryId, agentId) => (await api.patch(`/landlord/team/inquiries/${inquiryId}/assign`, { agentId })).data;
export const recordDeal = async (payload) => (await api.post("/landlord/team/deals", payload)).data;
