import API from "../api/api"

export const getMyProperties = () => {
  return API.get("/properties/my-properties")
}

export const createProperty = (formData) => {
    return API.post("/properties", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    })
  }


export const getProperties = (params) => {
  return API.get("/properties", { params })
}


export const deleteProperty = (id) => {
  return API.delete(`/properties/${id}`)
}

export const getProperty = (id) => {
  return API.get(`/properties/${id}`)
}

export const updateProperty = (id, data) => {
  return API.put(`/properties/${id}`, data)
}

export const updatePropertyStatus = (id, status) => {
    return API.patch(`/properties/${id}/status`, { status })
  }

export const getPropertiesByType = (type) => {
  return API.get("/properties", {
    params: { propertyType: type }
  })
}