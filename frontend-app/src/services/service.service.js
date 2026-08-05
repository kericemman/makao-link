import api from "../api/api";

export const getServiceCategories = async () => {
  const response = await api.get("/services");
  return response.data;
};

export const getPartnersByCategory = async (category) => {
  const response = await api.get(`/services/category/${category}`);
  return response.data;
};

export const createPartnerApplication = async (formData) => {
  const response = await api.post("/services/apply", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

export const initializePartnerApplicationPayment = async (id) => {
  const response = await api.post(`/services/apply/${id}/pay`);
  return response.data;
};

export const getPartnerApplicationStatus = async (id) => {
  const response = await api.get(`/services/apply/${id}/status`);
  return response.data;
};

export const verifyPartnerApplicationPayment = async (
    reference,
    applicationId
  ) => {
    const { data } = await api.get(
      `/services/apply/payment/verify/${reference}`,
      {
        params: { applicationId }
      }
    );

    return data;
  };