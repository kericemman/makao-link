import API from "../api/api"

export const sendInquiry = (data) => {
  return API.post("/inquiries", data)
}

export const getMyInquiries = () => {
  return API.get("/inquiries/my-inquiries")
}