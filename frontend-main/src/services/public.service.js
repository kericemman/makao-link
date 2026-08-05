import api from "../api/api";

export const getBlogPosts = async () => {
  const response = await api.get("/blog");
  return response.data;
};

export const getBlogPost = async (slug) => {
  const response = await api.get(`/blog/${slug}`);
  return response.data;
};

export const getContactInfo = async () => {
  const response = await api.get("/public/contact-info");
  return response.data;
};

export const getPolicy = async (slug) => {
  const response = await api.get(`/public/policies/${slug}`);
  return response.data;
};

export const sendContactMessage = async (payload) => {
  const response = await api.post("/contact", payload);
  return response.data;
};

export const subscribeToUpdates = async (payload) => {
  const response = await api.post("/public/subscribe", {
    ...payload,
    source: "website"
  });
  return response.data;
};
