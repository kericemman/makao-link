import API from "../api/api"

export const sendMessage = (data) => {
  return API.post("/contact", data)
}

export const getMessages = () => {
  return API.get("/contact")
}

export const markMessageRead = (id) => {
  return API.put(`/contact/${id}/read`)
}

export const deleteMessage = (id) => {
  return API.delete(`/contact/${id}`)
}