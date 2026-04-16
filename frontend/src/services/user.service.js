import api from "../api/api";

export const getProfile = async () => {
  const response = await api.get("/users/profile");
  return response.data;
};

export const updateProfile = async (formData) => {
  const response = await api.patch("/users/profile", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

export const changePassword = async (payload) => {
  const response = await api.patch("/users/change-password", payload);
  return response.data;
};