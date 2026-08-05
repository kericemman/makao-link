import api from "../api/api";

export const createPublicInquiry = async ({ listingId, name, email, phone, message }) => {
  const response = await api.post("/inquiries", {
    listingId,
    name,
    email,
    phone,
    message
  });

  return response.data;
};
