import API from "../api/api"


// Fetch all users
export const getUsers = () => {
  return API.get("/admin/users")
}


// Suspend a user
export const suspendUser = (id) => {
  return API.put(`/admin/users/${id}/suspend`)
}


// Fetch platform statistics
export const getAdminStats = () => {
  return API.get("/admin/stats")
}


// Approve property listing
export const approveProperty = (id) => {
  return API.put(`/admin/properties/${id}/approve`)
}


// Reject property listing
export const rejectProperty = (id) => {
  return API.put(`/admin/properties/${id}/reject`)
}


// Fetch pending KYC
export const getPendingKYC = () => {
    return API.get("/admin/kyc")
  }
  

// Approve KYC
export const approveKYC = (id) => {
  return API.put(`/admin/users/${id}/approve-kyc`)
}


// Fetch partner applications
export const getPartnerApplications = () => {
  return API.get("/partners/applications")
}

// Approve partner
export const approvePartner = (id) => {
  return API.put(`/partners/${id}/approve`)
}

// Reject partner
export const rejectPartner = (id) => {
  return API.put(`/partners/${id}/reject`)
}