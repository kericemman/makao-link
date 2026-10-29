import api from "../api/api";

export const getSavedHomes = async () => {
  const response = await api.get("/users/saved-listings");
  return response.data.savedListings || [];
};

export const saveHome = async (listingId) => {
  const response = await api.put(`/users/saved-listings/${listingId}`);
  return response.data.savedListings || [];
};

export const removeSavedHome = async (listingId) => {
  const response = await api.delete(`/users/saved-listings/${listingId}`);
  return response.data.savedListings || [];
};
