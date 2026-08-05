import API from "../api/api"


// Create support ticket
export const createTicket = (data) => {
  return API.post("/support", data)
}


// Get landlord tickets
export const getMyTickets = () => {
  return API.get("/support/mine")
}


// Get single ticket
export const getTicket = (id) => {
  return API.get(`/support/${id}`)
}


// Reply to ticket (landlord reply)
export const replyTicket = (id, message) => {
  return API.post(`/support/${id}/reply`, {
    message
  })
}