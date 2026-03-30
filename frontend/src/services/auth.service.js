import api from "../api/api";

export const registerLandlord = async (payload) => {
  const response = await api.post("/auth/register", payload);
  return response.data;
};

export const loginLandlord = async (payload) => {
  const response = await api.post("/auth/login", payload);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};