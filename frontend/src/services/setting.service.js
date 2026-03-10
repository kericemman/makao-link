import API from "../api/api"

export const getSettings = () => {
  return API.get("/settings")
}

export const updateSettings = (data) => {
  return API.put("/settings", data)
}