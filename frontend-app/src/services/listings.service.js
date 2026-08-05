import api from "../api/api";

export const getPublicListings = async (params = {}) => {
  const response = await api.get("/listings", { params });
  return response.data;
};

export const getSingleListing = async (id) => {
  const response = await api.get(`/listings/${id}`);
  return response.data;
};

export const createListing = async (formData) => {
  const response = await api.post("/listings", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

export const getMyListings = async () => {
  const response = await api.get("/listings/landlord/my/all");
  return response.data;
};

export const markListingTaken = async (id) => {
  const response = await api.patch(`/listings/${id}/mark-taken`);
  return response.data;
};

export const markListingAvailable = async (id) => {
  const response = await api.patch(`/listings/${id}/mark-available`);
  return response.data;
};


// get one listing (owner)
export const getMyListingById = async (id) => {
  const response = await api.get(`/listings/${id}`);
  return response.data;
};  


export const updateListing = async (id, formData) => {
  const response = await api.put(`/listings/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

export const deleteListing = async (id) => {
  const response = await api.delete(`/listings/${id}`);
  return response.data;
};


export const getListingMeta = async () => {
  const response = await api.get("/listings/meta");
  return response.data;
};


export const getFeaturedListings = async () => {
  const response = await api.get("/listings/featured");
  return response.data;
};

export const getRecentListings = async (ids = []) => {
  const response = await api.get("/listings/recent", {
    params: {
      ids: ids.join(",")
    }
  });

  return response.data;
};


