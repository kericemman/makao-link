import api from "../api/api";

export const getMyKyc = async () => {
  const response = await api.get("/kyc/me");
  return response.data;
};

export const submitKyc = async (formData) => {
  const response = await api.post("/kyc/submit", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data;
};
