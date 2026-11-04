import api from "../api/api";

export const getMyOrganizations = async () => (await api.get("/organizations")).data;
export const getOrganizationMembers = async (organizationId) => (await api.get(`/organizations/${organizationId}/members`)).data;
