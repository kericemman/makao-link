import api from "../../api/api";

const BASE = "/admin/content";

// Support Categories
export const getSupportCategories = () =>
  api.get(`${BASE}/support-categories`);

export const createSupportCategory = (payload) =>
  api.post(`${BASE}/support-categories`, payload);

export const updateSupportCategory = (id, payload) =>
  api.patch(`${BASE}/support-categories/${id}`, payload);

export const deleteSupportCategory = (id) =>
  api.delete(`${BASE}/support-categories/${id}`);


// Support Tickets
export const getSupportTickets = () =>
  api.get(`${BASE}/support-tickets`);

export const updateSupportTicket = (id, payload) =>
  api.patch(`${BASE}/support-tickets/${id}`, payload);

export const deleteSupportTicket = (id) =>
  api.delete(`${BASE}/support-tickets/${id}`);


// Contact Info
export const getContactInfo = () =>
  api.get(`${BASE}/contact-info`);

export const updateContactInfo = (payload) =>
  api.patch(`${BASE}/contact-info`, payload);


// App Updates
export const getUpdates = () =>
  api.get(`${BASE}/updates`);

export const createUpdate = (payload) =>
  api.post(`${BASE}/updates`, payload);

export const updateUpdate = (id, payload) =>
  api.patch(`${BASE}/updates/${id}`, payload);

export const deleteUpdate = (id) =>
  api.delete(`${BASE}/updates/${id}`);


// Subscribers
export const getSubscribers = () =>
  api.get(`${BASE}/subscribers`);

export const updateSubscriber = (id, payload) =>
  api.patch(`${BASE}/subscribers/${id}`, payload);


// Policies
export const getPolicies = () =>
  api.get(`${BASE}/policies`);

export const upsertPolicy = (payload) =>
  api.post(`${BASE}/policies`, payload);

export const updatePolicy = (id, payload) =>
  api.patch(`${BASE}/policies/${id}`, payload);