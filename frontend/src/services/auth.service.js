import API from "../api/api"

export const loginUser = (data) => {
  return API.post("/auth/login", data)
}

export const registerUser = (data) => {
  return API.post("/auth/register", data)
}

export const forgotPassword = (email) => {
  return API.post("/auth/forgot-password", { email })
}

export const resetPassword = (token, password) => {
  return API.post(`/auth/reset-password/${token}`, { password })
}

export const getCurrentUser = () => {
  return API.get("/auth/me")
}