import api from "../api/api";

export const getAgentDashboard = async () => {
  const response = await api.get("/agents/dashboard");
  return response.data;
};

export const getAgentProfile = async () => {
  const response = await api.get("/agents/me");
  return response.data;
};

export const getAgentOnboardedLandlords = async () => {
  const response = await api.get("/agents/onboarded-landlords");
  return response.data;
};

export const getAgentInstructions = async () => {
  const response = await api.get("/agents/instructions");
  return response.data;
};
