import API from "../api/api"

export const getDashboardStats = () => {
  return API.get("/dashboard/stats")
}