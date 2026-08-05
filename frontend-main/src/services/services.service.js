import api from "../api/api";

export const getServiceCategories = async () => {
  const response = await api.get("/services");
  return response.data;
};

export const getPartnersByCategory = async (category) => {
  const response = await api.get(`/services/category/${category}`);
  return response.data;
};
