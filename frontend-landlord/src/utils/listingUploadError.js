export const getListingUploadErrorMessage = (error, action = "upload") => {
  const status = error?.response?.status;
  const code = error?.response?.data?.code;
  const serverMessage = error?.response?.data?.message;

  if (status >= 500) {
    return `We couldn't confirm that we saved this listing. Check My Listings before retrying to avoid duplicates. If it is not there, try again; if you uploaded many images, retry with fewer. Contact support if the problem continues.`;
  }
  if (serverMessage) return serverMessage;
  if (status === 413 || code === "LIMIT_FILE_SIZE") {
    return "The image upload is too large. Remove some images or choose smaller files, then try again.";
  }
  if (status === 400) {
    return "Some image details were not accepted. Use JPEG, PNG, WebP, or AVIF files and check your plan's image limit.";
  }
  if (error?.code === "ERR_NETWORK" || !error?.response) {
    return `We could not confirm that the ${action} completed. Check your connection and try again. If you selected many images, remove some and retry. Check your listings before submitting again.`;
  }
  return `We could not ${action}. Please try again. If the problem continues, contact support with the error code ${code || status || "unknown"}.`;
};
