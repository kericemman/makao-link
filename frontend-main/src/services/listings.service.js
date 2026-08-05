import api from "../api/api";

const defaultPublicParams = {
  status: "approved",
  availability: "available",
  isActive: true
};

const normalizeListingResponse = (data) => {
  if (Array.isArray(data)) {
    return {
      listings: data,
      pagination: null
    };
  }

  return {
    listings: data?.listings || [],
    pagination: data?.pagination || null
  };
};

export const getPublicListings = async (params = {}) => {
  const response = await api.get("/listings", {
    params: {
      ...defaultPublicParams,
      ...params
    }
  });
  return normalizeListingResponse(response.data);
};

export const getSingleListing = async (id) => {
  const response = await api.get(`/listings/${id}`);
  return response.data;
};

export const getListingMeta = async () => {
  const response = await api.get("/listings/meta");
  return response.data;
};

export const getFeaturedListings = async (params = {}) => {
  const response = await api.get("/listings/featured", { params });
  return normalizeListingResponse(response.data);
};

export const getRecentListings = async (params = {}) => {
  const response = await api.get("/listings/recent", { params });
  return normalizeListingResponse(response.data);
};

export const reportListing = async (payload) => {
  const response = await api.post("/listing-reports", payload);
  return response.data;
};
