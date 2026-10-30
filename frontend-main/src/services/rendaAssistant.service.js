import api from "../api/api";

const assistantApi = api.create({ withCredentials: true });

export const getRendaWebConsent = async () => (await assistantApi.get("/renda-assistant/web/consent")).data;
export const getRendaWebConversation = async () => (await assistantApi.get("/renda-assistant/web/conversations")).data;
export const createRendaWebConversation = async () =>
  (await assistantApi.post("/renda-assistant/web/conversations", { consentAccepted: true })).data;
export const sendRendaWebMessage = async (message) =>
  (await assistantApi.post("/renda-assistant/web/conversations/messages", { message })).data;
export const resetRendaWebConversation = async () =>
  (await assistantApi.delete("/renda-assistant/web/conversations")).data;
