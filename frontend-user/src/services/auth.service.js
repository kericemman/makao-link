import api from "../api/api";

export const registerUser = async (payload) => {
  const response = await api.post("/auth/user/register", { ...payload, role: payload.role || "user" });
  return response.data;
};

export const loginUser = async (payload) => {
  const response = await api.post("/auth/login", payload);
  return response.data;
};

export const verifyEmail = async (payload) => {
  const response = await api.post("/auth/verify-email", payload);
  return response.data;
};

export const resendEmailOtp = async (email) => {
  const response = await api.post("/auth/resend-email-otp", { email });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await api.post(`/auth/reset-password/${token}`, { password });
  return response.data;
};
