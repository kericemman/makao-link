import api from "../api/api";

export const initializeSubscriptionPayment = async () => {
  const response = await api.post("/payments/initialize-subscription");
  return response.data;
};

export const getMySubscription = async () => {
  const response = await api.get("/payments/subscription");
  return response.data;
};


export const changeSubscriptionPlan = async (plan) => {
  const response = await api.patch("/payments/change-plan", { plan });
  return response.data;
};


