import API from "../api/api"

export const getPartners = () => {
  return API.get("/partners")
}

export const applyPartner = (formData) => {
    return API.post("/partners/apply", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    })
  }