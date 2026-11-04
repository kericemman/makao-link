import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://127.0.0.1:5002/api" : "https://updates.rendahomes.com/api");
const localHosts = new Set(["localhost", "127.0.0.1"]);

const resolveApiUrl = () => {
  if (typeof window === "undefined") return configuredApiUrl;

  try {
    const apiUrl = new URL(configuredApiUrl, window.location.origin);
    if (localHosts.has(apiUrl.hostname) && localHosts.has(window.location.hostname)) {
      apiUrl.hostname = window.location.hostname;
    }
    return apiUrl.toString().replace(/\/$/, "");
  } catch {
    return configuredApiUrl;
  }
};

const api = axios.create({
  baseURL: resolveApiUrl()
});

export default api;
