export const getApiErrorMessage = (error, fallback = "Could not load data from the backend.") => {
  if (error.response?.data?.message) return error.response.data.message;

  if (error.response?.status) {
    return `Backend returned ${error.response.status}.`;
  }

  if (error.code === "ERR_NETWORK") {
    return "Network request failed. Check that the backend is running and CORS allows this frontend URL.";
  }

  if (error.message) return error.message;

  return fallback;
};
