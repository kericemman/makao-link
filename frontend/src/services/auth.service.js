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

export const forgotPassword = async (payload) => {
  const response = await api.post("/auth/forgot-password", payload);
  return response.data;
};

export const resetPassword = async (token, payload) => {
  const response = await api.post(`/auth/reset-password/${token}`, payload);
  return response.data;
};


export const loginUser = async (payload) => {
  const response = await api.post("/auth/login", payload);
  return response.data;
};

export const signupUser = async (payload) => {
  const response = await api.post("/auth/register", payload);
  return response.data;
};

export const socialLoginUser = async (payload) => {
  const response = await api.post("/auth/social-login", payload);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};